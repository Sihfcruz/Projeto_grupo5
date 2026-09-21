const VendaService = require('./VendaService.js');

class SaidaController {

    async listar(req, res) {
        try {
            const saidas = await VendaService.listarVendas()

            return res.status(200).json(saidas);
        } catch (error) {
            return res.status(500).json({ erro: error.message });
        }
    }

    async buscarPorId(req, res) {
        try {
            const { id } = req.params;

            const saidas = await VendaService.listarVendaPorId(id)

            return res.status(200).json(saidas);
        } catch (error) {
            return res.status(500).json({
                erro: error.message
            });
        }
    }


    async cadastrar(req, res) {
        try {
            const saida = await VendaService.criarVenda(req.body)

            return res.status(201).json(saida);
        } catch (error) {
            return res.status(500).json({ erro: error.message });
        }
    }

}

module.exports = new SaidaController();