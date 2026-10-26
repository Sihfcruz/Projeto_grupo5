const { criarController } = require('../../shared/lib/crud')
const CargoService = require('./CargoService')

module.exports = criarController(CargoService, require('./CargoConfig').controller || {})
