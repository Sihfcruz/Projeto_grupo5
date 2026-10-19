const v = require('../../shared/lib/validators')

module.exports = {
    entidade: 'Categoria',
    tabela: 'categoria',
    pk: 'id_categoria',
    colunas: { idCategoria: 'id_categoria', nome: 'nome_categoria' },
    gravaveis: ['nome'],
    schema: {
        nome: { obrigatorio: true, valida: v.texto('nome', { max: 60 }) }
    }
}
