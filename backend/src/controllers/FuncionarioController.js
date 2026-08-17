const FuncionarioService = require("../services/FuncionarioService");

class FuncionarioController {

    async listar(req, res) {
        try {
            const funcionarios = await FuncionarioService.listar();

            return res.status(200).json(funcionarios);
        } catch (error) {
            return res.status(500).json({
                erro: error.message
            });
        }
    }

    async buscarPorId(req, res) {
        try {
            const { id } = req.params;

            const funcionario = await FuncionarioService.buscarPorId(id);

            return res.status(200).json(funcionario);
        } catch (error) {
            return res.status(500).json({
                erro: error.message
            });
        }
    }

    async cadastrar(req, res) {
        try {
            const funcionario = await FuncionarioService.cadastrar(req.body);

            return res.status(201).json(funcionario);
        } catch (error) {
            return res.status(500).json({
                erro: error.message
            });
        }
    }

    async atualizar(req, res) {
        try {
            const { id } = req.params;

            const funcionario = await FuncionarioService.atualizar(id, req.body);

            return res.status(200).json(funcionario);
        } catch (error) {
            return res.status(500).json({
                erro: error.message
            });
        }
    }

    async excluir(req, res) {
        try {
            const { id } = req.params;

            await FuncionarioService.excluir(id);

            return res.status(200).json({
                mensagem: "Funcionário desativado."
            });
        } catch (error) {
            return res.status(500).json({
                erro: error.message
            });
        }
    }

}

module.exports = new FuncionarioController();