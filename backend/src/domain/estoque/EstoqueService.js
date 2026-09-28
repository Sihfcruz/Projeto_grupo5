const EstoqueRepository = require('./EstoqueRepository');

/**
 * Exceção customizada da aplicação para controle de fluxo HTTP.
 */
class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

class EstoqueService {
    /**
     * Processa e retorna o estoque geral da loja.
     * @returns {Promise<{sucesso: boolean, total: number, dados: Array}>}
     */
    async listarEstoque() {
        const estoque = await EstoqueRepository.listarTodos();

        // O driver MySQL retorna a coluna bit/tinyint(1) como 1 ou 0.
        // Normalizamos para o tipo primitivo boolean do JavaScript.
        const dadosFormatados = estoque.map(item => ({
            ...item,
            abaixo_do_minimo: Boolean(item.abaixo_do_minimo),
            ativo: Boolean(item.ativo)
        }));

        return {
            sucesso: true,
            total: dadosFormatados.length,
            dados: dadosFormatados
        };
    }

    /**
     * Busca o saldo e informações detalhadas de um SKU específico.
     * @param {string|number} id 
     * @returns {Promise<{sucesso: boolean, dados: Object}>}
     */
    async buscarPorId(id) {
        const idSku = Number(id);

        // Fail-Fast: Validação estrita de tipo na entrada do Service
        if (!id || Number.isNaN(idSku) || idSku <= 0) {
            throw new AppError("O identificador (ID) do SKU informado é inválido.", 400);
        }

        const item = await EstoqueRepository.buscarPorSkuId(idSku);

        if (!item) {
            throw new AppError("Item de estoque não encontrado para o SKU informado.", 404);
        }

        return {
            sucesso: true,
            dados: {
                ...item,
                abaixo_do_minimo: Boolean(item.abaixo_do_minimo),
                ativo: Boolean(item.ativo)
            }
        };
    }
}

module.exports = new EstoqueService();