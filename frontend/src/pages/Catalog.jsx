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
  const categories = useResource("/categoria");
  const refresh = () => {
    brands.reload();
    models.reload();
    categories.reload();
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
              <tr key={r.idModelo}>
                <td>
                  <strong>{r.nome}</strong>
                  <small>#{r.idModelo}</small>
                </td>
                <td>
                  {brands.data.find(
                    (b) => Number(b.idMarca) === Number(r.idMarca),
                  )?.nome || `Marca #${r.idMarca}`}
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
              <tr key={r.idMarca}>
                <td>#{r.idMarca}</td>
                <td>{r.nome}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
      <div className="grid-two">
        <Panel title="Novo modelo">
          <ErrorMessage message={categories.error} />
          <ActionForm
            feature="createModel"
            label="Cadastrar modelo"
            onSave={async (values) => {
              const nome = values.nome.trim();
              if (!nome) throw new Error("Informe o nome do modelo.");
              await request("/modelo", {
                method: "POST",
                body: { nome, idMarca: Number(values.idMarca), idCategoria: Number(values.idCategoria) },
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
                  <option key={r.idMarca} value={r.idMarca}>
                    {r.nome}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Categoria" name="idCategoria" required>
                <option value="">Selecione</option>
                {categories.data.map((r) => (
                  <option key={r.idCategoria} value={r.idCategoria}>{r.nome}</option>
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
