import { request } from "./api.js";
import { saveSession, clearSession } from "./session.js";
const form = document.querySelector("#form-login");
const info = document.querySelector("#login-info");
const params = new URLSearchParams(location.search);
if (params.has("expired") || params.has("logout")) {
  info.hidden = false;
  info.textContent = params.has("expired")
    ? "Sua sessão expirou. Entre novamente."
    : "A sessão local foi encerrada, mas o servidor não confirmou a revogação do token.";
}
document.querySelector("#show-password").addEventListener("click", (event) => {
  const input = document.querySelector("#senha");
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  event.currentTarget.textContent = show ? "Ocultar" : "Mostrar";
  event.currentTarget.setAttribute("aria-pressed", String(show));
});
document.querySelector("#demo-button").addEventListener("click", () => {
  saveSession({ mode: "demo" });
  location.assign("dashboard.html");
});
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.querySelector("#login-submit");
  if (button.disabled) return;
  const error = document.querySelector("#login-error");
  error.hidden = true;
  button.disabled = true;
  button.textContent = "Entrando…";
  try {
    clearSession();
    const data = await request("/auth/login", {
      method: "POST",
      anonymous: true,
      body: {
        email: form.email.value.trim().toLowerCase(),
        senha: form.senha.value,
      },
    });
    if (!data?.acessToken || !data?.funcionario?.id)
      throw new Error("A API retornou uma sessão incompleta.");
    saveSession({
      mode: "api",
      acessToken: data.acessToken,
      refreshToken: data.refreshToken,
      funcionario: data.funcionario,
    });
    form.senha.value = "";
    location.assign("dashboard.html");
  } catch (err) {
    error.textContent = err.message;
    error.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = "Entrar →";
  }
});
