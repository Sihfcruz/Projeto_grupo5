import { useState } from "react";
import { useResource } from "../services/hooks.js";
import { enabled, normalize } from "../services/data.js";
import { getSession } from "../services/session.js";
import { request } from "../services/api.js";
import {
  Heading,
  Panel,
  Table,
  Field,
  SelectField,
  ActionForm,
  ErrorMessage,
  Modal,
} from "../components/common.jsx";
export default function Users() {
  const employees = useResource("/funcionario");
  const roles = useResource("/cargo");
  const [tab, setTab] = useState("employees");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState(null);
  const refresh = () => {
    employees.reload();
    roles.reload();
  };
  const filtered = employees.data.filter((r) =>
    normalize(`${r.nome_completo} ${r.email}`).includes(normalize(search)),
  );
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 14);
  const birthMax = `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, "0")}-${String(maxDate.getDate()).padStart(2, "0")}`;
  return (
    <>
      <Heading
        eyebrow="ADMINISTRAÇÃO"
        title="Equipe e cargos"
        subtitle="Gerencie os funcionários ativos e os cargos cadastrados."
      >
        <button
          className="button secondary"
          disabled={employees.loading || roles.loading}
          onClick={refresh}
        >
          ↻ Atualizar
        </button>
      </Heading>
      <div className="tabs" aria-label="Seções da equipe">
        <button
          aria-pressed={tab === "employees"}
          onClick={() => setTab("employees")}
        >
          Funcionários
        </button>
        <button aria-pressed={tab === "roles"} onClick={() => setTab("roles")}>
          Cargos
        </button>
      </div>
      <section hidden={tab !== "employees"}>
        <ErrorMessage message={employees.error} />
        <section className="panel">
          <div className="toolbar">
            <Field
              label="Buscar funcionário"
              className="search-field"
              type="search"
              placeholder="Nome ou e-mail"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <span className="count" aria-live="polite">
              {employees.error
                ? "Sem dados"
                : `${filtered.length} funcionários ativos`}
            </span>
          </div>
          <Table
            headers={["Nome", "E-mail", "Cargo", "Ações"]}
            loading={employees.loading}
            error={employees.error}
          >
            {filtered.map((r) => (
              <tr key={r.id_funcionario}>
                <td>
                  <strong>{r.nome_completo}</strong>
                  <small>#{r.id_funcionario}</small>
                </td>
                <td>{r.email}</td>
                <td>
                  {roles.data.find(
                    (c) => Number(c.id_cargo) === Number(r.id_cargo),
                  )?.nome_cargo || `Cargo #${r.id_cargo}`}
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="text-button"
                      disabled={!enabled("editEmployee")}
                      onClick={() =>
                        setAction({ type: "editEmployee", row: r })
                      }
                    >
                      Editar
                    </button>
                    <button
                      className="text-button"
                      disabled={
                        !enabled("deactivateEmployee") ||
                        Number(getSession()?.funcionario?.id) ===
                          Number(r.id_funcionario)
                      }
                      onClick={() =>
                        setAction({ type: "removeEmployee", row: r })
                      }
                    >
                      Desativar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </section>
        <Panel title="Cadastrar funcionário">
          <ActionForm
            feature="createEmployee"
            label="Cadastrar funcionário"
            onSave={async (values) => {
              const nome = values.nome.trim();
              if (!nome) throw new Error("Informe o nome completo.");
              await request("/funcionario", {
                method: "POST",
                body: {
                  nome,
                  email: values.email.trim().toLowerCase(),
                  dataNascimento: values.dataNascimento,
                  senha: values.senha,
                  idCargo: Number(values.idCargo),
                },
              });
              refresh();
              return "Funcionário cadastrado.";
            }}
          >
            <div className="form-grid">
              <Field
                label="Nome completo"
                name="nome"
                required
                maxLength={100}
                autoComplete="name"
              />
              <Field
                label="E-mail"
                name="email"
                required
                type="email"
                maxLength={150}
                autoComplete="email"
              />
              <Field
                label="Data de nascimento"
                name="dataNascimento"
                required
                type="date"
                max={birthMax}
              />
              <SelectField label="Cargo" name="idCargo" required>
                <option value="">Selecione</option>
                {roles.data.map((r) => (
                  <option key={r.id_cargo} value={r.id_cargo}>
                    {r.nome_cargo}
                  </option>
                ))}
              </SelectField>
              <Field
                label="Senha inicial"
                name="senha"
                required
                type="password"
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
              <p className="muted">
                Use pelo menos 8 caracteres. O funcionário poderá usar a senha
                para entrar na conta.
              </p>
            </div>
            <div className="form-actions">
              <button className="button secondary" type="reset">
                Limpar
              </button>
            </div>
          </ActionForm>
        </Panel>
      </section>
      <section hidden={tab !== "roles"}>
        <ErrorMessage message={roles.error} />
        <Panel title="Cargos cadastrados">
          <Table
            headers={["Código", "Nome", "Nível de acesso", "Ações"]}
            loading={roles.loading}
            error={roles.error}
          >
            {roles.data.map((r) => (
              <tr key={r.id_cargo}>
                <td>#{r.id_cargo}</td>
                <td>{r.nome_cargo}</td>
                <td>{r.nivel_acesso}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="text-button"
                      disabled={!enabled("editRole")}
                      onClick={() => setAction({ type: "editRole", row: r })}
                    >
                      Editar
                    </button>
                    <button
                      className="text-button"
                      disabled={!enabled("deleteRole")}
                      onClick={() => setAction({ type: "removeRole", row: r })}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel title="Novo cargo">
          <ActionForm
            feature="createRole"
            label="Cadastrar cargo"
            onSave={async (values) => {
              const nome = values.nome_cargo.trim();
              if (!nome) throw new Error("Informe o nome do cargo.");
              await request("/cargo", {
                method: "POST",
                body: {
                  nome_cargo: nome,
                  nivel_acesso: Number(values.nivel_acesso),
                },
              });
              refresh();
              return "Cargo cadastrado.";
            }}
          >
            <div className="form-grid">
              <Field
                label="Nome do cargo"
                name="nome_cargo"
                required
                maxLength={100}
              />
              <Field
                label="Nível de acesso"
                name="nivel_acesso"
                required
                type="number"
                min={0}
                step={1}
              />
            </div>
          </ActionForm>
        </Panel>
        <p className="notice">
          O nível de acesso é um dado do cadastro. A aplicação não possui uma
          matriz de permissões configurável.
        </p>
      </section>
      {action && (
        <UserAction
          action={action}
          onClose={() => setAction(null)}
          onSaved={refresh}
        />
      )}
    </>
  );
}
function UserAction({ action, onClose, onSaved }) {
  const { type, row } = action;
  const employee = type.endsWith("Employee");
  const removing = type.startsWith("remove");
  const feature = removing
    ? employee
      ? "deactivateEmployee"
      : "deleteRole"
    : employee
      ? "editEmployee"
      : "editRole";
  const id = employee ? row.id_funcionario : row.id_cargo;
  const title = removing
    ? employee
      ? "Desativar funcionário"
      : "Excluir cargo"
    : employee
      ? "Editar acesso"
      : "Editar cargo";
  return (
    <Modal title={title} onClose={onClose}>
      <ActionForm
        className=""
        feature={feature}
        label={
          removing
            ? employee
              ? "Desativar"
              : "Excluir"
            : employee
              ? "Salvar acesso"
              : "Salvar cargo"
        }
        onSave={async (values) => {
          const method = removing ? "DELETE" : "PUT";
          let body;
          if (!removing) {
            if (employee) {
              body = { email: values.email.trim().toLowerCase() };
              if (values.senha) body.senha = values.senha;
            } else
              body = {
                nome_cargo: values.nome_cargo.trim(),
                nivel_acesso: Number(values.nivel_acesso),
              };
          }
          await request(`/${employee ? "funcionario" : "cargo"}/${id}`, {
            method,
            body,
          });
          onSaved();
          onClose();
          return removing
            ? employee
              ? "Funcionário desativado."
              : "Cargo excluído."
            : employee
              ? "Acesso atualizado."
              : "Cargo atualizado.";
        }}
      >
        {removing ? (
          <>
            <p>
              {employee ? "Desativar" : "Excluir"}{" "}
              <strong>{employee ? row.nome_completo : row.nome_cargo}</strong>?
            </p>
            <p className="muted">
              {employee
                ? "O funcionário deixará de aparecer na lista de ativos."
                : "A exclusão pode ser recusada se o cargo estiver vinculado a funcionários."}
            </p>
            <div className="form-actions">
              <button
                className="button secondary"
                type="button"
                onClick={onClose}
              >
                Cancelar
              </button>
            </div>
          </>
        ) : employee ? (
          <>
            <p className="muted">{row.nome_completo}</p>
            <div className="form-grid">
              <Field
                label="E-mail"
                name="email"
                type="email"
                required
                maxLength={150}
                defaultValue={row.email}
              />
              <Field
                label="Nova senha (opcional)"
                name="senha"
                type="password"
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
            </div>
          </>
        ) : (
          <div className="form-grid">
            <Field
              label="Nome"
              name="nome_cargo"
              required
              maxLength={100}
              defaultValue={row.nome_cargo}
            />
            <Field
              label="Nível de acesso"
              name="nivel_acesso"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={row.nivel_acesso}
            />
          </div>
        )}
      </ActionForm>
    </Modal>
  );
}
