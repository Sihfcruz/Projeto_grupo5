const { criarRotas } = require('../../shared/lib/crud')
const CargoController = require('./CargoController')

module.exports = criarRotas(CargoController, require('./CargoConfig').rotas || {})
