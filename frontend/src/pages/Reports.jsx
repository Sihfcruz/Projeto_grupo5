import { useEffect, useState } from "react";
import { useResource } from "../services/hooks.js";
import {
  money,
  number,
  today,
  groupBrands,
  exportCSV,
} from "../services/data.js";
import {
  Heading,
  Panel,
  Table,
  Stats,
  BrandBars,
  StockStatus,
  ErrorMessage,
} from "../components/common.jsx";
export default function Reports() {
  const stock = useResource("/estoque");
  const [generated, setGenerated] = useState("");
  useEffect(() => {
    if (!stock.loading && !stock.error)
      setGenerated(new Date().toLocaleString("pt-BR"));
  }, [stock.data, stock.loading, stock.error]);
  const rows = stock.data;
  const ready = !stock.loading && !stock.error;
  const brands = groupBrands(rows);
  const low = rows.filter(
    (r) => Number(r.saldo_estoque) <= Number(r.estoque_minimo),
  );
  return (
    <>
      <Heading
        eyebrow="INDICADORES DA LOJA"
        title="Relatório de estoque"
        subtitle="Retrato do estoque atual, calculado a partir dos SKUs consultados."
      >
        <button
          className="button secondary"
          disabled={stock.loading}
          onClick={stock.reload}
        >
          ↻ Atualizar
        </button>
        <button
          className="button"
          disabled={!ready}
          onClick={() =>
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
              rows.map((r) => [
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
            )
          }
        >
          ↓ Exportar CSV
        </button>
      </Heading>
      <ErrorMessage message={stock.error} />
      <p className="notice">
        Os valores usam o preço de venda cadastrado. Eles representam o valor
        potencial dos itens em estoque, sem considerar descontos, custos ou
        faturamento.
      </p>
      <Stats
        items={[
          [
            "Unidades em estoque",
            ready
              ? number(
                  rows.reduce((sum, r) => sum + Number(r.saldo_estoque), 0),
                )
              : "—",
            "Estoque atual consultado",
            "accent",
          ],
          [
            "Valor potencial",
            ready
              ? money(
                  rows.reduce(
                    (sum, r) =>
                      sum + Number(r.saldo_estoque) * Number(r.preco_venda),
                    0,
                  ),
                )
              : "—",
            "Estoque atual consultado",
          ],
          [
            "SKUs em alerta",
            ready ? number(low.length) : "—",
            "Estoque atual consultado",
          ],
          [
            "Marcas no estoque",
            ready ? number(brands.length) : "—",
            "Estoque atual consultado",
          ],
        ]}
      />
      <div className="grid-two">
        <Panel title="Distribuição por marca">
          <BrandBars rows={rows} loading={stock.loading} error={stock.error} />
        </Panel>
        <Panel title="Resumo por marca">
          <Table
            headers={["Marca", "SKUs", "Unidades", "Valor potencial"]}
            loading={stock.loading}
            error={stock.error}
          >
            {brands.map(([name, item]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{number(item.skus)}</td>
                <td>{number(item.units)}</td>
                <td>{money(item.value)}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
      <Panel
        title="Itens para reposição"
        subtitle="Saldo igual ou menor que o mínimo definido"
        actions={ready && <span className="count">Consulta: {generated}</span>}
      >
        <Table
          headers={[
            "Modelo / marca",
            "SKU",
            "Saldo",
            "Mínimo",
            "Faltam para o mínimo",
            "Situação",
          ]}
          loading={stock.loading}
          error={stock.error}
          empty="Nenhum item precisa de reposição."
        >
          {low.map((r) => (
            <tr key={r.id_sku}>
              <td>
                <strong>{r.nome_modelo}</strong>
                <small>
                  {r.nome_marca} · {r.tamanho} · {r.cor}
                </small>
              </td>
              <td>#{r.id_sku}</td>
              <td>{number(r.saldo_estoque)}</td>
              <td>{number(r.estoque_minimo)}</td>
              <td>
                {number(
                  Math.max(
                    0,
                    Number(r.estoque_minimo) - Number(r.saldo_estoque),
                  ),
                )}
              </td>
              <td>
                <StockStatus row={r} />
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
