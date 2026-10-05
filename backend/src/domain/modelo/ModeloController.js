const ModeloService = require('./ModeloService');
class ModeloController {
    async listar(req, res, next) { try { res.json(await ModeloService.listar()); } catch (err) { next(err); } }
    async cadastrar(req, res, next) { try { res.status(201).json({ id: await ModeloService.cadastrar(req.body.nome, req.body.idMarca) }); } catch (err) { next(err); } }
}
module.exports = new ModeloController();