import {
  $,
  heading,
  table,
  emptyRow,
  list,
  escapeHTML as e,
  showError,
  normalize,
  field,
  select,
  options,
  formMessages,
  guardForm,
  submitForm,
  toast,
  enabled,
} from "./ui.js";
import { request } from "./api.js";
import { getSession } from "./session.js";
let employees = [],
  roles = [];
export async function init() {
  $("#content").innerHTML =
    heading(
      "ADMINISTRAÇÃO",
      "Equipe e cargos",
      "Gerencie os funcionários ativos e os cargos cadastrados.",
      '<button class="button secondary" id="refresh">↻ Atualizar</button>',
    ) +
    `<div class="tabs" aria-label="Seções da equipe"><button aria-pressed="true" data-tab="employees">Funcionários</button><button aria-pressed="false" data-tab="roles">Cargos</button></div><section id="employees-panel"><p class="error" id="employee-error" hidden></p><section class="panel"><div class="toolbar"><label class="field search-field">Buscar funcionário<input type="search" id="search" placeholder="Nome ou e-mail"></label><span class="count" id="employee-count" aria-live="polite"></span></div>${table(["Nome", "E-mail", "Cargo", "Ações"], "employees")}</section><section class="panel"><div class="panel-head"><h2>Cadastrar funcionário</h2></div><form id="employee-form" class="panel-body">${formMessages}<div class="form-grid">${field("Nome completo", "nome", 'required maxlength="100" autocomplete="name"')}${field("E-mail", "email", 'required type="email" maxlength="150" autocomplete="email"')}${field("Data de nascimento", "dataNascimento", 'required type="date"')}${select("Cargo", "idCargo", '<option value="">Selecione</option>', "required")}${field("Senha inicial", "senha", 'required type="password" minlength="8" maxlength="72" autocomplete="new-password"')}<p class="muted">Use pelo menos 8 caracteres. O funcionário poderá usar a senha para entrar na conta.</p></div><div class="form-actions"><button class="button secondary" type="reset">Limpar</button><button class="button" type="submit">Cadastrar funcionário</button></div></form></section></section><section id="roles-panel" hidden><p class="error" id="role-error" hidden></p><section class="panel"><div class="panel-head"><h2>Cargos cadastrados</h2></div>${table(["Código", "Nome", "Nível de acesso", "Ações"], "roles")}</section><section class="panel"><div class="panel-head"><h2>Novo cargo</h2></div><form id="role-form" class="panel-body">${formMessages}<div class="form-grid">${field("Nome do cargo", "nome_cargo", 'required maxlength="100"')}${field("Nível de acesso", "nivel_acesso", 'required type="number" min="0" step="1"')}</div><div class="form-actions"><button class="button" type="submit">Cadastrar cargo</button></div></form></section><p class="notice">O nível de acesso é um dado do cadastro. A aplicação não possui uma matriz de permissões configurável.</p></section>`;
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 14);
  $("[name=dataNascimento]").max =
    `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, "0")}-${String(maxDate.getDate()).padStart(2, "0")}`;
  document.querySelectorAll("[data-tab]").forEach((button) =>
    button.addEventListener("click", () => {
      document
        .querySelectorAll("[data-tab]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      $("#employees-panel").hidden = button.dataset.tab !== "employees";
      $("#roles-panel").hidden = button.dataset.tab !== "roles";
    }),
  );
  $("#search").addEventListener("input", renderEmployees);
  $("#refresh").addEventListener("click", load);
  guardForm($("#employee-form"), "createEmployee");
  guardForm($("#role-form"), "createRole");
  $("#employee-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    submitForm(form, "createEmployee", async () => {
      await request("/funcionario", {
        method: "POST",
        body: {
          nome: form.nome.value.trim(),
          email: form.email.value.trim().toLowerCase(),
          dataNascimento: form.dataNascimento.value,
          senha: form.senha.value,
          idCargo: Number(form.idCargo.value),
        },
      });
      form.reset();
      toast("Funcionário cadastrado.");
      await load();
    });
  });
  $("#role-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    submitForm(form, "createRole", async () => {
      await request("/cargo", {
        method: "POST",
        body: {
          nome_cargo: form.nome_cargo.value.trim(),
          nivel_acesso: Number(form.nivel_acesso.value),
        },
      });
      form.reset();
      toast("Cargo cadastrado.");
      await load();
    });
  });
  $("#employees").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit]");
    const remove = event.target.closest("[data-remove]");
    if (edit) editEmployee(Number(edit.dataset.edit));
    if (remove) confirmRemove("employee", Number(remove.dataset.remove));
  });
  $("#roles").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-role-edit]");
    const remove = event.target.closest("[data-role-remove]");
    if (edit) editRole(Number(edit.dataset.roleEdit));
    if (remove) confirmRemove("role", Number(remove.dataset.roleRemove));
  });
  await load();
}
async function load() {
  $("#refresh").disabled = true;
  $("#employee-error").hidden = true;
  $("#role-error").hidden = true;
  $("#employees").innerHTML = emptyRow(4, "Carregando…");
  $("#roles").innerHTML = emptyRow(4, "Carregando…");
  const results = await Promise.allSettled([
    list("/funcionario"),
    list("/cargo"),
  ]);
  employees = [];
  roles = [];
  if (results[1].status === "fulfilled") {
    roles = results[1].value;
    $("#roles").innerHTML =
      roles
        .map(
          (r) =>
            `<tr><td>#${e(r.id_cargo)}</td><td>${e(r.nome_cargo)}</td><td>${e(r.nivel_acesso)}</td><td><div class="row-actions"><button class="text-button" data-role-edit="${e(r.id_cargo)}" ${enabled("editRole") ? "" : "disabled"}>Editar</button><button class="text-button" data-role-remove="${e(r.id_cargo)}" ${enabled("deleteRole") ? "" : "disabled"}>Excluir</button></div></td></tr>`,
        )
        .join("") || emptyRow(4);
  } else {
    showError($("#role-error"), results[1].reason);
    $("#roles").innerHTML = emptyRow(4, "Cargos indisponíveis.");
  }
  $("[name=idCargo]", $("#employee-form")).innerHTML = options(
    roles,
    "id_cargo",
    "nome_cargo",
  );
  if (results[0].status === "fulfilled") {
    employees = results[0].value;
    renderEmployees();
  } else {
    showError($("#employee-error"), results[0].reason);
    $("#employees").innerHTML = emptyRow(4, "Funcionários indisponíveis.");
    $("#employee-count").textContent = "Sem dados";
  }
  $("#refresh").disabled = false;
}
function renderEmployees() {
  const term = normalize($("#search").value);
  const filtered = employees.filter((r) =>
    normalize(`${r.nome_completo} ${r.email}`).includes(term),
  );
  $("#employee-count").textContent = `${filtered.length} funcionários ativos`;
  $("#employees").innerHTML =
    filtered
      .map(
        (r) =>
          `<tr><td><strong>${e(r.nome_completo)}</strong><small>#${e(r.id_funcionario)}</small></td><td>${e(r.email)}</td><td>${e(roles.find((c) => Number(c.id_cargo) === Number(r.id_cargo))?.nome_cargo || `Cargo #${r.id_cargo}`)}</td><td><div class="row-actions"><button class="text-button" data-edit="${e(r.id_funcionario)}" ${enabled("editEmployee") ? "" : "disabled"}>Editar</button><button class="text-button" data-remove="${e(r.id_funcionario)}" ${enabled("deactivateEmployee") && Number(getSession()?.funcionario?.id) !== Number(r.id_funcionario) ? "" : "disabled"}>Desativar</button></div></td></tr>`,
      )
      .join("") || emptyRow(4);
}
function confirmRemove(type, id) {
  const employee = type === "employee";
  const row = (employee ? employees : roles).find(
    (r) => Number(employee ? r.id_funcionario : r.id_cargo) === id,
  );
  const name = employee ? row.nome_completo : row.nome_cargo;
  const feature = employee ? "deactivateEmployee" : "deleteRole";
  if (!enabled(feature)) return;
  $("#dialog-title").textContent = employee
    ? "Desativar funcionário"
    : "Excluir cargo";
  $("#dialog-content").innerHTML =
    `<p>${employee ? "Desativar" : "Excluir"} <strong>${e(name)}</strong>?</p><p class="muted">${employee ? "O funcionário deixará de aparecer na lista de ativos." : "A exclusão pode ser recusada se o cargo estiver vinculado a funcionários."}</p><p class="error" id="delete-error" hidden></p><div class="form-actions"><button class="button secondary" id="delete-cancel">Cancelar</button><button class="button danger-button" id="delete-confirm">${employee ? "Desativar" : "Excluir"}</button></div>`;
  $("#detail-dialog").showModal();
  $("#delete-cancel").addEventListener("click", () =>
    $("#detail-dialog").close(),
  );
  $("#delete-confirm").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await request(`/${employee ? "funcionario" : "cargo"}/${id}`, {
        method: "DELETE",
      });
      $("#detail-dialog").close();
      toast(employee ? "Funcionário desativado." : "Cargo excluído.");
      await load();
    } catch (err) {
      showError($("#delete-error"), err);
    } finally {
      button.disabled = false;
    }
  });
}
function editEmployee(id) {
  const row = employees.find((r) => Number(r.id_funcionario) === id);
  if (!enabled("editEmployee")) return;
  $("#dialog-title").textContent = "Editar acesso";
  $("#dialog-content").innerHTML =
    `<p class="muted">${e(row.nome_completo)}</p><form id="edit-form">${formMessages}<div class="form-grid">${field("E-mail", "email", `type="email" required maxlength="150" value="${e(row.email)}"`)}${field("Nova senha (opcional)", "senha", 'type="password" minlength="8" maxlength="72" autocomplete="new-password"')}</div><div class="form-actions"><button class="button" type="submit">Salvar acesso</button></div></form>`;
  $("#detail-dialog").showModal();
  const form = $("#edit-form");
  guardForm(form, "editEmployee");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(form, "editEmployee", async () => {
      const body = { email: form.email.value.trim().toLowerCase() };
      if (form.senha.value) body.senha = form.senha.value;
      await request(`/funcionario/${id}`, { method: "PUT", body });
      $("#detail-dialog").close();
      toast("Acesso atualizado.");
      await load();
    });
  });
}
function editRole(id) {
  const row = roles.find((r) => Number(r.id_cargo) === id);
  if (!enabled("editRole")) return;
  $("#dialog-title").textContent = "Editar cargo";
  $("#dialog-content").innerHTML =
    `<form id="edit-form">${formMessages}<div class="form-grid">${field("Nome", "nome_cargo", `required maxlength="100" value="${e(row.nome_cargo)}"`)}${field("Nível de acesso", "nivel_acesso", `type="number" min="0" step="1" required value="${e(row.nivel_acesso)}"`)}</div><div class="form-actions"><button class="button" type="submit">Salvar cargo</button></div></form>`;
  $("#detail-dialog").showModal();
  const form = $("#edit-form");
  guardForm(form, "editRole");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(form, "editRole", async () => {
      await request(`/cargo/${id}`, {
        method: "PUT",
        body: {
          nome_cargo: form.nome_cargo.value.trim(),
          nivel_acesso: Number(form.nivel_acesso.value),
        },
      });
      $("#detail-dialog").close();
      toast("Cargo atualizado.");
      await load();
    });
  });
}
