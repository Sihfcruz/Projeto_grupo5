const VendaService = require('./VendaService');

class VendaController {
    async listarVendasPaginadas(req, res, next) {
        try {
            const limite = parseInt(req.query.limite, 10) || 20;
            const cursor = req.query.cursor || null;
            return res.status(200).json(await VendaService.listarVendasPaginadas({ limite, cursor }));
        } catch (error) {
            next(error);
        }
    }

    async buscarPorId(req, res, next) {
        try {
            return res.status(200).json(await VendaService.listarVendaPorId(req.params.id));
        } catch (error) {
            next(error);
        }
    }

    async cadastrar(req, res, next) {
        try {
            // O vendedor é sempre o usuário logado
            const venda = await VendaService.criarVenda({ ...(req.body || {}), idFuncionario: req.usuario.id });
            return res.status(201).json(venda);
        } catch (error) {
            next(error);
        }
    }

    async atualizarStatus(req, res, next) {
        try {
            return res.status(200).json(await VendaService.atualizarStatus(req.params.id, (req.body || {}).status));
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new VendaController();
