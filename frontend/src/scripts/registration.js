import {
  $,
  heading,
  table,
  emptyRow,
  list,
  escapeHTML as e,
  showError,
  field,
  select,
  options,
  formMessages,
  guardForm,
  submitForm,
  toast,
  badge,
} from "./ui.js";
import { request } from "./api.js";
let brands = [];
export async function init() {
  $("#content").innerHTML =
    heading(
      "ORGANIZAÇÃO DO CATÁLOGO",
      "Marcas e modelos",
      "Consulte os cadastros que identificam os calçados da loja.",
    ) +
    `<p class="notice">O cadastro de variações de tamanho e cor ainda não está disponível. Os SKUs existentes podem ser consultados no <a class="panel-link" href="inventory.html">Estoque</a>.</p><div class="grid-two"><section class="panel"><div class="panel-head"><h2>Modelos</h2><button class="button secondary" id="refresh">↻ Atualizar</button></div><p class="error" id="model-error" hidden></p>${table(["Modelo", "Marca", "Gênero", "Situação"], "models")}</section><section class="panel"><div class="panel-head"><h2>Marcas</h2></div><p class="error" id="brand-error" hidden></p>${table(["Código", "Nome"], "brands")}</section></div><div class="grid-two"><section class="panel"><div class="panel-head"><h2>Novo modelo</h2></div><form class="panel-body" id="model-form">${formMessages}<div class="form-grid">${field("Nome do modelo", "nome", 'required maxlength="100"')}${select("Marca", "idMarca", '<option value="">Selecione</option>', "required")}</div><div class="form-actions"><button class="button" type="submit">Cadastrar modelo</button></div></form></section><section class="panel"><div class="panel-head"><h2>Nova marca</h2></div><form class="panel-body" id="brand-form">${formMessages}${field("Nome da marca", "nome", 'required maxlength="60"')}<div class="form-actions"><button class="button" type="submit">Cadastrar marca</button></div></form></section></div>`;
  guardForm($("#model-form"), "createModel");
  guardForm($("#brand-form"), "createBrand");
  $("#refresh").addEventListener("click", load);
  $("#brand-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    submitForm(form, "createBrand", async () => {
      await request("/marca", {
        method: "POST",
        body: { nome: form.nome.value.trim() },
      });
      form.reset();
      toast("Marca cadastrada.");
      await load();
    });
  });
  $("#model-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    submitForm(form, "createModel", async () => {
      await request("/modelo", {
        method: "POST",
        body: {
          nome: form.nome.value.trim(),
          idMarca: Number(form.idMarca.value),
        },
      });
      form.reset();
      toast("Modelo cadastrado.");
      await load();
    });
  });
  await load();
}
async function load() {
  $("#refresh").disabled = true;
  $("#brand-error").hidden = true;
  $("#model-error").hidden = true;
  $("#brands").innerHTML = emptyRow(2, "Carregando…");
  $("#models").innerHTML = emptyRow(4, "Carregando…");
  const result = await Promise.allSettled([list("/marca"), list("/modelo")]);
  brands = [];
  if (result[0].status === "fulfilled") {
    brands = result[0].value;
    $("#brands").innerHTML =
      brands
        .map(
          (r) =>
            `<tr><td>#${e(r.id_marca)}</td><td>${e(r.nome_marca)}</td></tr>`,
        )
        .join("") || emptyRow(2);
  } else {
    showError($("#brand-error"), result[0].reason);
    $("#brands").innerHTML = emptyRow(2, "Marcas indisponíveis.");
  }
  $("[name=idMarca]").innerHTML = options(brands, "id_marca", "nome_marca");
  if (result[1].status === "fulfilled") {
    $("#models").innerHTML =
      result[1].value
        .map(
          (r) =>
            `<tr><td><strong>${e(r.nome_modelo)}</strong><small>#${e(r.id_modelo)}</small></td><td>${e(brands.find((b) => Number(b.id_marca) === Number(r.id_marca))?.nome_marca || `Marca #${r.id_marca}`)}</td><td>${e(r.genero || "—")}</td><td>${badge(Number(r.ativo) === 1 ? "Ativo" : "Inativo", Number(r.ativo) === 1 ? "success" : "")}</td></tr>`,
        )
        .join("") || emptyRow(4);
  } else {
    showError($("#model-error"), result[1].reason);
    $("#models").innerHTML = emptyRow(4, "Modelos indisponíveis.");
  }
  $("#refresh").disabled = false;
}
