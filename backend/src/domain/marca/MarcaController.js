const MarcaService = require('./MarcaService');
class MarcaController {
    async listar(req, res, next) { try { res.json(await MarcaService.listar()); } catch (err) { next(err); } }
    async cadastrar(req, res, next) { try { res.status(201).json({ id: await MarcaService.cadastrar(req.body.nome) }); } catch (err) { next(err); } }
}
module.exports = new MarcaController();