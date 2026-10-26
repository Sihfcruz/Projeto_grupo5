const { criarController } = require('../../shared/lib/crud')
const ModeloService = require('./ModeloService')

module.exports = criarController(ModeloService, require('./ModeloConfig').controller || {})
