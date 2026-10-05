import { config } from "./config.js";
import { getSession, clearSession, isDemo } from "./session.js";
import { request, asList, unwrap } from "./api.js";
import { demo } from "./demo.js";
export const $ = (selector, root = document) => root.querySelector(selector);
export const money = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value) || 0,
  );
export const number = (value) =>
  new Intl.NumberFormat("pt-BR").format(Number(value) || 0);
export const date = (value) => {
  if (!value) return "—";
  const parsed = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value,
  );
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("pt-BR");
};
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function badge(label, kind = "") {
  return `<span class="badge ${kind}">${escapeHTML(label)}</span>`;
}
export function stockStatus(row) {
  return Number(row.saldo_estoque) === 0
    ? badge("Sem estoque", "danger")
    : Number(row.saldo_estoque) <= Number(row.estoque_minimo)
      ? badge("Estoque baixo", "warning")
      : badge("Disponível", "success");
}
export async function list(path) {
  if (isDemo()) return structuredClone(demo[path] || []);
  try {
    return asList(await request(path));
  } catch (error) {
    // Somente as respostas de vazio conhecidas; 404 de rota nunca vira lista vazia.
    if (
      error.status === 404 &&
      ((path === "/entrada" &&
        error.message === "Nenhuma entrada encontrada") ||
        (path === "/devolucao" &&
          error.message === "Nenhuma devolução encontrada"))
    )
      return [];
    throw error;
  }
}
export async function detail(path, id) {
  if (isDemo())
    return structuredClone(
      (demo[path] || []).find(
        (row) =>
          Number(
            row.id_sku ??
              row.id_venda ??
              row.idEntrada ??
              row.idDevolucao ??
              row.id_funcionario ??
              row.id_cargo,
          ) === Number(id),
      ),
    );
  return unwrap(await request(`${path}/${encodeURIComponent(id)}`));
}
export function showError(target, error) {
  target.hidden = false;
  target.textContent = error.message || String(error);
  target.setAttribute("role", "alert");
}
export function toast(message) {
  const area = $("#toast");
  area.textContent = message;
  area.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    area.hidden = true;
  }, 5000);
}
export function enabled(feature) {
  return !isDemo() && config.features[feature] === true;
}
export function guardForm(form, feature) {
  const button = $('[type="submit"]', form);
  const note = $("[data-availability]", form);
  const available = enabled(feature);
  if (button) button.disabled = !available;
  if (note) {
    note.hidden = available;
    note.textContent = isDemo()
      ? "Demonstração somente para consulta. Entre com sua conta para usar as operações disponíveis."
      : "Esta operação está temporariamente indisponível.";
  }
  return available;
}
export async function submitForm(form, feature, action) {
  if (!enabled(feature) || form.dataset.busy === "true") return;
  if (!form.reportValidity()) return;
  const error = $("[data-form-error]", form);
  error.hidden = true;
  const button = $('[type="submit"]', form);
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Salvando…";
  form.dataset.busy = "true";
  try {
    await action();
  } catch (err) {
    showError(error, err);
  } finally {
    button.disabled = !enabled(feature);
    button.textContent = original;
    delete form.dataset.busy;
  }
}
export function exportCSV(filename, headers, rows) {
  // Neutraliza fórmulas antes de abrir o CSV em Excel/LibreOffice.
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv =
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(cell).join(";")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function mountShell(page) {
  const nav = [
    ["dashboard", "Visão geral", "◫"],
    ["inventory", "Estoque", "▤"],
    ["registration", "Catálogo", "◇"],
    ["movements", "Movimentações", "⇄"],
    ["reports", "Relatórios", "▥"],
    ["users", "Equipe e cargos", "♙"],
  ];
  $("#shell").innerHTML =
    `<aside class="sidebar" id="sidebar"><a class="brand" href="dashboard.html"><span class="brand-mark">N</span><span>Nômade<small>Gestão de estoque</small></span></a><p class="nav-label">ESPAÇO DE TRABALHO</p><nav aria-label="Navegação principal">${nav.map(([id, label, icon]) => `<a href="${id}.html" ${id === page ? 'aria-current="page"' : ""}><span class="nav-icon" aria-hidden="true">${icon}</span>${label}</a>`).join("")}</nav><div class="sidebar-bottom"><div class="store-card"><span class="store-dot"></span><div>Controle da loja<small>Estoque · vendas · equipe</small></div></div><button id="theme-toggle" type="button">◐ <span>Alternar tema</span></button></div></aside><div class="workspace"><header class="topbar"><button class="icon-button mobile-menu" id="menu-toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="sidebar">☰</button><div class="breadcrumb">Nômade <span>/</span> <strong>${nav.find(([id]) => id === page)[1]}</strong></div><div class="profile"><span class="avatar" aria-hidden="true">N</span><span id="profile-name"></span><button id="logout" class="text-button" type="button">Sair</button></div></header><div class="demo-banner" id="demo-banner" hidden><strong>Modo demonstração</strong><span>Dados fictícios · somente consulta</span><a href="login.html">Entrar na conta →</a></div><main id="content" tabindex="-1"></main><footer class="footer">Nômade <span>Organização em cada passo.</span></footer></div>`;
  const session = getSession();
  $("#profile-name").textContent = isDemo()
    ? "Visitante"
    : session?.funcionario?.nome ||
      session?.funcionario?.email ||
      "Minha conta";
  $("#demo-banner").hidden = !isDemo();
  let dark = false;
  try {
    dark = localStorage.getItem("nomade.theme") === "dark";
  } catch {
    /* Navegação privada */
  }
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  $("#theme-toggle").addEventListener("click", () => {
    const theme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("nomade.theme", theme);
    } catch {
      /* Tema permanece nesta página */
    }
  });
  $("#menu-toggle").addEventListener("click", () => {
    const open = $("#sidebar").classList.toggle("is-open");
    $("#menu-toggle").setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      $("#sidebar").classList.remove("is-open");
      $("#menu-toggle").setAttribute("aria-expanded", "false");
    }
  });
  $("#logout").addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try {
      if (!isDemo() && session?.refreshToken)
        await request("/auth/logout", {
          method: "POST",
          body: { refreshToken: session.refreshToken },
          anonymous: true,
        });
    } catch {
      toast(
        "Sessão local encerrada. O servidor não confirmou a revogação do acesso.",
      );
      clearSession();
      setTimeout(() => location.replace("login.html?logout=unconfirmed"), 1800);
      return;
    }
    clearSession();
    location.replace("login.html");
  });
}
export function heading(eyebrow, title, subtitle, actions = "") {
  return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="subtitle">${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;
}
export function table(headers, id) {
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="Tabela de registros"><table><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody id="${id}"></tbody></table></div>`;
}
export function emptyRow(cols, text = "Nenhum registro encontrado.") {
  return `<tr><td colspan="${cols}" class="empty">${text}</td></tr>`;
}
export function field(label, name, attrs = "") {
  return `<label class="field">${label}<input name="${name}" ${attrs}></label>`;
}
export function select(label, name, options, attrs = "") {
  return `<label class="field">${label}<select name="${name}" ${attrs}>${options}</select></label>`;
}
export const options = (rows, id, name) =>
  `<option value="">Selecione</option>${rows.map((row) => `<option value="${escapeHTML(row[id])}">${escapeHTML(row[name])}</option>`).join("")}`;
export const formMessages =
  '<p class="notice" data-availability hidden></p><p class="error" data-form-error hidden></p>';
