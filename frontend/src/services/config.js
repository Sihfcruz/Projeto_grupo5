/** Configuração pública: nunca coloque senhas ou segredos neste arquivo. */
export const config = Object.freeze({
  apiUrl: import.meta.env?.VITE_API_URL?.trim() || "http://localhost:3000",
  timeoutMs: 12000,
  // Operações implementadas pela API; permissões administrativas são verificadas no servidor.
  features: Object.freeze({
    createEmployee: true,
    deactivateEmployee: true,
    editEmployee: true,
    createRole: true,
    editRole: true,
    deleteRole: true,
    createBrand: true,
    createModel: true,
    createEntry: true,
    createSale: true,
    createReturn: true,
    adjustStock: true,
  }),
});
