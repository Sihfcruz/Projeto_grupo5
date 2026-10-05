import { requireSession } from "./session.js";
import { mountShell, $ } from "./ui.js";
const page = document.body.dataset.page;
if (requireSession()) {
  mountShell(page);
  $("#close-dialog").addEventListener("click", () =>
    $("#detail-dialog").close(),
  );
  const modules = {
    dashboard: "./dashboard.js",
    inventory: "./inventory.js",
    registration: "./registration.js",
    movements: "./movements.js",
    reports: "./reports.js",
    users: "./users.js",
  };
  import(modules[page])
    .then((module) => module.init())
    .catch(() => {
      $("#content").textContent =
        "Não foi possível carregar esta página. Atualize para tentar novamente.";
    });
}
