const express = require('express');
const router = express.Router();
const FuncionarioController = require('../controllers/FuncionarioController');

router.get('/', FuncionarioController.listar);

router.get('/:id', (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(404).json({ sucesso: false, mensagem: 'Rota não encontrada.' });
  }
  next();
}, FuncionarioController.buscarPorId);

router.post('/', FuncionarioController.cadastrar);

router.put('/:id', FuncionarioController.atualizar);

router.delete('/:id', FuncionarioController.excluir);

module.exports = router;