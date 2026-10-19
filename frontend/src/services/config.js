/** Configuração pública: nunca coloque senhas ou segredos neste arquivo. */
export const config = Object.freeze({
  apiUrl: "http://localhost:3000",
  timeoutMs: 12000,
  // Habilite individualmente APENAS depois de corrigir e testar o backend.
  features: Object.freeze({
    createEmployee: true,
    deactivateEmployee: true,
    editEmployee: false,
    createRole: false,
    editRole: false,
    deleteRole: true,
    createBrand: false,
    createModel: false,
    createEntry: false,
    createSale: false,
    createReturn: false,
    adjustStock: false,
  }),
});
