const express = require('express');
const router = express.Router();
const FuncionarioController = require('./FuncionarioController');
const { verificarAdmin } = require('../../shared/middlewares/authMiddleware');

// Dados de funcionários: somente administradores
router.use(verificarAdmin);

router.get('/', FuncionarioController.listarFuncionarios);
router.get('/:id', FuncionarioController.buscarPorId);
router.post('/', FuncionarioController.cadastrar);
router.put('/:id', FuncionarioController.atualizar);
router.patch('/:id', FuncionarioController.atualizar);

// Desativar (soft delete)
router.delete('/:id', FuncionarioController.excluir);

// Excluir de vez (hard delete)
router.delete('/:id/permanente', FuncionarioController.excluirPermanentemente);

module.exports = router;
