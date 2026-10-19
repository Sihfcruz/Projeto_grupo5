import { config } from "./config.js";
import { isDemo, getSession } from "./session.js";
import { request, asList, unwrap } from "./api.js";
import { demo } from "./demo.js";
export const money = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value) || 0,
  );
export const number = (value) =>
  new Intl.NumberFormat("pt-BR").format(Number(value) || 0);
export const date = (value) => {
  if (!value) return "—";
  const parsed = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value,
  );
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("pt-BR");
};
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export async function list(path) {
  if (isDemo()) return structuredClone(demo[path] || []);
  try {
    return asList(await request(path));
  } catch (error) {
    // Somente as respostas de vazio conhecidas; 404 de rota nunca vira lista vazia.
    if (
      error.status === 404 &&
      ((path === "/entrada" &&
        error.message === "Nenhuma entrada encontrada") ||
        (path === "/devolucao" &&
          error.message === "Nenhuma devolução encontrada"))
    )
      return [];
    throw error;
  }
}
export async function detail(path, id) {
  if (isDemo())
    return structuredClone(
      (demo[path] || []).find(
        (row) =>
          Number(
            row.id_sku ??
              row.id_venda ??
              row.idEntrada ??
              row.idDevolucao ??
              row.id_funcionario ??
              row.id_cargo,
          ) === Number(id),
      ),
    );
  return unwrap(await request(`${path}/${encodeURIComponent(id)}`));
}
export function exportCSV(filename, headers, rows) {
  // Neutraliza fórmulas antes de abrir o CSV em Excel/LibreOffice.
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv =
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(cell).join(";")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const enabled = (feature) =>
  !isDemo() && config.features[feature] === true;
export function employeeId() {
  if (isDemo()) return 1;
  const id = Number(getSession()?.funcionario?.id);
  if (!Number.isInteger(id) || id <= 0)
    throw new Error(
      "A sessão não possui um funcionário válido. Entre novamente.",
    );
  return id;
}
export function groupBrands(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const name = row.nome_marca || "Sem marca";
    const item = groups.get(name) || { skus: 0, units: 0, value: 0 };
    item.skus++;
    item.units += Number(row.saldo_estoque);
    item.value += Number(row.saldo_estoque) * Number(row.preco_venda);
    groups.set(name, item);
  });
  return [...groups].sort((a, b) => b[1].units - a[1].units);
}
export function saleData(items, stock, discount) {
  const lines = items.map((item) => ({
    idSku: Number(item.idSku),
    quantidade: Number(item.quantidade),
    descontoItem: Number(item.descontoItem),
  }));
  const subtotal = lines.reduce(
    (sum, item) =>
      sum +
      Math.round(
        Number(
          stock.find((row) => Number(row.id_sku) === item.idSku)?.preco_venda ||
            0,
        ) * 100,
      ) *
        item.quantidade -
      Math.round(item.descontoItem * 100),
    0,
  );
  return {
    itens: lines,
    totalCent: subtotal - Math.round(Number(discount) * 100),
  };
}
