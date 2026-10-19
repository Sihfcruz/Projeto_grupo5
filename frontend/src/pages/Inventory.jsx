import { useState } from "react";
import { useResource } from "../services/hooks.js";
import {
  detail,
  money,
  number,
  normalize,
  exportCSV,
} from "../services/data.js";
import {
  Heading,
  Table,
  Field,
  SelectField,
  StockStatus,
  ErrorMessage,
  Modal,
  Details,
} from "../components/common.jsx";
export default function Inventory() {
  const stock = useResource("/estoque");
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState(
    new URLSearchParams(location.search).get("status") || "",
  );
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const filtered = stock.data.filter(
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
      ).includes(normalize(search)) &&
      (!brand || r.nome_marca === brand) &&
      (!status ||
        (status === "low" &&
          Number(r.saldo_estoque) <= Number(r.estoque_minimo)) ||
        (status === "available" &&
          Number(r.saldo_estoque) > Number(r.estoque_minimo)) ||
        (status === "zero" && Number(r.saldo_estoque) === 0)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages);
  async function inspect(id) {
    setModalOpen(true);
    setSelected(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      setSelected(await detail("/estoque", id));
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="DISPONIBILIDADE"
        title="Estoque"
        subtitle="Cada modelo, tamanho e cor em uma visão única."
      >
        <button
          className="button secondary"
          disabled={stock.loading || !!stock.error}
          onClick={() =>
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
            )
          }
        >
          ↓ Exportar CSV
        </button>
        <a className="button" href="movements.html">
          + Recebimento
        </a>
      </Heading>
      <ErrorMessage message={stock.error} />
      <section className="panel">
        <div className="toolbar">
          <Field
            label="Buscar no estoque"
            className="search-field"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Modelo, marca, cor ou código de barras"
          />
          <SelectField
            label="Marca"
            value={brand}
            onChange={(event) => {
              setBrand(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas as marcas</option>
            {[...new Set(stock.data.map((r) => r.nome_marca).filter(Boolean))]
              .sort()
              .map((name) => (
                <option key={name}>{name}</option>
              ))}
          </SelectField>
          <SelectField
            label="Situação"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas as situações</option>
            <option value="low">Estoque baixo ou zerado</option>
            <option value="available">Disponível</option>
            <option value="zero">Sem estoque</option>
          </SelectField>
          <button
            className="button secondary"
            disabled={stock.loading}
            onClick={() => {
              setPage(1);
              stock.reload();
            }}
          >
            ↻ Atualizar
          </button>
        </div>
        <Table
          headers={[
            "Modelo / marca",
            "SKU / código",
            "Tamanho / cor",
            "Preço de venda",
            "Saldo",
            "Situação",
            "Ações",
          ]}
          loading={stock.loading}
          error={stock.error}
          empty="Nenhum SKU corresponde aos filtros."
        >
          {filtered.slice((current - 1) * 10, current * 10).map((r) => (
            <tr key={r.id_sku}>
              <td>
                <strong>{r.nome_modelo}</strong>
                <small>{r.nome_marca}</small>
              </td>
              <td>
                #{r.id_sku}
                <small>{r.codigo_barras}</small>
              </td>
              <td>
                {r.tamanho} · {r.cor}
              </td>
              <td className="numeric">{money(r.preco_venda)}</td>
              <td className="numeric">
                {number(r.saldo_estoque)}
                <small>Mínimo: {number(r.estoque_minimo)}</small>
              </td>
              <td>
                <StockStatus row={r} />
              </td>
              <td>
                <button
                  className="text-button"
                  onClick={() => inspect(r.id_sku)}
                >
                  Detalhes
                </button>
              </td>
            </tr>
          ))}
        </Table>
        <div className="pagination">
          <span aria-live="polite">
            {stock.loading
              ? "Carregando…"
              : stock.error
                ? "Sem dados"
                : `${number(filtered.length)} SKUs · Página ${current} de ${pages}`}
          </span>
          <div>
            <button
              className="button secondary"
              disabled={stock.loading || !!stock.error || current === 1}
              onClick={() => setPage(current - 1)}
            >
              Anterior
            </button>
            <button
              className="button secondary"
              disabled={stock.loading || !!stock.error || current === pages}
              onClick={() => setPage(current + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      </section>
      {modalOpen && (
        <Modal title="Detalhes do SKU" onClose={() => setModalOpen(false)}>
          {detailLoading ? (
            <p>Carregando…</p>
          ) : detailError ? (
            <ErrorMessage message={detailError} />
          ) : (
            selected && (
              <>
                <Details
                  fields={[
                    ["Modelo", selected.nome_modelo],
                    ["Marca", selected.nome_marca],
                    ["SKU", selected.id_sku],
                    ["Código de barras", selected.codigo_barras],
                    ["Tamanho", selected.tamanho],
                    ["Cor", selected.cor],
                    ["Preço de venda", money(selected.preco_venda)],
                    ["Saldo", number(selected.saldo_estoque)],
                    ["Estoque mínimo", number(selected.estoque_minimo)],
                  ]}
                />
                <StockStatus row={selected} />
              </>
            )
          )}
        </Modal>
      )}
    </>
  );
}
