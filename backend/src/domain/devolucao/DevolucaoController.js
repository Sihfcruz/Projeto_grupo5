const DevolucaoService = require('./DevolucaoService');

class DevolucaoController {
    async listar(req, res) {
        try {
            const resultado = await DevolucaoService.listarDevolucoes();
            return res.status(200).json(resultado);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({ erro: error.message });
        }
    }

    async buscarPorId(req, res) {
        try {
            const { id } = req.params;
            const resultado = await DevolucaoService.listarDevolucaoPorId(id);
            return res.status(200).json(resultado);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({ erro: error.message });
        }
    }

    async cadastrar(req, res) {
        try {
            // Corrigido de .cadastrar para .criarDevolucao
            const resultado = await DevolucaoService.criarDevolucao(req.body);
            return res.status(201).json(resultado);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({ erro: error.message });
        }
    }
}

module.exports = new DevolucaoController();