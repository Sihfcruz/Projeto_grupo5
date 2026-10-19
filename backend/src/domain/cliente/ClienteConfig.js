const v = require('../../shared/lib/validators')

module.exports = {
    entidade: 'Cliente',
    tabela: 'cliente',
    pk: 'id_cliente',
    softDelete: true,
    colunas: {
        idCliente: 'id_cliente', nome: 'nome', tipoPessoa: 'tipo_pessoa', cpfCnpj: 'cpf_cnpj',
        email: 'email', telefone: 'telefone', cep: 'cep', logradouro: 'logradouro', numero: 'numero',
        complemento: 'complemento', bairro: 'bairro', cidade: 'cidade', uf: 'uf',
        idFuncionarioCadastro: 'id_funcionario_cadastro', ativo: 'ativo'
    },
    gravaveis: ['nome', 'tipoPessoa', 'cpfCnpj', 'email', 'telefone', 'cep', 'logradouro', 'numero',
        'complemento', 'bairro', 'cidade', 'uf', 'idFuncionarioCadastro'],
    schema: {
        nome: { obrigatorio: true, valida: v.texto('nome', { max: 100 }) },
        tipoPessoa: { valida: v.enumerado('tipoPessoa', ['PF', 'PJ']) },
        cpfCnpj: { obrigatorio: true, valida: v.apenasDigitos('cpfCnpj', [11, 14]) },
        email: { valida: v.emailValido('email', { opcional: true }) },
        telefone: { valida: v.textoOpcional('telefone', { max: 20 }) },
        cep: { valida: v.textoOpcional('cep', { max: 9 }) },
        logradouro: { valida: v.textoOpcional('logradouro', { max: 150 }) },
        numero: { valida: v.textoOpcional('numero', { max: 10 }) },
        complemento: { valida: v.textoOpcional('complemento', { max: 100 }) },
        bairro: { valida: v.textoOpcional('bairro', { max: 80 }) },
        cidade: { valida: v.textoOpcional('cidade', { max: 80 }) },
        uf: { valida: (valor) => v.texto('uf', { max: 2, min: 2 })(valor).toUpperCase() },
        idFuncionarioCadastro: { obrigatorio: true, somenteCriacao: true, valida: v.inteiroPositivo('idFuncionarioCadastro') }
    },
    controller: { injetaFuncionario: 'idFuncionarioCadastro' }
}
