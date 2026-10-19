import { createContext, useContext, useEffect, useRef, useState } from "react";
import { enabled, groupBrands, number } from "../services/data.js";
import { isDemo } from "../services/session.js";

const ToastContext = createContext(() => {});
export function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [message]);
  return (
    <ToastContext.Provider value={setMessage}>
      {children}
      <div id="toast" role="status" aria-live="polite" hidden={!message}>
        {message}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
export function Heading({ eyebrow, title, subtitle, children }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function ErrorMessage({ message }) {
  return message ? (
    <p className="error" role="alert">
      {message}
    </p>
  ) : null;
}
export function Panel({ title, subtitle, actions, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
export function Table({
  headers,
  loading,
  error,
  empty = "Nenhum registro encontrado.",
  children,
}) {
  const rows = Array.isArray(children) ? children : children ? [children] : [];
  return (
    <div
      className="table-wrap"
      tabIndex={0}
      role="region"
      aria-label="Tabela de registros"
    >
      <table>
        <thead>
          <tr>
            {headers.map((label) => (
              <th scope="col" key={label}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading || error || !rows.length ? (
            <tr>
              <td className="empty" colSpan={headers.length}>
                {loading
                  ? "Carregando…"
                  : error
                    ? "Dados indisponíveis. Atualize para tentar novamente."
                    : empty}
              </td>
            </tr>
          ) : (
            rows
          )}
        </tbody>
      </table>
    </div>
  );
}
export function Badge({ children, kind = "" }) {
  return <span className={`badge ${kind}`}>{children}</span>;
}
export function StockStatus({ row }) {
  if (Number(row.saldo_estoque) === 0)
    return <Badge kind="danger">Sem estoque</Badge>;
  return Number(row.saldo_estoque) <= Number(row.estoque_minimo) ? (
    <Badge kind="warning">Estoque baixo</Badge>
  ) : (
    <Badge kind="success">Disponível</Badge>
  );
}
export function Stats({ items }) {
  return (
    <section className="stats" aria-label="Resumo">
      {items.map(([label, value, note, style], index) => (
        <article className={`stat ${style || ""}`} key={label}>
          <span>{label}</span>
          <strong id={`stat-${index}`}>{value}</strong>
          <small>{note}</small>
        </article>
      ))}
    </section>
  );
}
export function BrandBars({ rows, loading, error }) {
  const groups = groupBrands(rows);
  const max = Math.max(1, ...groups.map(([, item]) => item.units));
  return (
    <div className="panel-body bars">
      {loading ? (
        <p className="muted">Carregando…</p>
      ) : error ? (
        <p className="muted">Dados indisponíveis.</p>
      ) : !groups.length ? (
        <p className="muted">Nenhum SKU disponível.</p>
      ) : (
        groups.map(([name, item]) => (
          <div className="bar-row" key={name}>
            <span>{name}</span>
            <div className="bar-track" aria-hidden="true">
              <div
                className="bar-fill"
                style={{ width: `${(Math.max(0, item.units) / max) * 100}%` }}
              />
            </div>
            <strong>{number(item.units)}</strong>
          </div>
        ))
      )}
    </div>
  );
}
export function Field({ label, note, children, className = "", ...props }) {
  return (
    <label className={`field ${className}`}>
      {label}
      {children || <input {...props} />}
      {note && <small>{note}</small>}
    </label>
  );
}
export function SelectField({ label, children, className = "", ...props }) {
  return (
    <Field label={label} className={className}>
      <select {...props}>{children}</select>
    </Field>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);
  return (
    <dialog ref={ref} aria-labelledby="dialog-title" onCancel={onClose}>
      <div className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Fechar detalhes"
          type="button"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
export function Details({ fields }) {
  return (
    <dl className="detail-grid">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
export function ActionForm({
  feature,
  onSave,
  label,
  children,
  className = "panel-body",
  reset = true,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const toast = useToast();
  const available = enabled(feature);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!available || pending.current || !form.reportValidity()) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await onSave(Object.fromEntries(new FormData(form)));
      if (reset) form.reset();
      toast(result || "Operação concluída.");
    } catch (err) {
      setError(err.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <form className={className} onSubmit={submit}>
      {!available && (
        <p className="notice">
          {isDemo()
            ? "Demonstração somente para consulta. Entre com sua conta para usar as operações disponíveis."
            : "Esta operação está temporariamente indisponível."}
        </p>
      )}
      <ErrorMessage message={error} />
      {children}
      <div className="form-actions">
        <button className="button" type="submit" disabled={!available || busy}>
          {busy ? "Salvando…" : label}
        </button>
      </div>
    </form>
  );
}
