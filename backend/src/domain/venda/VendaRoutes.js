const express = require('express');
const router = express.Router();
const VendaController = require('./VendaController');

// Listar todas as saídas
router.get('/', VendaController.listar);

// Buscar saída por ID
router.get('/:id', VendaController.buscarPorId);

// Cadastrar nova saída
router.post('/', VendaController.cadastrar);

module.exports = router;
