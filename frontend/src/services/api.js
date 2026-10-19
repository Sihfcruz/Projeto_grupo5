import { config } from "./config.js";
import { getSession, saveSession, clearSession, isDemo } from "./session.js";

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}
let refreshing;
async function renewSession() {
  if (!refreshing) {
    refreshing = (async () => {
      const session = getSession();
      if (!session?.refreshToken)
        throw new ApiError("Sua sessão expirou. Entre novamente.", 401);
      const result = await request("/auth/refresh-token", {
        method: "POST",
        body: { refreshToken: session.refreshToken },
        anonymous: true,
      });
      if (typeof result?.acessToken !== "string")
        throw new ApiError("Resposta de autenticação inválida.", 401);
      saveSession({ ...session, acessToken: result.acessToken });
    })().finally(() => {
      refreshing = undefined;
    });
  }
  return refreshing;
}
export async function request(
  path,
  { method = "GET", body, anonymous = false, retry = true } = {},
) {
  if (isDemo() && !anonymous)
    throw new ApiError("A demonstração é somente para consulta.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const session = getSession();
  if (!anonymous && session?.acessToken)
    headers.Authorization = `Bearer ${session.acessToken}`;
  try {
    const response = await fetch(`${config.apiUrl.replace(/\/$/, "")}${path}`, {
      method,
      headers,
      signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const raw = await response.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      throw new ApiError(
        response.status === 404
          ? "A rota solicitada não está disponível."
          : "A API retornou uma resposta inválida.",
        response.status,
      );
    }
    if (!response.ok) {
      const message =
        data?.erro ||
        data?.mensagem ||
        data?.message ||
        `Falha na requisição (${response.status}).`;
      const expired =
        response.status === 401 ||
        (response.status === 403 && /token/i.test(message));
      if (!anonymous && expired) {
        if (retry && method === "GET") {
          try {
            await renewSession();
          } catch {
            clearSession();
            location.replace("login.html?expired=1");
            throw new ApiError("Sua sessão expirou.", 401);
          }
          return request(path, { method, body, anonymous, retry: false });
        }
        clearSession();
        location.replace("login.html?expired=1");
      }
      throw new ApiError(
        response.status === 429
          ? "Muitas solicitações. Aguarde antes de tentar novamente."
          : message,
        response.status,
      );
    }
    if (data?.sucesso === false)
      throw new ApiError(
        data.erro || "A operação não foi concluída.",
        response.status,
      );
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error.name === "AbortError"
        ? method === "GET"
          ? "O servidor demorou para responder. Tente novamente."
          : "Sem confirmação do servidor. Consulte o histórico antes de reenviar para evitar duplicidade."
        : method === "GET"
          ? "Não foi possível conectar à API. Verifique se o servidor está disponível."
          : "Conexão interrompida. Consulte o histórico antes de reenviar a operação.",
    );
  } finally {
    clearTimeout(timer);
  }
}
export function unwrap(data) {
  return data?.dados ?? data;
}
export function asList(data) {
  const value = unwrap(data);
  if (!Array.isArray(value))
    throw new ApiError("A API não retornou a lista esperada.");
  return value;
}
