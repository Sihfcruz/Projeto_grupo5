const ProdutoService = require("../services/ProdutoService");

class ProdutoController {

    async listar(req, res) {
        try {
            const produtos = await ProdutoService.listar(req.query);

            return res.status(200).json(produtos);
        } catch (error) {
            return res.status(500).json({
                erro: error.message
            });
        }
    }

    async buscarPorId(req, res) {
        try {
            const { id } = req.params;

            const produto = await ProdutoService.buscarPorId(id);

            return res.status(200).json(produto);
        } catch (error) {
            return res.status(500).json({
                erro: error.message
            });
        }
    }

    async cadastrar(req, res) {
        try {
            const produto = await ProdutoService.cadastrar(req.body);

            return res.status(201).json(produto);
        } catch (error) {
            return res.status(500).json({
                erro: error.message
            });
        }
    }

    async atualizar(req, res) {
        try {
            const { id } = req.params;

            const produto = await ProdutoService.atualizar(id, req.body);

            return res.status(200).json(produto);
        } catch (error) {
            return res.status(500).json({
                erro: error.message
            });
        }
    }

    async excluir(req, res) {
        try {
            const { id } = req.params;

            await ProdutoService.excluir(id);

            return res.status(200).json({
                mensagem: "Produto removido com sucesso."
            });
        } catch (error) {
            return res.status(500).json({
                erro: error.message
            });
        }
    }

}

module.exports = new ProdutoController();