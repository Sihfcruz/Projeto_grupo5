const DevolucaoService = require("../services/DevolucaoService");

class DevolucaoController {

    async cadastrar(req, res) {
        try {
            const devolucao = await DevolucaoService.cadastrar(req.body);

            return res.status(201).json(devolucao);
        } catch (error) {
            return res.status(500).json({
                erro: error.message
            });
        }
    }

}

module.exports = new DevolucaoController();