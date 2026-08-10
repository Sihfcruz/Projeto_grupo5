const formLogin = document.querySelector("#form-login");
const senha = document.querySelector("#senha");

const olhoFechado = document.querySelector("#form-login svg:nth-of-type(3)");

const olhoAberto = document.querySelector("#form-login svg:nth-of-type(4)");

olhoFechado.addEventListener("click", mostrarSenha);
olhoAberto.addEventListener("click", mostrarSenha);

function mostrarSenha() {
  formLogin.classList.toggle("mostrar-senha");

  if (senha.type === "password") {
    senha.type = "text";
  } else {
    senha.type = "password";
  }
}
