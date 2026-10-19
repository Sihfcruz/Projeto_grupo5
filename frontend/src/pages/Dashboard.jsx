import { useResource } from "../services/hooks.js";
import { number, money, date } from "../services/data.js";
import {
  Heading,
  Panel,
  Table,
  ErrorMessage,
  Stats,
  StockStatus,
  BrandBars,
} from "../components/common.jsx";
export default function Dashboard() {
  const stock = useResource("/estoque");
  const entries = useResource("/entrada");
  const rows = stock.data;
  const ready = !stock.loading && !stock.error;
  const low = rows
    .filter((r) => Number(r.saldo_estoque) <= Number(r.estoque_minimo))
    .sort((a, b) => Number(a.saldo_estoque) - Number(b.saldo_estoque));
  return (
    <>
      <Heading
        eyebrow="PAINEL DA LOJA"
        title="Visão geral"
        subtitle="Acompanhe a disponibilidade dos seus calçados e os recebimentos."
      >
        <button
          className="button secondary"
          disabled={stock.loading || entries.loading}
          onClick={() => {
            stock.reload();
            entries.reload();
          }}
        >
          ↻ Atualizar
        </button>
        <a className="button" href="movements.html">
          + Movimentação
        </a>
      </Heading>
      <ErrorMessage message={stock.error} />
      <Stats
        items={[
          [
            "Unidades disponíveis",
            ready
              ? number(rows.reduce((s, r) => s + Number(r.saldo_estoque), 0))
              : "—",
            "Saldo dos SKUs consultados",
            "accent",
          ],
          [
            "SKUs ativos",
            ready ? number(rows.length) : "—",
            "Variações no estoque atual",
          ],
          [
            "Valor potencial de venda",
            ready
              ? money(
                  rows.reduce(
                    (s, r) =>
                      s + Number(r.saldo_estoque) * Number(r.preco_venda),
                    0,
                  ),
                )
              : "—",
            "Saldo × preço de venda",
          ],
          [
            "SKUs em alerta",
            ready ? number(low.length) : "—",
            "Saldo igual ou menor que o mínimo",
            "alert",
          ],
        ]}
      />
      <div className="grid-two">
        <Panel
          title="Estoque por marca"
          subtitle="Quantidade de unidades disponíveis"
          actions={
            <a className="panel-link" href="reports.html">
              Ver relatório →
            </a>
          }
        >
          <BrandBars rows={rows} loading={stock.loading} error={stock.error} />
        </Panel>
        <Panel title="Acesso rápido">
          <div className="panel-body quick-links">
            <a href="inventory.html">
              <span>
                Consultar estoque
                <small>Encontre modelos, tamanhos e cores</small>
              </span>
              →
            </a>
            <a href="movements.html">
              <span>
                Registrar recebimento
                <small>Organize entradas por SKU e lote</small>
              </span>
              →
            </a>
            <a href="users.html">
              <span>
                Gerenciar equipe<small>Funcionários e cargos da loja</small>
              </span>
              →
            </a>
          </div>
        </Panel>
      </div>
      <Panel
        title="Prioridade de reposição"
        subtitle="SKUs que atingiram o estoque mínimo"
        actions={
          <a className="panel-link" href="inventory.html?status=low">
            Consultar todos →
          </a>
        }
      >
        <Table
          headers={[
            "Modelo / marca",
            "Variação",
            "Saldo",
            "Mínimo",
            "Situação",
          ]}
          loading={stock.loading}
          error={stock.error}
          empty="Nenhum SKU precisa de reposição."
        >
          {low.slice(0, 5).map((r) => (
            <tr key={r.id_sku}>
              <td>
                <strong>{r.nome_modelo}</strong>
                <small>{r.nome_marca}</small>
              </td>
              <td>
                {r.tamanho} · {r.cor}
              </td>
              <td>{number(r.saldo_estoque)}</td>
              <td>{number(r.estoque_minimo)}</td>
              <td>
                <StockStatus row={r} />
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Panel
        title="Últimos recebimentos"
        actions={
          <a className="panel-link" href="movements.html">
            Ver movimentações →
          </a>
        }
      >
        <ErrorMessage message={entries.error} />
        <Table
          headers={["Recebimento", "SKU", "Quantidade", "Lote", "Data"]}
          loading={entries.loading}
          error={entries.error}
          empty="Nenhum recebimento registrado."
        >
          {entries.data.slice(0, 5).map((r) => (
            <tr key={r.idEntrada}>
              <td>#{r.idEntrada}</td>
              <td>{r.idSku}</td>
              <td>{number(r.quantidade)}</td>
              <td>{r.lote}</td>
              <td>{date(r.dataEntrada)}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
