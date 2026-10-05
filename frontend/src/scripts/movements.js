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
  date,
  today,
  showError,
  field,
  select,
  formMessages,
  guardForm,
  submitForm,
  toast,
  badge,
} from "./ui.js";
import { request, asList } from "./api.js";
import { isDemo, getSession } from "./session.js";
let stock = [],
  historyType = "entrada",
  historyRows = [],
  nextCursor = null,
  seenCursors = new Set();
const formFeatures = {
  entrada: "createEntry",
  venda: "createSale",
  devolucao: "createReturn",
  ajuste: "adjustStock",
};
const skuOptions = () =>
  '<option value="">Selecione um SKU</option>' +
  stock
    .map(
      (r) =>
        `<option value="${e(r.id_sku)}">#${e(r.id_sku)} · ${e(r.nome_modelo)} · ${e(r.tamanho)} · ${e(r.cor)} (${number(r.saldo_estoque)} un.)</option>`,
    )
    .join("");
const moneyAttrs = 'type="number" min="0" max="99999999.99" step="0.01"';
const quantityAttrs = 'type="number" required min="1" step="1"';
const employeeId = () => {
  if (isDemo()) return 1;
  const id = Number(getSession()?.funcionario?.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(
      "A sessão não possui um funcionário válido. Entre novamente.",
    );
  }
  return id;
};
function employeeField() {
  return field(
    "Funcionário responsável",
    "idFuncionario",
    `type="number" required min="1" step="1" value="${employeeId()}" readonly`,
  );
}
function dateField(label, name) {
  return field(label, name, `type="date" required value="${today()}"`);
}
export async function init() {
  $("#content").innerHTML =
    heading(
      "ROTINA DA LOJA",
      "Movimentações",
      "Organize recebimentos, vendas, devoluções e ajustes de estoque.",
      '<button class="button secondary" id="refresh">↻ Atualizar consultas</button>',
    ) +
    `<p id="stock-error" class="error" hidden></p><section class="panel"><div class="panel-head"><h2>Registrar movimentação</h2></div><div class="panel-body"><div class="tabs" aria-label="Tipo de movimentação">${[
      ["entrada", "Recebimento"],
      ["venda", "Venda"],
      ["devolucao", "Devolução / troca"],
      ["ajuste", "Ajuste"],
    ]
      .map(
        ([key, label], i) =>
          `<button type="button" data-form-tab="${key}" aria-pressed="${i === 0}">${label}</button>`,
      )
      .join("")}</div>
 <form id="entrada-form">${formMessages}<div class="form-grid">${employeeField()}${select("SKU recebido", "idSku", skuOptions(), "required data-skus")}${field("Quantidade", "quantidade", quantityAttrs)}${field("Valor total de aquisição (R$)", "valorTotal", `${moneyAttrs.replace('min="0"', 'min="0.01"')} required`)}${dateField("Data do recebimento", "dataEntrada")}${field("Lote", "lote", 'required maxlength="20"')}${field("ID do fornecedor (opcional)", "idFornecedor", 'type="number" min="1" step="1"')}${field("Nota fiscal (opcional)", "notaFiscal", 'maxlength="44"')}</div><div class="form-actions"><button class="button" type="submit">Registrar recebimento</button></div></form>
 <form id="venda-form" hidden>${formMessages}<div class="form-grid">${employeeField()}${select("Canal", "canal", '<option value="LOJA">Loja</option><option value="ONLINE">Online</option>')}${field("ID do cliente (opcional)", "idCliente", 'type="number" min="1" step="1"')}${field("Desconto total da venda (R$)", "desconto", `${moneyAttrs} value="0"`)}${field("Código de rastreamento (opcional)", "codigoRastreamento", 'maxlength="50"')}<label class="field">Observação (opcional)<textarea name="observacao" maxlength="255"></textarea></label></div><div class="panel-head"><h3>Itens da venda</h3><button type="button" class="button secondary" id="add-item">+ Adicionar item</button></div><div id="sale-items" class="sale-items"></div><div class="sale-total"><span>Total estimado</span><strong id="sale-total">R$ 0,00</strong></div><p class="muted">O valor final é calculado pelo servidor com o preço cadastrado de cada SKU.</p><div class="form-grid" style="margin-top:20px">${select("Pagamento", "forma", '<option value="">Sem pagamento (venda aberta)</option><option value="DINHEIRO">Dinheiro</option><option value="PIX">Pix</option><option value="CARTAO_CREDITO">Cartão de crédito</option><option value="CARTAO_DEBITO">Cartão de débito</option><option value="BOLETO">Boleto</option><option value="VALE_TROCA">Vale troca</option>')}${field("Parcelas", "parcelas", 'type="number" min="1" max="24" step="1" value="1"')}${select("Situação do pagamento", "statusPagamento", '<option value="PENDENTE">Pendente</option><option value="APROVADO">Aprovado</option>')}</div><div class="form-actions"><button class="button" type="submit">Registrar venda</button></div></form>
 <form id="devolucao-form" hidden>${formMessages}<div class="toolbar"><label class="field">Venda de origem<input name="saleLookup" type="number" min="1" step="1" placeholder="ID da venda"></label><button type="button" id="lookup-sale" class="button secondary">Consultar itens</button></div><div class="form-grid" style="margin-top:20px">${employeeField()}${select("Item da venda", "idItemVenda", '<option value="">Consulte uma venda</option>', "required")}${select("Tipo", "tipo", '<option value="DEVOLUCAO">Devolução</option><option value="TROCA">Troca</option>')}${field("Quantidade", "quantidade", quantityAttrs)}${field("Valor do reembolso (R$)", "valorReembolso", `${moneyAttrs} value="0"`)}${dateField("Data da devolução", "dataDevolucao")}<label class="field" id="exchange-field" hidden>ID da nova venda da troca<input name="idVendaTroca" type="number" min="1" step="1"><small>A nova venda deve existir antes do registro da troca.</small></label><label class="field full">Motivo<textarea name="motivo" required maxlength="500"></textarea></label><label class="check-field"><input name="reutilizavel" type="checkbox">Itens em condições de retornar ao estoque</label></div><div class="form-actions"><button class="button" type="submit">Registrar devolução / troca</button></div></form>
 <form id="ajuste-form" hidden>${formMessages}<div class="form-grid">${select("SKU", "idSku", skuOptions(), "required data-skus")}${field("Variação de quantidade", "quantidade", 'type="number" required step="1"')}<p class="muted full">Informe uma variação: 3 adiciona três unidades; −3 remove três unidades. O valor não é o saldo final.</p><label class="field full">Motivo<textarea name="motivo" required maxlength="500"></textarea></label></div><div class="form-actions"><button class="button" type="submit">Registrar ajuste</button></div></form></div></section>
 <section class="panel"><div class="panel-head"><div><h2>Histórico de movimentações</h2><p id="history-coverage">Registros retornados pela consulta</p></div><label class="field">Tipo<select id="history-type"><option value="entrada">Recebimentos</option><option value="venda">Vendas</option><option value="devolucao">Devoluções / trocas</option></select></label></div><p id="history-error" class="error" hidden></p><div id="history-table"></div><div class="pagination"><span id="history-count"></span><button id="load-more" class="button secondary" hidden>Carregar mais vendas</button></div></section>`;
  Object.entries(formFeatures).forEach(([name, feature]) => {
    const form = $(`#${name}-form`);
    guardForm(form, feature);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitForm(form, feature, () => saveMovement(name, form));
    });
  });
  document.querySelectorAll("[data-form-tab]").forEach((button) =>
    button.addEventListener("click", () => {
      document
        .querySelectorAll("[data-form-tab]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      Object.keys(formFeatures).forEach((name) => {
        $(`#${name}-form`).hidden = name !== button.dataset.formTab;
      });
    }),
  );
  $("#add-item").addEventListener("click", addItem);
  $("#sale-items").addEventListener("input", updateTotal);
  $("#venda-form").desconto.addEventListener("input", updateTotal);
  $("#sale-items").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-item]");
    if (button && $("#sale-items").children.length > 1) {
      button.closest(".sale-item").remove();
      updateTotal();
    }
  });
  const sales = $("#venda-form");
  sales.forma.addEventListener("change", () => {
    sales.parcelas.disabled = sales.forma.value !== "CARTAO_CREDITO";
    if (sales.parcelas.disabled) sales.parcelas.value = "1";
    sales.statusPagamento.disabled = !sales.forma.value;
  });
  sales.forma.dispatchEvent(new Event("change"));
  const returns = $("#devolucao-form");
  returns.tipo.addEventListener("change", () => {
    const exchange = returns.tipo.value === "TROCA";
    $("#exchange-field").hidden = !exchange;
    returns.idVendaTroca.required = exchange;
    if (!exchange) returns.idVendaTroca.value = "";
  });
  returns.saleLookup.addEventListener("input", () => {
    returns.idItemVenda.innerHTML =
      '<option value="">Consulte uma venda</option>';
  });
  $("#lookup-sale").addEventListener("click", lookupSale);
  $("#history-type").addEventListener("change", () => {
    historyType = $("#history-type").value;
    loadHistory();
  });
  $("#refresh").addEventListener("click", load);
  $("#load-more").addEventListener("click", () => loadHistory(true));
  $("#history-table").addEventListener("click", (event) => {
    const button = event.target.closest("[data-detail]");
    if (button) showMovementDetail(button.dataset.detail);
  });
  await load();
}
async function load() {
  $("#refresh").disabled = true;
  $("#stock-error").hidden = true;
  try {
    stock = await list("/estoque");
  } catch (err) {
    stock = [];
    showError($("#stock-error"), err);
  }
  document.querySelectorAll("[data-skus]").forEach((input) => {
    const value = input.value;
    input.innerHTML = skuOptions();
    input.value = value;
  });
  if (!$("#sale-items").children.length) addItem();
  else {
    $("#sale-items")
      .querySelectorAll("select")
      .forEach((input) => {
        const value = input.value;
        input.innerHTML = skuOptions();
        input.value = value;
      });
    updateTotal();
  }
  await loadHistory();
  $("#refresh").disabled = false;
}
function addItem() {
  const row = document.createElement("div");
  row.className = "sale-item";
  row.innerHTML =
    select("SKU", "itemSku", skuOptions(), "required") +
    field("Quantidade", "itemQuantity", `${quantityAttrs} value="1"`) +
    field("Desconto do item (R$)", "itemDiscount", `${moneyAttrs} value="0"`) +
    `<button class="icon-button" type="button" data-remove-item aria-label="Remover item">✕</button>`;
  $("#sale-items").append(row);
  updateTotal();
}
function saleData() {
  const itens = [...$("#sale-items").children].map((row) => ({
    idSku: Number($("select", row).value),
    quantidade: Number($("[name=itemQuantity]", row).value),
    descontoItem: Number($("[name=itemDiscount]", row).value),
  }));
  const subtotal = itens.reduce((total, item) => {
    const price = Math.round(
      Number(
        stock.find((r) => Number(r.id_sku) === item.idSku)?.preco_venda || 0,
      ) * 100,
    );
    return (
      total + price * item.quantidade - Math.round(item.descontoItem * 100)
    );
  }, 0);
  return {
    itens,
    totalCent:
      subtotal - Math.round(Number($("#venda-form").desconto.value) * 100),
  };
}
function updateTotal() {
  const { totalCent } = saleData();
  $("#sale-total").textContent = money(totalCent / 100);
}
async function saveMovement(name, form) {
  const data = Object.fromEntries(new FormData(form));
  const body = {};
  if (name === "entrada") {
    Object.assign(body, {
      idFuncionario: employeeId(),
      idSku: Number(data.idSku),
      idFornecedor: data.idFornecedor ? Number(data.idFornecedor) : null,
      quantidade: Number(data.quantidade),
      valorTotal: Number(data.valorTotal),
      dataEntrada: data.dataEntrada,
      lote: data.lote.trim(),
      notaFiscal: data.notaFiscal.trim() || null,
    });
    if (!body.lote) throw new Error("Informe o lote do recebimento.");
  }
  if (name === "venda") {
    const { itens, totalCent } = saleData();
    const ids = new Set();
    for (const item of itens) {
      if (ids.has(item.idSku))
        throw new Error(
          "Um SKU aparece mais de uma vez. Some as quantidades em um único item.",
        );
      ids.add(item.idSku);
      const sku = stock.find((r) => Number(r.id_sku) === item.idSku);
      if (!sku) throw new Error("Selecione um SKU válido para cada item.");
      if (item.quantidade > Number(sku.saldo_estoque))
        throw new Error(
          `Saldo insuficiente para o SKU ${item.idSku}. Atualize a consulta.`,
        );
      if (item.descontoItem > Number(sku.preco_venda) * item.quantidade)
        throw new Error("O desconto de um item supera seu valor.");
    }
    if (totalCent < 0)
      throw new Error("Os descontos superam o valor da venda.");
    if (data.forma && totalCent <= 0)
      throw new Error("O pagamento deve ter valor maior que zero.");
    Object.assign(body, {
      idFuncionario: employeeId(),
      idCliente: data.idCliente ? Number(data.idCliente) : null,
      canal: data.canal,
      desconto: Number(data.desconto),
      codigoRastreamento: data.codigoRastreamento.trim() || null,
      observacao: data.observacao.trim() || null,
      itens,
      pagamentos: data.forma
        ? [
            {
              forma: data.forma,
              parcelas:
                data.forma === "CARTAO_CREDITO" ? Number(data.parcelas) : 1,
              valor: totalCent / 100,
              status: data.statusPagamento,
            },
          ]
        : [],
    });
  }
  if (name === "devolucao") {
    Object.assign(body, {
      idFuncionario: employeeId(),
      idItemVenda: Number(data.idItemVenda),
      tipo: data.tipo,
      quantidade: Number(data.quantidade),
      motivo: data.motivo.trim(),
      reutilizavel: form.reutilizavel.checked,
      valorReembolso: Number(data.valorReembolso),
      idVendaTroca: data.tipo === "TROCA" ? Number(data.idVendaTroca) : null,
      dataDevolucao: data.dataDevolucao,
    });
    if (!body.motivo) throw new Error("Informe o motivo da devolução.");
  }
  if (name === "ajuste") {
    Object.assign(body, {
      idSku: Number(data.idSku),
      quantidade: Number(data.quantidade),
      motivo: data.motivo.trim(),
    });
    if (!Number.isInteger(body.quantidade) || body.quantidade === 0)
      throw new Error("Informe uma variação inteira diferente de zero.");
    if (!body.motivo) throw new Error("Informe o motivo do ajuste.");
  }
  const result = await request(`/${name}`, { method: "POST", body });
  toast(result?.mensagem || "Movimentação registrada.");
  form.reset();
  if (name === "entrada") form.dataEntrada.value = today();
  if (name === "devolucao") {
    form.dataDevolucao.value = today();
    form.idItemVenda.innerHTML = '<option value="">Consulte uma venda</option>';
    form.tipo.dispatchEvent(new Event("change"));
  }
  if (name === "venda") {
    $("#sale-items").replaceChildren();
    addItem();
    form.forma.dispatchEvent(new Event("change"));
  }
  if (name !== "ajuste") {
    $("#history-type").value = name;
    historyType = name;
  }
  await load();
}
async function lookupSale() {
  const form = $("#devolucao-form");
  const id = Number(form.saleLookup.value);
  const error = $("[data-form-error]", form);
  error.hidden = true;
  form.idItemVenda.innerHTML = '<option value="">Consulte uma venda</option>';
  if (!Number.isInteger(id) || id < 1) {
    showError(error, new Error("Informe o ID da venda de origem."));
    return;
  }
  const button = $("#lookup-sale");
  button.disabled = true;
  try {
    const sale = await detail("/venda", id);
    if (!Array.isArray(sale?.itens))
      throw new Error("A API não retornou os itens desta venda.");
    form.idItemVenda.innerHTML =
      '<option value="">Selecione o item vendido</option>' +
      sale.itens
        .map(
          (r) =>
            `<option value="${e(r.id_item_venda)}">Item #${e(r.id_item_venda)} · ${e(r.nome_modelo)} · ${e(r.quantidade)} un. vendidas</option>`,
        )
        .join("");
  } catch (err) {
    showError(error, err);
  } finally {
    button.disabled = false;
  }
}
async function loadHistory(more = false) {
  const type = historyType;
  $("#history-error").hidden = true;
  $("#load-more").disabled = true;
  $("#history-coverage").textContent = "Registros retornados pela consulta";
  const headers =
    type === "entrada"
      ? ["ID", "SKU", "Quantidade", "Valor de aquisição", "Data", "Ações"]
      : type === "venda"
        ? ["ID", "Canal", "Situação", "Valor total", "Data", "Ações"]
        : ["ID", "Item vendido", "Tipo", "Quantidade", "Data", "Ações"];
  if (!more) {
    historyRows = [];
    nextCursor = null;
    seenCursors = new Set();
    $("#history-table").innerHTML = table(headers, "history-rows");
    $("#history-rows").innerHTML = emptyRow(6, "Carregando…");
    $("#history-count").textContent = "";
    $("#load-more").hidden = true;
  }
  try {
    let rows, pagination;
    if (type === "venda" && !isDemo()) {
      const cursor =
        more && nextCursor ? `?cursor=${encodeURIComponent(nextCursor)}` : "";
      const response = await request(`/venda${cursor}`);
      rows = asList(response);
      pagination = response.paginacao;
    } else rows = await list(`/${type}`);
    if (type !== historyType) return;
    const idField =
      type === "entrada"
        ? "idEntrada"
        : type === "venda"
          ? "id_venda"
          : "idDevolucao";
    const existing = new Set(historyRows.map((r) => r[idField]));
    if (more && rows.length && rows.every((r) => existing.has(r[idField])))
      throw new Error(
        "A consulta retornou registros repetidos. Não foi possível continuar a paginação.",
      );
    historyRows.push(...rows.filter((r) => !existing.has(r[idField])));
    nextCursor = null;
    if (pagination?.temMais) {
      if (
        typeof pagination.proximoCursor === "string" &&
        !seenCursors.has(pagination.proximoCursor)
      ) {
        nextCursor = pagination.proximoCursor;
        seenCursors.add(nextCursor);
        $("#history-coverage").textContent =
          "Consulta parcial: há mais vendas para carregar.";
      } else {
        $("#history-coverage").textContent =
          "Consulta parcial: a API não forneceu um cursor válido para continuar.";
      }
    }
    renderHistory(type);
    $("#load-more").hidden = !nextCursor;
  } catch (err) {
    if (type !== historyType) return;
    showError($("#history-error"), err);
    if (!more) {
      $("#history-rows").innerHTML = emptyRow(6, "Histórico indisponível.");
      $("#history-count").textContent = "Sem dados";
    }
    nextCursor = null;
    $("#load-more").hidden = true;
  } finally {
    $("#load-more").disabled = false;
  }
}
function renderHistory(type) {
  $("#history-count").textContent =
    `${historyRows.length} registros carregados`;
  $("#history-rows").innerHTML =
    historyRows
      .map((r) =>
        type === "entrada"
          ? `<tr><td>#${e(r.idEntrada)}</td><td>#${e(r.idSku)}</td><td>${number(r.quantidade)}</td><td>${money(r.valorTotal)}</td><td>${date(r.dataEntrada)}</td><td><button class="text-button" data-detail="${e(r.idEntrada)}">Detalhes</button></td></tr>`
          : type === "venda"
            ? `<tr><td>#${e(r.id_venda)}</td><td>${e(r.canal)}</td><td>${badge(r.status, r.status === "PAGA" ? "success" : "")}</td><td>${money(r.valor_total)}</td><td>${date(r.data_venda)}</td><td><button class="text-button" data-detail="${e(r.id_venda)}">Detalhes</button></td></tr>`
            : `<tr><td>#${e(r.idDevolucao)}</td><td>#${e(r.idItemVenda)}</td><td>${badge(r.tipo === "TROCA" ? "Troca" : "Devolução")}</td><td>${number(r.quantidade)}</td><td>${date(r.dataDevolucao)}</td><td><button class="text-button" data-detail="${e(r.idDevolucao)}">Detalhes</button></td></tr>`,
      )
      .join("") || emptyRow(6);
}
async function showMovementDetail(id) {
  const type = historyType;
  $("#dialog-title").textContent =
    type === "venda"
      ? "Detalhes da venda"
      : type === "entrada"
        ? "Detalhes do recebimento"
        : "Detalhes da devolução";
  $("#dialog-content").textContent = "Carregando…";
  $("#detail-dialog").showModal();
  try {
    const row = await detail(`/${type}`, id);
    const fields =
      type === "entrada"
        ? [
            ["ID", row.idEntrada],
            ["SKU", row.idSku],
            ["Quantidade", number(row.quantidade)],
            ["Total", money(row.valorTotal)],
            ["Lote", row.lote],
            ["Data", date(row.dataEntrada)],
            ["Fornecedor", row.idFornecedor || "—"],
            ["Nota fiscal", row.notaFiscal || "—"],
          ]
        : type === "venda"
          ? [
              ["ID", row.id_venda],
              ["Canal", row.canal],
              ["Status", row.status],
              ["Total", money(row.valor_total)],
              ["Desconto", money(row.desconto)],
              ["Data", date(row.data_venda)],
              ["Rastreamento", row.codigo_rastreamento || "—"],
              ["Observação", row.observacao || "—"],
            ]
          : [
              ["ID", row.idDevolucao],
              ["Item vendido", row.idItemVenda],
              ["Tipo", row.tipo],
              ["Quantidade", row.quantidade],
              ["Reembolso", money(row.valorReembolso)],
              ["Reutilizável", Number(row.reutilizavel) === 1 ? "Sim" : "Não"],
              ["Data", date(row.dataDevolucao)],
              ["Motivo", row.motivo],
              ["Venda da troca", row.idVendaTroca || "—"],
            ];
    $("#dialog-content").innerHTML =
      `<dl class="detail-grid">${fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${e(value)}</dd></div>`).join("")}</dl>` +
      (type === "venda"
        ? `<h3>Itens vendidos</h3>${table(["Item / SKU", "Modelo", "Quantidade", "Preço unitário"], "detail-items")}<h3>Pagamentos</h3><div class="panel-body">${(row.pagamentos || []).map((p) => `<p>${e(p.forma)} · ${money(p.valor)} · ${e(p.status)}</p>`).join("") || '<p class="muted">Sem pagamentos registrados.</p>'}</div>`
        : "");
    if (type === "venda")
      $("#detail-items").innerHTML =
        (row.itens || [])
          .map(
            (r) =>
              `<tr><td>#${e(r.id_item_venda)} / #${e(r.id_sku)}</td><td>${e(r.nome_modelo)}</td><td>${number(r.quantidade)}</td><td>${money(r.preco_unitario)}</td></tr>`,
          )
          .join("") || emptyRow(4);
  } catch (err) {
    showError($("#dialog-content"), err);
  }
}
