const v = require('../../shared/lib/validators')

module.exports = {
    entidade: 'Fornecedor',
    tabela: 'fornecedor',
    pk: 'id_fornecedor',
    softDelete: true,
    colunas: {
        idFornecedor: 'id_fornecedor', razaoSocial: 'razao_social', cnpj: 'cnpj',
        email: 'email', telefone: 'telefone', ativo: 'ativo'
    },
    gravaveis: ['razaoSocial', 'cnpj', 'email', 'telefone'],
    schema: {
        razaoSocial: { obrigatorio: true, valida: v.texto('razaoSocial', { max: 100 }) },
        cnpj: { obrigatorio: true, valida: v.apenasDigitos('cnpj', [14]) },
        email: { valida: v.emailValido('email', { opcional: true }) },
        telefone: { valida: v.textoOpcional('telefone', { max: 20 }) }
    }
}
