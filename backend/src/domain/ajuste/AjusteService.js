const AjusteRepository = require('./AjusteRepository');
const AppError = require('../../shared/errors/AppError');

class AjusteService {
    // quantidade: positiva (acrescenta) ou negativa (retira). Nunca zero.
    async ajustar(idSku, quantidade, motivo, idFuncionario = null) {
        if (!Number.isInteger(idSku) || idSku <= 0) throw new AppError("O campo 'idSku' deve ser um inteiro positivo.");
        if (!Number.isInteger(quantidade) || quantidade === 0) throw new AppError("O campo 'quantidade' deve ser um inteiro diferente de zero.");
        if (typeof motivo !== 'string' || !motivo.trim() || motivo.trim().length > 255) {
            throw new AppError("O campo 'motivo' é obrigatório e deve ter até 255 caracteres.");
        }

        try {
            await AjusteRepository.registrar(idSku, quantidade, motivo.trim(), idFuncionario);
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') throw new AppError('O ajuste deixaria o estoque negativo.', 409);
            if (error.code === 'ER_NO_REFERENCED_ROW_2') throw new AppError('SKU não encontrado.', 404);
            throw error;
        }
        return { sucesso: true };
    }
}
module.exports = new AjusteService();
