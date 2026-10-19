const { criarController } = require('../../shared/lib/crud')
const MarcaService = require('./MarcaService')

module.exports = criarController(MarcaService, require('./MarcaConfig').controller || {})
