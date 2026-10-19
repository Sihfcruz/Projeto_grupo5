const v = require('../../shared/lib/validators')

module.exports = {
    entidade: 'Modelo',
    tabela: 'modelo',
    pk: 'id_modelo',
    softDelete: true,
    colunas: {
        idModelo: 'id_modelo', nome: 'nome_modelo', descricao: 'descricao',
        idMarca: 'id_marca', idCategoria: 'id_categoria', idFornecedor: 'id_fornecedor',
        genero: 'genero', idFuncionarioCadastro: 'id_funcionario_cadastro', ativo: 'ativo'
    },
    gravaveis: ['nome', 'descricao', 'idMarca', 'idCategoria', 'idFornecedor', 'genero', 'idFuncionarioCadastro'],
    schema: {
        nome: { obrigatorio: true, valida: v.texto('nome', { max: 100 }) },
        descricao: { valida: v.textoOpcional('descricao', { max: 200 }) },
        idMarca: { obrigatorio: true, valida: v.inteiroPositivo('idMarca') },
        idCategoria: { obrigatorio: true, valida: v.inteiroPositivo('idCategoria') },
        idFornecedor: { valida: v.inteiroPositivoOpcional('idFornecedor') },
        genero: { valida: v.enumerado('genero', ['MASCULINO', 'FEMININO', 'UNISSEX', 'INFANTIL']) },
        idFuncionarioCadastro: { obrigatorio: true, somenteCriacao: true, valida: v.inteiroPositivo('idFuncionarioCadastro') }
    },
    controller: { injetaFuncionario: 'idFuncionarioCadastro' }
}
