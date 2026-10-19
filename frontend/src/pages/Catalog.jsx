import { useResource } from "../services/hooks.js";
import { request } from "../services/api.js";
import {
  Heading,
  Panel,
  Table,
  Badge,
  ErrorMessage,
  ActionForm,
  Field,
  SelectField,
} from "../components/common.jsx";
export default function Catalog() {
  const brands = useResource("/marca");
  const models = useResource("/modelo");
  const refresh = () => {
    brands.reload();
    models.reload();
  };
  return (
    <>
      <Heading
        eyebrow="ORGANIZAÇÃO DO CATÁLOGO"
        title="Marcas e modelos"
        subtitle="Consulte os cadastros que identificam os calçados da loja."
      />
      <p className="notice">
        O cadastro de variações de tamanho e cor ainda não está disponível. Os
        SKUs existentes podem ser consultados no{" "}
        <a className="panel-link" href="inventory.html">
          Estoque
        </a>
        .
      </p>
      <div className="grid-two">
        <Panel
          title="Modelos"
          actions={
            <button
              className="button secondary"
              disabled={brands.loading || models.loading}
              onClick={refresh}
            >
              ↻ Atualizar
            </button>
          }
        >
          <ErrorMessage message={models.error} />
          <Table
            headers={["Modelo", "Marca", "Gênero", "Situação"]}
            loading={models.loading}
            error={models.error}
          >
            {models.data.map((r) => (
              <tr key={r.id_modelo}>
                <td>
                  <strong>{r.nome_modelo}</strong>
                  <small>#{r.id_modelo}</small>
                </td>
                <td>
                  {brands.data.find(
                    (b) => Number(b.id_marca) === Number(r.id_marca),
                  )?.nome_marca || `Marca #${r.id_marca}`}
                </td>
                <td>{r.genero || "—"}</td>
                <td>
                  <Badge kind={Number(r.ativo) === 1 ? "success" : ""}>
                    {Number(r.ativo) === 1 ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel title="Marcas">
          <ErrorMessage message={brands.error} />
          <Table
            headers={["Código", "Nome"]}
            loading={brands.loading}
            error={brands.error}
          >
            {brands.data.map((r) => (
              <tr key={r.id_marca}>
                <td>#{r.id_marca}</td>
                <td>{r.nome_marca}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
      <div className="grid-two">
        <Panel title="Novo modelo">
          <ActionForm
            feature="createModel"
            label="Cadastrar modelo"
            onSave={async (values) => {
              const nome = values.nome.trim();
              if (!nome) throw new Error("Informe o nome do modelo.");
              await request("/modelo", {
                method: "POST",
                body: { nome, idMarca: Number(values.idMarca) },
              });
              refresh();
              return "Modelo cadastrado.";
            }}
          >
            <div className="form-grid">
              <Field
                label="Nome do modelo"
                name="nome"
                required
                maxLength={100}
              />
              <SelectField label="Marca" name="idMarca" required>
                <option value="">Selecione</option>
                {brands.data.map((r) => (
                  <option key={r.id_marca} value={r.id_marca}>
                    {r.nome_marca}
                  </option>
                ))}
              </SelectField>
            </div>
          </ActionForm>
        </Panel>
        <Panel title="Nova marca">
          <ActionForm
            feature="createBrand"
            label="Cadastrar marca"
            onSave={async (values) => {
              const nome = values.nome.trim();
              if (!nome) throw new Error("Informe o nome da marca.");
              await request("/marca", { method: "POST", body: { nome } });
              refresh();
              return "Marca cadastrada.";
            }}
          >
            <Field label="Nome da marca" name="nome" required maxLength={60} />
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
