const AjusteService = require('./AjusteService');
class AjusteController {
    async ajustar(req, res, next) {
        try {
            const r = await AjusteService.ajustar(req.body.idSku, req.body.quantidade, req.body.motivo);
            res.status(200).json(r);
        } catch (err) { next(err); }
    }
}
module.exports = new AjusteController();