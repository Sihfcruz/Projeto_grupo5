import {
  $,
  heading,
  table,
  emptyRow,
  list,
  detail,
  escapeHTML as e,
  number,
  money,
  stockStatus,
  showError,
  normalize,
  exportCSV,
} from "./ui.js";
let rows = [],
  filtered = [],
  page = 1;
const pageSize = 10;
export async function init() {
  $("#content").innerHTML =
    heading(
      "DISPONIBILIDADE",
      "Estoque",
      "Cada modelo, tamanho e cor em uma visão única.",
      '<button class="button secondary" id="export" disabled>↓ Exportar CSV</button><a class="button" href="movements.html">+ Recebimento</a>',
    ) +
    `<p class="error" id="error" hidden></p><section class="panel"><div class="toolbar"><label class="field search-field">Buscar no estoque<input id="search" type="search" placeholder="Modelo, marca, cor ou código de barras"></label><label class="field">Marca<select id="brand"><option value="">Todas as marcas</option></select></label><label class="field">Situação<select id="status"><option value="">Todas as situações</option><option value="low">Estoque baixo ou zerado</option><option value="available">Disponível</option><option value="zero">Sem estoque</option></select></label><button class="button secondary" id="refresh">↻ Atualizar</button></div>${table(["Modelo / marca", "SKU / código", "Tamanho / cor", "Preço de venda", "Saldo", "Situação", "Ações"], "rows")}<div class="pagination"><span id="count" aria-live="polite">Carregando…</span><div><button class="button secondary" id="prev">Anterior</button><button class="button secondary" id="next">Próxima</button></div></div></section>`;
  $("#status").value = new URLSearchParams(location.search).get("status") || "";
  ["search", "brand", "status"].forEach((id) =>
    $(`#${id}`).addEventListener(id === "search" ? "input" : "change", () => {
      page = 1;
      render();
    }),
  );
  $("#prev").addEventListener("click", () => {
    page--;
    render();
  });
  $("#next").addEventListener("click", () => {
    page++;
    render();
  });
  $("#refresh").addEventListener("click", load);
  $("#export").addEventListener("click", () =>
    exportCSV(
      "nomade-estoque.csv",
      [
        "SKU",
        "Modelo",
        "Marca",
        "Tamanho",
        "Cor",
        "Código de barras",
        "Preço de venda",
        "Saldo",
        "Estoque mínimo",
      ],
      filtered.map((r) => [
        r.id_sku,
        r.nome_modelo,
        r.nome_marca,
        r.tamanho,
        r.cor,
        r.codigo_barras,
        r.preco_venda,
        r.saldo_estoque,
        r.estoque_minimo,
      ]),
    ),
  );
  $("#rows").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-detail]");
    if (!button) return;
    $("#dialog-title").textContent = "Detalhes do SKU";
    $("#dialog-content").textContent = "Carregando…";
    $("#detail-dialog").showModal();
    try {
      const row = await detail("/estoque", button.dataset.detail);
      $("#dialog-content").innerHTML = `<dl class="detail-grid">${[
        ["Modelo", row.nome_modelo],
        ["Marca", row.nome_marca],
        ["SKU", row.id_sku],
        ["Código de barras", row.codigo_barras],
        ["Tamanho", row.tamanho],
        ["Cor", row.cor],
        ["Preço de venda", money(row.preco_venda)],
        ["Saldo", number(row.saldo_estoque)],
        ["Estoque mínimo", number(row.estoque_minimo)],
      ]
        .map(
          ([label, value]) =>
            `<div><dt>${label}</dt><dd>${e(value)}</dd></div>`,
        )
        .join("")}</dl>${stockStatus(row)}`;
    } catch (err) {
      showError($("#dialog-content"), err);
    }
  });
  await load();
}
async function load() {
  $("#refresh").disabled = true;
  $("#export").disabled = true;
  $("#error").hidden = true;
  $("#rows").innerHTML = emptyRow(7, "Carregando…");
  try {
    rows = await list("/estoque");
    const current = $("#brand").value;
    $("#brand").innerHTML =
      '<option value="">Todas as marcas</option>' +
      [...new Set(rows.map((r) => r.nome_marca).filter(Boolean))]
        .sort()
        .map((name) => `<option value="${e(name)}">${e(name)}</option>`)
        .join("");
    $("#brand").value = current;
    page = 1;
    render();
    $("#export").disabled = false;
  } catch (err) {
    rows = [];
    filtered = [];
    showError($("#error"), err);
    $("#rows").innerHTML = emptyRow(
      7,
      "Estoque indisponível. Use Atualizar para tentar novamente.",
    );
    $("#count").textContent = "Sem dados";
    $("#prev").disabled = true;
    $("#next").disabled = true;
  } finally {
    $("#refresh").disabled = false;
  }
}
function render() {
  const term = normalize($("#search").value);
  const brand = $("#brand").value;
  const status = $("#status").value;
  filtered = rows.filter(
    (r) =>
      normalize(
        [
          r.nome_modelo,
          r.nome_marca,
          r.cor,
          r.codigo_barras,
          r.id_sku,
          r.tamanho,
        ].join(" "),
      ).includes(term) &&
      (!brand || r.nome_marca === brand) &&
      (!status ||
        (status === "low" &&
          Number(r.saldo_estoque) <= Number(r.estoque_minimo)) ||
        (status === "available" &&
          Number(r.saldo_estoque) > Number(r.estoque_minimo)) ||
        (status === "zero" && Number(r.saldo_estoque) === 0)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  page = Math.max(1, Math.min(page, pages));
  $("#rows").innerHTML =
    filtered
      .slice((page - 1) * pageSize, page * pageSize)
      .map(
        (r) =>
          `<tr><td><strong>${e(r.nome_modelo)}</strong><small>${e(r.nome_marca)}</small></td><td>#${e(r.id_sku)}<small>${e(r.codigo_barras)}</small></td><td>${e(r.tamanho)} · ${e(r.cor)}</td><td class="numeric">${money(r.preco_venda)}</td><td class="numeric">${number(r.saldo_estoque)}<small>Mínimo: ${number(r.estoque_minimo)}</small></td><td>${stockStatus(r)}</td><td><button class="text-button" data-detail="${e(r.id_sku)}">Detalhes</button></td></tr>`,
      )
      .join("") || emptyRow(7, "Nenhum SKU corresponde aos filtros.");
  $("#count").textContent =
    `${number(filtered.length)} SKUs · Página ${page} de ${pages}`;
  $("#prev").disabled = page === 1;
  $("#next").disabled = page === pages;
}
