const DevolucaoService = require('./DevolucaoService');

class DevolucaoController {
    async listar(req, res, next) {
        try {
            return res.status(200).json(await DevolucaoService.listarDevolucoes());
        } catch (error) {
            next(error);
        }
    }

    async buscarPorId(req, res, next) {
        try {
            return res.status(200).json(await DevolucaoService.listarDevolucaoPorId(req.params.id));
        } catch (error) {
            next(error);
        }
    }

    async cadastrar(req, res, next) {
        try {
            // O funcionário responsável é sempre o usuário logado
            const resultado = await DevolucaoService.criarDevolucao({ ...(req.body || {}), idFuncionario: req.usuario.id });
            return res.status(201).json(resultado);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DevolucaoController();
