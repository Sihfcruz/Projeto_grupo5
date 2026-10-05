const express = require('express');
const router = express.Router();
const ModeloController = require('./ModeloController');
router.get('/', ModeloController.listar.bind(ModeloController));
router.post('/', ModeloController.cadastrar.bind(ModeloController));
module.exports = router;