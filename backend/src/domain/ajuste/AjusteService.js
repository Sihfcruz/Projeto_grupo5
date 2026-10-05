const AjusteRepository = require('./AjusteRepository');
class AjusteService {
    async ajustar(idSku, quantidade, motivo) {
        if (!idSku || !quantidade || !motivo) throw new Error('Dados invalidos');
        await AjusteRepository.registrar(idSku, quantidade, motivo);
        return { sucesso: true };
    }
}
module.exports = new AjusteService();