import {
  $,
  heading,
  table,
  emptyRow,
  list,
  escapeHTML as e,
  number,
  money,
  stockStatus,
  showError,
  date,
} from "./ui.js";
export async function init() {
  $("#content").innerHTML =
    heading(
      "PAINEL DA LOJA",
      "Visão geral",
      "Acompanhe a disponibilidade dos seus calçados e os recebimentos.",
      '<button class="button secondary" id="refresh">↻ Atualizar</button><a class="button" href="movements.html">+ Movimentação</a>',
    ) +
    `
    <p class="error" id="stock-error" hidden></p><section class="stats" aria-label="Resumo do estoque">
    ${["Unidades disponíveis", "SKUs ativos", "Valor potencial de venda", "SKUs em alerta"].map((label, i) => `<article class="stat ${i === 0 ? "accent" : i === 3 ? "alert" : ""}"><span>${label}</span><strong id="stat-${i}">—</strong><small>${["Saldo dos SKUs consultados", "Variações no estoque atual", "Saldo × preço de venda", "Saldo igual ou menor que o mínimo"][i]}</small></article>`).join("")}</section>
    <div class="grid-two"><section class="panel"><div class="panel-head"><div><h2>Estoque por marca</h2><p>Quantidade de unidades disponíveis</p></div><a class="panel-link" href="reports.html">Ver relatório →</a></div><div class="panel-body bars" id="brand-bars"><p class="muted">Carregando…</p></div></section>
    <section class="panel"><div class="panel-head"><h2>Acesso rápido</h2></div><div class="panel-body quick-links"><a href="inventory.html"><span>Consultar estoque<small>Encontre modelos, tamanhos e cores</small></span>→</a><a href="movements.html"><span>Registrar recebimento<small>Organize entradas por SKU e lote</small></span>→</a><a href="users.html"><span>Gerenciar equipe<small>Funcionários e cargos da loja</small></span>→</a></div></section></div>
    <section class="panel"><div class="panel-head"><div><h2>Prioridade de reposição</h2><p>SKUs que atingiram o estoque mínimo</p></div><a class="panel-link" href="inventory.html?status=low">Consultar todos →</a></div>${table(["Modelo / marca", "Variação", "Saldo", "Mínimo", "Situação"], "low-stock")}</section>
    <section class="panel"><div class="panel-head"><h2>Últimos recebimentos</h2><a class="panel-link" href="movements.html">Ver movimentações →</a></div><div id="entry-error" class="error" hidden></div>${table(["Recebimento", "SKU", "Quantidade", "Lote", "Data"], "recent-entries")}</section>`;
  $("#refresh").addEventListener("click", load);
  await load();
}
export function renderBars(target, rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = row.nome_marca || "Sem marca";
    grouped.set(key, (grouped.get(key) || 0) + Number(row.saldo_estoque));
  });
  const items = [...grouped].sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...items.map(([, v]) => v));
  target.innerHTML = items.length
    ? items
        .map(
          ([name, value]) =>
            `<div class="bar-row"><span>${e(name)}</span><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${(Math.max(0, value) / max) * 100}%"></div></div><strong>${number(value)}</strong></div>`,
        )
        .join("")
    : '<p class="muted">Nenhum SKU disponível.</p>';
}
async function load() {
  const button = $("#refresh");
  button.disabled = true;
  $("#stock-error").hidden = true;
  $("#entry-error").hidden = true;
  for (let i = 0; i < 4; i++) $(`#stat-${i}`).textContent = "—";
  $("#brand-bars").textContent = "Carregando…";
  $("#low-stock").innerHTML = emptyRow(5, "Carregando…");
  $("#recent-entries").innerHTML = emptyRow(5, "Carregando…");
  const results = await Promise.allSettled([
    list("/estoque"),
    list("/entrada"),
  ]);
  if (results[0].status === "fulfilled") {
    const stock = results[0].value;
    const low = stock
      .filter((row) => Number(row.saldo_estoque) <= Number(row.estoque_minimo))
      .sort((a, b) => Number(a.saldo_estoque) - Number(b.saldo_estoque));
    const values = [
      number(
        stock.reduce((total, row) => total + Number(row.saldo_estoque), 0),
      ),
      number(stock.length),
      money(
        stock.reduce(
          (total, row) =>
            total + Number(row.saldo_estoque) * Number(row.preco_venda),
          0,
        ),
      ),
      number(low.length),
    ];
    values.forEach((value, i) => {
      $(`#stat-${i}`).textContent = value;
    });
    renderBars($("#brand-bars"), stock);
    $("#low-stock").innerHTML =
      low
        .slice(0, 5)
        .map(
          (row) =>
            `<tr><td><strong>${e(row.nome_modelo)}</strong><small>${e(row.nome_marca)}</small></td><td>${e(row.tamanho)} · ${e(row.cor)}</td><td>${number(row.saldo_estoque)}</td><td>${number(row.estoque_minimo)}</td><td>${stockStatus(row)}</td></tr>`,
        )
        .join("") || emptyRow(5, "Nenhum SKU precisa de reposição.");
  } else {
    showError($("#stock-error"), results[0].reason);
    $("#brand-bars").textContent = "Dados indisponíveis.";
    $("#low-stock").innerHTML = emptyRow(
      5,
      "Não foi possível consultar o estoque.",
    );
  }
  if (results[1].status === "fulfilled") {
    $("#recent-entries").innerHTML =
      results[1].value
        .slice(0, 5)
        .map(
          (row) =>
            `<tr><td>#${e(row.idEntrada)}</td><td>${e(row.idSku)}</td><td>${number(row.quantidade)}</td><td>${e(row.lote)}</td><td>${date(row.dataEntrada)}</td></tr>`,
        )
        .join("") || emptyRow(5, "Nenhum recebimento registrado.");
  } else {
    showError($("#entry-error"), results[1].reason);
    $("#recent-entries").innerHTML = emptyRow(5, "Recebimentos indisponíveis.");
  }
  button.disabled = false;
}
