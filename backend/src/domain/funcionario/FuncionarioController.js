const FuncionarioService = require('./FuncionarioService');

class FuncionarioController {
    async listarFuncionarios(req, res, next) {
        try { return res.status(200).json(await FuncionarioService.listarFuncionarios()); } catch (e) { next(e); }
    }

    async buscarPorId(req, res, next) {
        try { return res.status(200).json(await FuncionarioService.buscarFuncionarioPorId(req.params.id)); } catch (e) { next(e); }
    }

    async cadastrar(req, res, next) {
        try { return res.status(201).json(await FuncionarioService.cadastrarFuncionario(req.body || {})); } catch (e) { next(e); }
    }

    async atualizar(req, res, next) {
        try { return res.status(200).json(await FuncionarioService.atualizarFuncionario(req.params.id, req.body || {})); } catch (e) { next(e); }
    }

    async excluir(req, res, next) {
        try { return res.status(200).json(await FuncionarioService.deletarFuncionario(req.params.id)); } catch (e) { next(e); }
    }

    async excluirPermanentemente(req, res, next) {
        try { return res.status(200).json(await FuncionarioService.deletarFuncionarioPermanentemente(req.params.id)); } catch (e) { next(e); }
    }
}

module.exports = new FuncionarioController();
