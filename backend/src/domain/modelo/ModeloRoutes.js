const { criarRotas } = require('../../shared/lib/crud')
const ModeloController = require('./ModeloController')

module.exports = criarRotas(ModeloController, require('./ModeloConfig').rotas || {})
