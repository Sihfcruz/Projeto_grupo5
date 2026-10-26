const express = require('express');
const router = express.Router();
const AjusteController = require('./AjusteController');
const { verificarAdmin } = require('../../shared/middlewares/authMiddleware');

// Ajuste manual de estoque altera o saldo diretamente: somente administradores
router.post('/', verificarAdmin, AjusteController.ajustar);
module.exports = router;
