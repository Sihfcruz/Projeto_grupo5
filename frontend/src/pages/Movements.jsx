import { useCallback, useEffect, useRef, useState } from "react";
import { useResource } from "../services/hooks.js";
import { list, detail, money, number, date } from "../services/data.js";
import { request, asList } from "../services/api.js";
import { isDemo } from "../services/session.js";
import {
  Heading,
  Panel,
  Table,
  Field,
  ErrorMessage,
  Modal,
  Details,
  Badge,
} from "../components/common.jsx";
import {
  EntryForm,
  SaleForm,
  ReturnForm,
  AdjustmentForm,
} from "../components/MovementForms.jsx";
export default function Movements() {
  const stock = useResource("/estoque");
  const [tab, setTab] = useState("entrada");
  const [historyType, setHistoryType] = useState("entrada");
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState(null);
  const refresh = () => {
    stock.reload();
    setVersion((value) => value + 1);
  };
  const saved = (type) => {
    if (type !== "ajuste") setHistoryType(type);
    refresh();
  };
  return (
    <>
      <Heading
        eyebrow="ROTINA DA LOJA"
        title="Movimentações"
        subtitle="Organize recebimentos, vendas, devoluções e ajustes de estoque."
      >
        <button
          className="button secondary"
          disabled={stock.loading}
          onClick={refresh}
        >
          ↻ Atualizar consultas
        </button>
      </Heading>
      <ErrorMessage message={stock.error} />
      <Panel title="Registrar movimentação">
        <div className="panel-body">
          <div className="tabs" aria-label="Tipo de movimentação">
            {[
              ["entrada", "Recebimento"],
              ["venda", "Venda"],
              ["devolucao", "Devolução / troca"],
              ["ajuste", "Ajuste"],
            ].map(([key, label]) => (
              <button
                type="button"
                key={key}
                aria-pressed={tab === key}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div hidden={tab !== "entrada"}>
            <EntryForm stock={stock.data} onSaved={saved} />
          </div>
          <div hidden={tab !== "venda"}>
            <SaleForm stock={stock.data} onSaved={saved} />
          </div>
          <div hidden={tab !== "devolucao"}>
            <ReturnForm onSaved={saved} />
          </div>
          <div hidden={tab !== "ajuste"}>
            <AdjustmentForm stock={stock.data} onSaved={saved} />
          </div>
        </div>
      </Panel>
      <History
        type={historyType}
        onType={setHistoryType}
        version={version}
        onDetail={(id) => setSelected({ type: historyType, id })}
      />
      {selected && (
        <MovementDetail
          type={selected.type}
          id={selected.id}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
function History({ type, onType, version, onDetail }) {
  const [rows, setRows] = useState([]);
  const [loadedType, setLoadedType] = useState(type);
  const visibleRows = loadedType === type ? rows : [];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState(null);
  const [coverage, setCoverage] = useState(
    "Registros retornados pela consulta",
  );
  const generation = useRef(0);
  const seen = useRef(new Set());
  const busy = useRef(false);
  const idField =
    type === "entrada"
      ? "idEntrada"
      : type === "venda"
        ? "id_venda"
        : "idDevolucao";
  const nextPage = useCallback((pagination) => {
    setCursor(null);
    if (pagination?.temMais) {
      if (
        typeof pagination.proximoCursor === "string" &&
        !seen.current.has(pagination.proximoCursor)
      ) {
        seen.current.add(pagination.proximoCursor);
        setCursor(pagination.proximoCursor);
        setCoverage("Consulta parcial: há mais vendas para carregar.");
      } else
        setCoverage(
          "Consulta parcial: a API não forneceu um cursor válido para continuar.",
        );
    } else setCoverage("Registros retornados pela consulta");
  }, []);
  const fetchPage = useCallback(
    async (next) => {
      if (type === "venda" && !isDemo()) {
        const response = await request(
          `/venda${next ? `?cursor=${encodeURIComponent(next)}` : ""}`,
        );
        return { data: asList(response), pagination: response.paginacao };
      }
      return { data: await list(`/${type}`) };
    },
    [type],
  );
  useEffect(() => {
    const current = ++generation.current;
    setRows([]);
    setLoadedType(type);
    setCursor(null);
    setError("");
    setLoading(true);
    setCoverage("Registros retornados pela consulta");
    seen.current = new Set();
    busy.current = true;
    fetchPage(null)
      .then((result) => {
        if (current !== generation.current) return;
        setRows(result.data);
        nextPage(result.pagination);
      })
      .catch((err) => {
        if (current === generation.current) setError(err.message);
      })
      .finally(() => {
        if (current === generation.current) {
          setLoading(false);
          busy.current = false;
        }
      });
    return () => {
      generation.current++;
    };
  }, [type, version, fetchPage, nextPage]);
  async function more() {
    if (!cursor || busy.current) return;
    const current = generation.current;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const result = await fetchPage(cursor);
      if (current !== generation.current) return;
      const existing = new Set(rows.map((r) => r[idField]));
      if (
        result.data.length &&
        result.data.every((r) => existing.has(r[idField]))
      )
        throw new Error(
          "A consulta retornou registros repetidos. Não foi possível continuar a paginação.",
        );
      setRows((previous) => [
        ...previous,
        ...result.data.filter((r) => !existing.has(r[idField])),
      ]);
      nextPage(result.pagination);
    } catch (err) {
      if (current === generation.current) {
        setError(err.message);
        setCursor(null);
      }
    } finally {
      if (current === generation.current) {
        setLoading(false);
        busy.current = false;
      }
    }
  }
  const headers =
    type === "entrada"
      ? ["ID", "SKU", "Quantidade", "Valor de aquisição", "Data", "Ações"]
      : type === "venda"
        ? ["ID", "Canal", "Situação", "Valor total", "Data", "Ações"]
        : ["ID", "Item vendido", "Tipo", "Quantidade", "Data", "Ações"];
  return (
    <Panel
      title="Histórico de movimentações"
      subtitle={coverage}
      actions={
        <Field label="Tipo">
          <select value={type} onChange={(event) => onType(event.target.value)}>
            <option value="entrada">Recebimentos</option>
            <option value="venda">Vendas</option>
            <option value="devolucao">Devoluções / trocas</option>
          </select>
        </Field>
      }
    >
      <ErrorMessage message={error} />
      <Table
        headers={headers}
        loading={loading && !visibleRows.length}
        error={error && !visibleRows.length}
      >
        {visibleRows.map((r) => (
          <tr key={r[idField]}>
            {type === "entrada" ? (
              <>
                <td>#{r.idEntrada}</td>
                <td>#{r.idSku}</td>
                <td>{number(r.quantidade)}</td>
                <td>{money(r.valorTotal)}</td>
                <td>{date(r.dataEntrada)}</td>
              </>
            ) : type === "venda" ? (
              <>
                <td>#{r.id_venda}</td>
                <td>{r.canal}</td>
                <td>
                  <Badge kind={r.status === "PAGA" ? "success" : ""}>
                    {r.status}
                  </Badge>
                </td>
                <td>{money(r.valor_total)}</td>
                <td>{date(r.data_venda)}</td>
              </>
            ) : (
              <>
                <td>#{r.idDevolucao}</td>
                <td>#{r.idItemVenda}</td>
                <td>
                  <Badge>{r.tipo === "TROCA" ? "Troca" : "Devolução"}</Badge>
                </td>
                <td>{number(r.quantidade)}</td>
                <td>{date(r.dataDevolucao)}</td>
              </>
            )}
            <td>
              <button
                className="text-button"
                onClick={() => onDetail(r[idField])}
              >
                Detalhes
              </button>
            </td>
          </tr>
        ))}
      </Table>
      <div className="pagination">
        <span>
          {error && !visibleRows.length
            ? "Sem dados"
            : `${visibleRows.length} registros carregados`}
        </span>
        {cursor && (
          <button
            className="button secondary"
            disabled={loading}
            onClick={more}
          >
            Carregar mais vendas
          </button>
        )}
      </div>
    </Panel>
  );
}
function MovementDetail({ type, id, onClose }) {
  const [row, setRow] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    detail(`/${type}`, id)
      .then((value) => {
        if (!value) throw new Error("Registro não encontrado.");
        if (active) setRow(value);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [type, id]);
  const title =
    type === "venda"
      ? "Detalhes da venda"
      : type === "entrada"
        ? "Detalhes do recebimento"
        : "Detalhes da devolução";
  const fields = !row
    ? []
    : type === "entrada"
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
  return (
    <Modal title={title} onClose={onClose}>
      {error ? (
        <ErrorMessage message={error} />
      ) : !row ? (
        <p>Carregando…</p>
      ) : (
        <>
          <Details fields={fields} />
          {type === "venda" && (
            <>
              <h3>Itens vendidos</h3>
              <Table
                headers={[
                  "Item / SKU",
                  "Modelo",
                  "Quantidade",
                  "Preço unitário",
                ]}
              >
                {(row.itens || []).map((item) => (
                  <tr key={item.id_item_venda}>
                    <td>
                      #{item.id_item_venda} / #{item.id_sku}
                    </td>
                    <td>{item.nome_modelo}</td>
                    <td>{number(item.quantidade)}</td>
                    <td>{money(item.preco_unitario)}</td>
                  </tr>
                ))}
              </Table>
              <h3>Pagamentos</h3>
              <div className="panel-body">
                {row.pagamentos?.length ? (
                  row.pagamentos.map((payment, index) => (
                    <p key={payment.id_pagamento || index}>
                      {payment.forma} · {money(payment.valor)} ·{" "}
                      {payment.status}
                    </p>
                  ))
                ) : (
                  <p className="muted">Sem pagamentos registrados.</p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
