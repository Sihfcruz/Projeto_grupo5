const EntradaService = require('./EntradaService');

class EntradaController {
    async listar(req, res, next) {
        try {
            return res.status(200).json(await EntradaService.listarEntradas());
        } catch (error) {
            next(error);
        }
    }

    async buscarPorId(req, res, next) {
        try {
            return res.status(200).json(await EntradaService.listarEntradaPorId(req.params.id));
        } catch (error) {
            next(error);
        }
    }

    async cadastrar(req, res, next) {
        try {
            // O funcionário responsável é sempre o usuário logado
            const entrada = await EntradaService.criarEntrada({ ...(req.body || {}), idFuncionario: req.usuario.id });
            return res.status(201).json(entrada);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new EntradaController();
