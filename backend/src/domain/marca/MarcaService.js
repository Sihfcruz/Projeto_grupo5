const MarcaRepository = require('./MarcaRepository');
class MarcaService {
    async listar() { return await MarcaRepository.listar(); }
    async cadastrar(nome) { if (!nome) throw new Error('Nome obrigatorio'); return await MarcaRepository.cadastrar(nome); }
}
module.exports = new MarcaService();