const EstoqueService = require('./EstoqueService');

class EstoqueController {
    /**
     * GET /estoque
     */
    async listar(req, res) {
        try {
            const resultado = await EstoqueService.listarEstoque();
            return res.status(200).json(resultado);
        } catch (error) {
            return EstoqueController.tratarErro(res, error);
        }
    }

    /**
     * GET /estoque/:id
     */
    async buscarPorId(req, res) {
        try {
            const { id } = req.params;
            const resultado = await EstoqueService.buscarPorId(id);
            return res.status(200).json(resultado);
        } catch (error) {
            return EstoqueController.tratarErro(res, error);
        }
    }

    /**
     * Tratador global de exceções da camada de apresentação.
     * Previne o vazamento de stack traces de infraestrutura (500) para o cliente.
     */
    static tratarErro(res, error) {
        const isAppError = Boolean(error.statusCode);
        const statusCode = isAppError ? error.statusCode : 500;
        const mensagem = isAppError ? error.message : "Erro interno no servidor ao processar o estoque.";

        if (!isAppError) {
            // Em produção, registra o erro real no logger estruturado (ex: Pino/Winston/Datadog)
            console.error('[CRITICAL DATABASE/SERVER ERROR]:', error);
        }

        return res.status(statusCode).json({
            sucesso: false,
            erro: mensagem
        });
    }
}

module.exports = new EstoqueController();