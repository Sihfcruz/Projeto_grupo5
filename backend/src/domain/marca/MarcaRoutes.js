const express = require('express');
const router = express.Router();
const MarcaController = require('./MarcaController');
router.get('/', MarcaController.listar.bind(MarcaController));
router.post('/', MarcaController.cadastrar.bind(MarcaController));
module.exports = router;