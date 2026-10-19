const { criarRotas } = require('../../shared/lib/crud')
const MarcaController = require('./MarcaController')

module.exports = criarRotas(MarcaController, require('./MarcaConfig').rotas || {})
