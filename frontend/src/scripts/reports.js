import {
  $,
  heading,
  table,
  emptyRow,
  list,
  escapeHTML as e,
  number,
  money,
  showError,
  exportCSV,
  stockStatus,
  today,
} from "./ui.js";
import { renderBars } from "./dashboard.js";
let stock = [];
export async function init() {
  $("#content").innerHTML =
    heading(
      "INDICADORES DA LOJA",
      "Relatório de estoque",
      "Retrato do estoque atual, calculado a partir dos SKUs consultados.",
      '<button class="button secondary" id="refresh">↻ Atualizar</button><button class="button" id="export" disabled>↓ Exportar CSV</button>',
    ) +
    `<p id="error" class="error" hidden></p><p class="notice">Os valores usam o preço de venda cadastrado. Eles representam o valor potencial dos itens em estoque, sem considerar descontos, custos ou faturamento.</p><div class="stats">${["Unidades em estoque", "Valor potencial", "SKUs em alerta", "Marcas no estoque"].map((label, i) => `<article class="stat ${i === 0 ? "accent" : ""}"><span>${label}</span><strong id="metric-${i}">—</strong><small>Estoque atual consultado</small></article>`).join("")}</div><div class="grid-two"><section class="panel"><div class="panel-head"><h2>Distribuição por marca</h2></div><div id="bars" class="panel-body bars"></div></section><section class="panel"><div class="panel-head"><h2>Resumo por marca</h2></div>${table(["Marca", "SKUs", "Unidades", "Valor potencial"], "summary")}</section></div><section class="panel"><div class="panel-head"><div><h2>Itens para reposição</h2><p>Saldo igual ou menor que o mínimo definido</p></div><span id="generated" class="count"></span></div>${table(["Modelo / marca", "SKU", "Saldo", "Mínimo", "Faltam para o mínimo", "Situação"], "replenish")}</section>`;
  $("#refresh").addEventListener("click", load);
  $("#export").addEventListener("click", () =>
    exportCSV(
      `nomade-relatorio-estoque-${today()}.csv`,
      [
        "SKU",
        "Modelo",
        "Marca",
        "Tamanho",
        "Cor",
        "Saldo",
        "Mínimo",
        "Preço de venda",
        "Valor potencial",
      ],
      stock.map((r) => [
        r.id_sku,
        r.nome_modelo,
        r.nome_marca,
        r.tamanho,
        r.cor,
        r.saldo_estoque,
        r.estoque_minimo,
        r.preco_venda,
        (Number(r.saldo_estoque) * Number(r.preco_venda)).toFixed(2),
      ]),
    ),
  );
  await load();
}
async function load() {
  $("#refresh").disabled = true;
  $("#export").disabled = true;
  $("#error").hidden = true;
  $("#generated").textContent = "";
  for (let i = 0; i < 4; i++) $(`#metric-${i}`).textContent = "—";
  $("#summary").innerHTML = emptyRow(4, "Carregando…");
  $("#replenish").innerHTML = emptyRow(6, "Carregando…");
  $("#bars").textContent = "Carregando…";
  try {
    stock = await list("/estoque");
    const brands = new Map();
    stock.forEach((r) => {
      const key = r.nome_marca || "Sem marca";
      const value = brands.get(key) || { skus: 0, units: 0, value: 0 };
      value.skus++;
      value.units += Number(r.saldo_estoque);
      value.value += Number(r.saldo_estoque) * Number(r.preco_venda);
      brands.set(key, value);
    });
    const low = stock.filter(
      (r) => Number(r.saldo_estoque) <= Number(r.estoque_minimo),
    );
    [
      number(stock.reduce((a, r) => a + Number(r.saldo_estoque), 0)),
      money(
        stock.reduce(
          (a, r) => a + Number(r.saldo_estoque) * Number(r.preco_venda),
          0,
        ),
      ),
      number(low.length),
      number(brands.size),
    ].forEach((v, i) => {
      $(`#metric-${i}`).textContent = v;
    });
    renderBars($("#bars"), stock);
    $("#summary").innerHTML =
      [...brands]
        .sort((a, b) => b[1].units - a[1].units)
        .map(
          ([name, r]) =>
            `<tr><td>${e(name)}</td><td>${number(r.skus)}</td><td>${number(r.units)}</td><td>${money(r.value)}</td></tr>`,
        )
        .join("") || emptyRow(4);
    $("#replenish").innerHTML =
      low
        .map(
          (r) =>
            `<tr><td><strong>${e(r.nome_modelo)}</strong><small>${e(r.nome_marca)} · ${e(r.tamanho)} · ${e(r.cor)}</small></td><td>#${e(r.id_sku)}</td><td>${number(r.saldo_estoque)}</td><td>${number(r.estoque_minimo)}</td><td>${number(Math.max(0, Number(r.estoque_minimo) - Number(r.saldo_estoque)))}</td><td>${stockStatus(r)}</td></tr>`,
        )
        .join("") || emptyRow(6, "Nenhum item precisa de reposição.");
    $("#generated").textContent =
      `Consulta: ${new Date().toLocaleString("pt-BR")}`;
    $("#export").disabled = false;
  } catch (err) {
    stock = [];
    showError($("#error"), err);
    $("#summary").innerHTML = emptyRow(4, "Resumo indisponível.");
    $("#replenish").innerHTML = emptyRow(6, "Dados indisponíveis.");
    $("#bars").textContent = "Dados indisponíveis.";
  } finally {
    $("#refresh").disabled = false;
  }
}
