const v = require('../../shared/lib/validators')

module.exports = {
    entidade: 'Cargo',
    tabela: 'cargo',
    pk: 'id_cargo',
    colunas: { idCargo: 'id_cargo', nome: 'nome_cargo', nivelAcesso: 'nivel_acesso' },
    gravaveis: ['nome', 'nivelAcesso'],
    schema: {
        nome: { obrigatorio: true, valida: v.texto('nome', { max: 100 }) },
        nivelAcesso: { obrigatorio: true, valida: v.inteiroMin('nivelAcesso', 0) }
    },
    // Cargos só são gerenciados por administradores
    rotas: { adminEscrita: true }
}
