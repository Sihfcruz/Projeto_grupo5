/** Configuração pública: nunca coloque senhas ou segredos neste arquivo. */
export const config = Object.freeze({
  apiUrl: "http://localhost:3000",
  timeoutMs: 12000,
  // Habilite individualmente APENAS depois de corrigir e testar o backend.
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
