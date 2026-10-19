const EstoqueService = require('./EstoqueService');

class EstoqueController {
    /** GET /estoque */
    async listar(req, res, next) {
        try {
            return res.status(200).json(await EstoqueService.listarEstoque());
        } catch (error) {
            next(error);
        }
    }

    /** GET /estoque/:id */
    async buscarPorId(req, res, next) {
        try {
            return res.status(200).json(await EstoqueService.buscarPorId(req.params.id));
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new EstoqueController();
