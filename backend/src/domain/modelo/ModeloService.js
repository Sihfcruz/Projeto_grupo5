const ModeloRepository = require('./ModeloRepository');
class ModeloService {
    async listar() { return await ModeloRepository.listar(); }
    async cadastrar(nome, idMarca) { if (!nome || !idMarca) throw new Error('Dados invalidos'); return await ModeloRepository.cadastrar(nome, idMarca); }
}
module.exports = new ModeloService();