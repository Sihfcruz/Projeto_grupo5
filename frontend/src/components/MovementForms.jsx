import { useRef, useState } from "react";
import {
  employeeId,
  today,
  money,
  number,
  detail,
  saleData,
} from "../services/data.js";
import { request } from "../services/api.js";
import { Field, SelectField, ActionForm, ErrorMessage } from "./common.jsx";
const positive = { type: "number", required: true, min: 1, step: 1 };
const moneyInput = { type: "number", min: 0, max: 99999999.99, step: 0.01 };
function EmployeeField() {
  return (
    <Field
      label="Funcionário responsável"
      name="idFuncionario"
      {...positive}
      value={employeeId()}
      readOnly
    />
  );
}
function SkuOptions({ stock }) {
  return (
    <>
      <option value="">Selecione um SKU</option>
      {stock.map((r) => (
        <option key={r.id_sku} value={r.id_sku}>
          #{r.id_sku} · {r.nome_modelo} · {r.tamanho} · {r.cor} (
          {number(r.saldo_estoque)} un.)
        </option>
      ))}
    </>
  );
}
export function EntryForm({ stock, onSaved }) {
  return (
    <ActionForm
      className=""
      feature="createEntry"
      label="Registrar recebimento"
      onSave={async (values) => {
        const body = {
          idFuncionario: employeeId(),
          idSku: Number(values.idSku),
          idFornecedor: values.idFornecedor
            ? Number(values.idFornecedor)
            : null,
          quantidade: Number(values.quantidade),
          valorTotal: Number(values.valorTotal),
          dataEntrada: values.dataEntrada,
          lote: values.lote.trim(),
          notaFiscal: values.notaFiscal.trim() || null,
        };
        if (!body.lote) throw new Error("Informe o lote do recebimento.");
        const result = await request("/entrada", { method: "POST", body });
        onSaved("entrada");
        return result?.mensagem || "Movimentação registrada.";
      }}
    >
      <div className="form-grid">
        <EmployeeField />
        <SelectField label="SKU recebido" name="idSku" required>
          <SkuOptions stock={stock} />
        </SelectField>
        <Field label="Quantidade" name="quantidade" {...positive} />
        <Field
          label="Valor total de aquisição (R$)"
          name="valorTotal"
          {...moneyInput}
          required
          min={0.01}
        />
        <Field
          label="Data do recebimento"
          name="dataEntrada"
          type="date"
          required
          defaultValue={today()}
        />
        <Field label="Lote" name="lote" required maxLength={20} />
        <Field
          label="ID do fornecedor (opcional)"
          name="idFornecedor"
          type="number"
          min={1}
          step={1}
        />
        <Field
          label="Nota fiscal (opcional)"
          name="notaFiscal"
          maxLength={44}
        />
      </div>
    </ActionForm>
  );
}
export function SaleForm({ stock, onSaved }) {
  const counter = useRef(0);
  const fresh = () => ({
    key: counter.current++,
    idSku: "",
    quantidade: "1",
    descontoItem: "0",
  });
  const [items, setItems] = useState(() => [fresh()]);
  const [discount, setDiscount] = useState("0");
  const [payment, setPayment] = useState("");
  const [installments, setInstallments] = useState("1");
  const total = saleData(items, stock, discount).totalCent;
  function update(key, field, value) {
    setItems((current) =>
      current.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    );
  }
  return (
    <ActionForm
      className=""
      feature="createSale"
      label="Registrar venda"
      onSave={async (values) => {
        const { itens, totalCent } = saleData(items, stock, discount);
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
        if (payment && totalCent <= 0)
          throw new Error("O pagamento deve ter valor maior que zero.");
        const body = {
          idFuncionario: employeeId(),
          idCliente: values.idCliente ? Number(values.idCliente) : null,
          canal: values.canal,
          desconto: Number(discount),
          codigoRastreamento: values.codigoRastreamento.trim() || null,
          observacao: values.observacao.trim() || null,
          itens,
          pagamentos: payment
            ? [
                {
                  forma: payment,
                  parcelas:
                    payment === "CARTAO_CREDITO" ? Number(values.parcelas) : 1,
                  valor: totalCent / 100,
                  status: values.statusPagamento,
                },
              ]
            : [],
        };
        const result = await request("/venda", { method: "POST", body });
        setItems([fresh()]);
        setDiscount("0");
        setPayment("");
        setInstallments("1");
        onSaved("venda");
        return result?.mensagem || "Movimentação registrada.";
      }}
    >
      <div className="form-grid">
        <EmployeeField />
        <SelectField label="Canal" name="canal">
          <option value="LOJA">Loja</option>
          <option value="ONLINE">Online</option>
        </SelectField>
        <Field
          label="ID do cliente (opcional)"
          name="idCliente"
          type="number"
          min={1}
          step={1}
        />
        <Field
          label="Desconto total da venda (R$)"
          name="desconto"
          {...moneyInput}
          value={discount}
          onChange={(event) => setDiscount(event.target.value)}
        />
        <Field
          label="Código de rastreamento (opcional)"
          name="codigoRastreamento"
          maxLength={50}
        />
        <Field label="Observação (opcional)">
          <textarea name="observacao" maxLength={255} />
        </Field>
      </div>
      <div className="panel-head">
        <h3>Itens da venda</h3>
        <button
          type="button"
          className="button secondary"
          onClick={() => setItems((current) => [...current, fresh()])}
        >
          + Adicionar item
        </button>
      </div>
      <div className="sale-items">
        {items.map((item) => (
          <div className="sale-item" key={item.key}>
            <SelectField
              label="SKU"
              name={`sku-${item.key}`}
              required
              value={item.idSku}
              onChange={(event) =>
                update(item.key, "idSku", event.target.value)
              }
            >
              <SkuOptions stock={stock} />
            </SelectField>
            <Field
              label="Quantidade"
              name={`quantity-${item.key}`}
              {...positive}
              value={item.quantidade}
              onChange={(event) =>
                update(item.key, "quantidade", event.target.value)
              }
            />
            <Field
              label="Desconto do item (R$)"
              name={`discount-${item.key}`}
              {...moneyInput}
              value={item.descontoItem}
              onChange={(event) =>
                update(item.key, "descontoItem", event.target.value)
              }
            />
            <button
              className="icon-button"
              type="button"
              disabled={items.length === 1}
              aria-label="Remover item"
              onClick={() =>
                setItems((current) =>
                  current.filter((row) => row.key !== item.key),
                )
              }
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="sale-total">
        <span>Total estimado</span>
        <strong>{money(total / 100)}</strong>
      </div>
      <p className="muted">
        O valor final é calculado pelo servidor com o preço cadastrado de cada
        SKU.
      </p>
      <div className="form-grid" style={{ marginTop: 20 }}>
        <SelectField
          label="Pagamento"
          name="forma"
          value={payment}
          onChange={(event) => {
            setPayment(event.target.value);
            if (event.target.value !== "CARTAO_CREDITO") setInstallments("1");
          }}
        >
          <option value="">Sem pagamento (venda aberta)</option>
          {[
            ["DINHEIRO", "Dinheiro"],
            ["PIX", "Pix"],
            ["CARTAO_CREDITO", "Cartão de crédito"],
            ["CARTAO_DEBITO", "Cartão de débito"],
            ["BOLETO", "Boleto"],
            ["VALE_TROCA", "Vale troca"],
          ].map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <Field
          label="Parcelas"
          name="parcelas"
          type="number"
          min={1}
          max={24}
          step={1}
          value={installments}
          onChange={(event) => setInstallments(event.target.value)}
          disabled={payment !== "CARTAO_CREDITO"}
        />
        <SelectField
          label="Situação do pagamento"
          name="statusPagamento"
          disabled={!payment}
        >
          <option value="PENDENTE">Pendente</option>
          <option value="APROVADO">Aprovado</option>
        </SelectField>
      </div>
    </ActionForm>
  );
}
export function ReturnForm({ onSaved }) {
  const [origin, setOrigin] = useState("");
  const [items, setItems] = useState([]);
  const [type, setType] = useState("DEVOLUCAO");
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const lookupVersion = useRef(0);
  async function lookup() {
    const id = Number(origin);
    setItems([]);
    setLookupError("");
    if (!Number.isInteger(id) || id < 1) {
      setLookupError("Informe o ID da venda de origem.");
      return;
    }
    const version = ++lookupVersion.current;
    setLoading(true);
    try {
      const sale = await detail("/venda", id);
      if (!Array.isArray(sale?.itens))
        throw new Error("A API não retornou os itens desta venda.");
      if (version === lookupVersion.current) setItems(sale.itens);
    } catch (err) {
      if (version === lookupVersion.current) setLookupError(err.message);
    } finally {
      if (version === lookupVersion.current) setLoading(false);
    }
  }
  return (
    <ActionForm
      className=""
      feature="createReturn"
      label="Registrar devolução / troca"
      onSave={async (values) => {
        const body = {
          idFuncionario: employeeId(),
          idItemVenda: Number(values.idItemVenda),
          tipo: type,
          quantidade: Number(values.quantidade),
          motivo: values.motivo.trim(),
          reutilizavel: values.reutilizavel === "on",
          valorReembolso: Number(values.valorReembolso),
          idVendaTroca: type === "TROCA" ? Number(values.idVendaTroca) : null,
          dataDevolucao: values.dataDevolucao,
        };
        if (!body.motivo) throw new Error("Informe o motivo da devolução.");
        const result = await request("/devolucao", { method: "POST", body });
        setOrigin("");
        setItems([]);
        setType("DEVOLUCAO");
        onSaved("devolucao");
        return result?.mensagem || "Movimentação registrada.";
      }}
    >
      <div className="toolbar">
        <Field
          label="Venda de origem"
          name="saleLookup"
          type="number"
          min={1}
          step={1}
          value={origin}
          placeholder="ID da venda"
          onChange={(event) => {
            lookupVersion.current++;
            setOrigin(event.target.value);
            setItems([]);
            setLoading(false);
          }}
        />
        <button
          type="button"
          className="button secondary"
          disabled={loading}
          onClick={lookup}
        >
          Consultar itens
        </button>
      </div>
      <ErrorMessage message={lookupError} />
      <div className="form-grid" style={{ marginTop: 20 }}>
        <EmployeeField />
        <SelectField label="Item da venda" name="idItemVenda" required>
          <option value="">
            {items.length ? "Selecione o item vendido" : "Consulte uma venda"}
          </option>
          {items.map((r) => (
            <option key={r.id_item_venda} value={r.id_item_venda}>
              Item #{r.id_item_venda} · {r.nome_modelo} · {r.quantidade} un.
              vendidas
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Tipo"
          name="tipo"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option value="DEVOLUCAO">Devolução</option>
          <option value="TROCA">Troca</option>
        </SelectField>
        <Field label="Quantidade" name="quantidade" {...positive} />
        <Field
          label="Valor do reembolso (R$)"
          name="valorReembolso"
          {...moneyInput}
          defaultValue={0}
        />
        <Field
          label="Data da devolução"
          name="dataDevolucao"
          type="date"
          required
          defaultValue={today()}
        />
        {type === "TROCA" && (
          <Field
            label="ID da nova venda da troca"
            note="A nova venda deve existir antes do registro da troca."
            name="idVendaTroca"
            {...positive}
          />
        )}
        <Field label="Motivo" className="full">
          <textarea name="motivo" required maxLength={500} />
        </Field>
        <label className="check-field">
          <input name="reutilizavel" type="checkbox" />
          Itens em condições de retornar ao estoque
        </label>
      </div>
    </ActionForm>
  );
}
export function AdjustmentForm({ stock, onSaved }) {
  return (
    <ActionForm
      className=""
      feature="adjustStock"
      label="Registrar ajuste"
      onSave={async (values) => {
        const body = {
          idSku: Number(values.idSku),
          quantidade: Number(values.quantidade),
          motivo: values.motivo.trim(),
        };
        if (!Number.isInteger(body.quantidade) || body.quantidade === 0)
          throw new Error("Informe uma variação inteira diferente de zero.");
        if (!body.motivo) throw new Error("Informe o motivo do ajuste.");
        const result = await request("/ajuste", { method: "POST", body });
        onSaved("ajuste");
        return result?.mensagem || "Movimentação registrada.";
      }}
    >
      <div className="form-grid">
        <SelectField label="SKU" name="idSku" required>
          <SkuOptions stock={stock} />
        </SelectField>
        <Field
          label="Variação de quantidade"
          name="quantidade"
          type="number"
          required
          step={1}
        />
        <p className="muted full">
          Informe uma variação: 3 adiciona três unidades; −3 remove três
          unidades. O valor não é o saldo final.
        </p>
        <Field label="Motivo" className="full">
          <textarea name="motivo" required maxLength={500} />
        </Field>
      </div>
    </ActionForm>
  );
}
