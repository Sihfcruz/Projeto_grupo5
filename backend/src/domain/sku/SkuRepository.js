const { criarRepository } = require('../../shared/lib/crud')
const config = require('./SkuConfig')

const repo = criarRepository(config)

// Usado por Entrada (validar se o SKU existe)
repo.findById = (idSku) => repo.buscarPorId(idSku)

module.exports = repo
