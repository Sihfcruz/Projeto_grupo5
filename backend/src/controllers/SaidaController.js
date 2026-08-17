const SaidaService = require("../services/SaidaService");

class SaidaController {

    async listar(req, res) {
        try {
            const saidas = await SaidaService.listar();

            return res.status(200).json(saidas);
        } catch (error) {
            return res.status(500).json({ erro: error.message });
        }
    }

    async cadastrar(req, res) {
        try {
            const saida = await SaidaService.cadastrar(req.body);

            return res.status(201).json(saida);
        } catch (error) {
            return res.status(500).json({ erro: error.message });
        }
    }

}

module.exports = new SaidaController();