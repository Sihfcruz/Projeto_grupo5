import { useRef, useState } from "react";
import { request } from "../services/api.js";
import { saveSession, clearSession } from "../services/session.js";
import { ErrorMessage } from "../components/common.jsx";
export default function Login() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const params = new URLSearchParams(location.search);
  async function login(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (pending.current || !form.reportValidity()) return;
    pending.current = true;
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(form));
    try {
      clearSession();
      const data = await request("/auth/login", {
        method: "POST",
        anonymous: true,
        body: { email: values.email.trim().toLowerCase(), senha: values.senha },
      });
      if (!data?.acessToken || !data?.funcionario?.id)
        throw new Error("A API retornou uma sessão incompleta.");
      saveSession({
        mode: "api",
        acessToken: data.acessToken,
        refreshToken: data.refreshToken,
        funcionario: data.funcionario,
      });
      form.reset();
      location.assign("dashboard.html");
    } catch (err) {
      setError(err.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="login-layout">
      <section className="login-art" aria-label="Nômade">
        <a className="brand" href="login.html">
          <span className="brand-mark">N</span>
          <span>
            Nômade<small>Gestão de estoque</small>
          </span>
        </a>
        <div className="login-copy">
          <p className="eyebrow">ORGANIZAÇÃO EM CADA PASSO</p>
          <h1>
            Seu estoque.
            <br />
            Sua equipe.
            <br />
            Tudo no lugar.
          </h1>
          <p>
            Uma visão clara da sua loja, do primeiro recebimento à próxima
            venda.
          </p>
        </div>
        <small>Estoque · catálogo · movimentações</small>
      </section>
      <section className="login-side">
        <div className="login-box">
          <p className="eyebrow">BEM-VINDO AO NÔMADE</p>
          <h1>Acesse sua conta</h1>
          <p className="subtitle">
            Entre com seu e-mail e sua senha de funcionário.
          </p>
          {(params.has("expired") || params.has("logout")) && (
            <p className="notice">
              {params.has("expired")
                ? "Sua sessão expirou. Entre novamente."
                : "A sessão local foi encerrada, mas o servidor não confirmou a revogação do token."}
            </p>
          )}
          <ErrorMessage message={error} />
          <form id="form-login" onSubmit={login}>
            <label className="field" htmlFor="email">
              E-mail
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={150}
                placeholder="voce@exemplo.com"
              />
            </label>
            <label className="field" htmlFor="senha">
              Senha
              <span className="password-wrap">
                <input
                  id="senha"
                  name="senha"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  required
                />
                <button
                  id="show-password"
                  type="button"
                  aria-controls="senha"
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? "Ocultar" : "Mostrar"}
                </button>
              </span>
            </label>
            <button
              className="button"
              id="login-submit"
              type="submit"
              disabled={busy}
            >
              {busy ? "Entrando…" : "Entrar →"}
            </button>
          </form>
          <div className="login-divider">CONHEÇA O SISTEMA</div>
          <button
            className="button secondary"
            id="demo-button"
            type="button"
            disabled={busy}
            onClick={() => {
              saveSession({ mode: "demo" });
              location.assign("dashboard.html");
            }}
          >
            Visualizar demonstração
          </button>
          <p className="login-foot">
            Demonstração com dados fictícios e sem gravações.
          </p>
        </div>
      </section>
    </main>
  );
}
