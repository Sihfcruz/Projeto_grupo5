const VendaService = require('./VendaService');
const VendaRepository = require('./VendaRepository'); // Missing import previously?

class VendaController {
    async listarVendasPaginadas(req, res, next) {
        try {
            // Pegar limite e cursor da query string
            const limite = parseInt(req.query.limite) || 20;
            const cursor = req.query.cursor || null;

            let cursorDecodificado = null
            if (cursor) {
                // Em um cenário real, você decodificaria. Simples aqui:
                cursorDecodificado = cursor; 
            }

            const resultado = await VendaRepository.buscarVendasPaginadas({
                limite,
                cursor: cursorDecodificado
            })

            const proximoCursor = resultado.proximoCursorRaw
                ? resultado.proximoCursorRaw
                : null

            return res.status(200).json({
                sucesso: true,
                dados: resultado.dados,
                paginacao: {
                    limite: resultado.limite,
                    temMais: resultado.temMais,
                    proximoCursor
                }
            })
        } catch (error) {
            next(error)
        }
    }


    async buscarPorId(req, res, next) {
        try {
            const { id } = req.params;
            const saida = await VendaService.listarVendaPorId(id);

            return res.status(200).json(saida);
        } catch (error) {
            next(error)
        }
    }

    async cadastrar(req, res, next) {
        try {
            const saida = await VendaService.criarVenda(req.body);

            return res.status(201).json(saida);
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new VendaController();