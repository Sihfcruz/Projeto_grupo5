const AjusteService = require('./AjusteService');

class AjusteController {
    async listar(req, res, next) {
        try { res.status(200).json(await AjusteService.listar()) } catch (err) { next(err) }
    }

    async ajustar(req, res, next) {
        try {
            const { idSku, quantidade, motivo } = req.body || {};
            const r = await AjusteService.ajustar(idSku, quantidade, motivo, req.usuario?.id ?? null);
            res.status(200).json(r);
        } catch (err) { next(err); }
    }
}
module.exports = new AjusteController();
