import test, { beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { request, asList } from "./api.js";
import { saveSession, getSession } from "./session.js";
import { saleData, enabled } from "./data.js";

const originalFetch = globalThis.fetch;
const storage = new Map();
globalThis.sessionStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
const redirects = [];
globalThis.location = { replace: (url) => redirects.push(url) };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
beforeEach(() => {
  storage.clear();
  redirects.length = 0;
  saveSession({ mode: "api", accessToken: "old-access", refreshToken: "old-refresh", funcionario: { id: 1, papel: "admin" } });
});
after(() => { globalThis.fetch = originalFetch; });

test("envia o token accessToken no Authorization", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers.Authorization, "Bearer old-access");
    assert.equal(url, "http://localhost:3000/marca");
    return json({ sucesso: true, dados: [{ idMarca: 1, nome: "Marca" }] });
  };
  assert.equal(asList(await request("/marca"))[0].idMarca, 1);
});
test("renova ambos os tokens e repete POST recusado antes da gravação", async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    if (url.endsWith("/auth/refresh-token")) {
      assert.deepEqual(JSON.parse(options.body), { refreshToken: "old-refresh" });
      return json({ accessToken: "new-access", refreshToken: "new-refresh" });
    }
    if (options.headers.Authorization === "Bearer old-access") return json({ erro: "Token expirado" }, 401);
    assert.equal(options.headers.Authorization, "Bearer new-access");
    assert.deepEqual(JSON.parse(options.body), { nome: "Nike" });
    return json({ sucesso: true }, 201);
  };
  await request("/marca", { method: "POST", body: { nome: "Nike" } });
  assert.equal(calls.length, 3);
  assert.equal(getSession().accessToken, "new-access");
  assert.equal(getSession().refreshToken, "new-refresh");
});
test("requisições concorrentes compartilham uma renovação", async () => {
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith("/auth/refresh-token")) {
      refreshes++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return json({ accessToken: "new-access", refreshToken: "new-refresh" });
    }
    return options.headers.Authorization === "Bearer old-access"
      ? json({ erro: "Token expirado" }, 401) : json({ dados: [] });
  };
  await Promise.all([request("/marca"), request("/modelo")]);
  assert.equal(refreshes, 1);
});
test("refresh recusado encerra a sessão", async () => {
  globalThis.fetch = async () => json({ erro: "Token inválido" }, 401);
  await assert.rejects(request("/marca"), { status: 401 });
  assert.equal(getSession(), null);
  assert.deepEqual(redirects, ["login.html?expired=1"]);
});
test("logout 204 aceita corpo vazio", async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await request("/auth/logout", { method: "POST", anonymous: true, body: { refreshToken: "token" } }), null);
});
test("falha de rede numa escrita não reenvia operação", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new TypeError("offline"); };
  await assert.rejects(request("/venda", { method: "POST", body: {} }), /Consulte o histórico/);
  assert.equal(calls, 1);
});
test("403 administrativo preserva a sessão", async () => {
  globalThis.fetch = async () => json({ erro: "Acesso restrito a administrador" }, 403);
  await assert.rejects(request("/cargo"), { status: 403 });
  assert.ok(getSession());
  assert.deepEqual(redirects, []);
});
test("demonstração bloqueia gravações e permissões administrativas respeitam papel", async () => {
  saveSession({ mode: "demo" });
  assert.equal(enabled("createBrand"), false);
  await assert.rejects(request("/marca", { method: "POST", body: {} }), /somente para consulta/);
  saveSession({ mode: "api", funcionario: { papel: "funcionario" } });
  assert.equal(enabled("adjustStock"), false);
  assert.equal(enabled("createSale"), true);
});
test("venda calcula descontos em centavos", () => {
  assert.equal(saleData([{ idSku: 1, quantidade: 3, descontoItem: 0.1 }],
    [{ id_sku: 1, preco_venda: "0.30" }], 0.2).totalCent, 60);
});
