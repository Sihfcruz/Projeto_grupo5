const VendaService = require('./VendaService');

class VendaController {
    async listarVendasPaginadas({ limite = 20, cursor = null }) {
        let cursorDecodificado = null

        if (cursor) {
            cursorDecodificado = decodificarCursor(cursor)
        }

        const resultado = await VendaRepository.buscarVendasPaginadas({
            limite,
            cursor: cursorDecodificado
        })

        const proximoCursor = resultado.proximoCursorRaw
            ? codificarCursor(resultado.proximoCursorRaw)
            : null

        return {
            sucesso: true,
            dados: resultado.dados,
            paginacao: {
                limite: resultado.limite,
                temMais: resultado.temMais,
                proximoCursor
            }
        }
    }


    async buscarPorId(req, res) {
        try {
            const { id } = req.params;
            const saida = await VendaService.listarVendaPorId(id);

            return res.status(200).json(saida);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({ erro: error.message });
        }
    }

    async cadastrar(req, res) {
        try {
            const saida = await VendaService.criarVenda(req.body);

            return res.status(201).json(saida);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({ erro: error.message });
        }
    }
}

module.exports = new VendaController();