const express = require('express');
const router = express.Router();
const VendaController = require('./VendaController');

router.get('/', VendaController.listarVendasPaginadas);
router.get('/:id', VendaController.buscarPorId);
router.post('/', VendaController.cadastrar);
router.patch('/:id/status', VendaController.atualizarStatus);

module.exports = router;
