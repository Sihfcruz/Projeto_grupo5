const v = require('../../shared/lib/validators')

module.exports = {
    entidade: 'Marca',
    tabela: 'marca',
    pk: 'id_marca',
    colunas: { idMarca: 'id_marca', nome: 'nome_marca' },
    gravaveis: ['nome'],
    schema: {
        nome: { obrigatorio: true, valida: v.texto('nome', { max: 60 }) }
    }
}
