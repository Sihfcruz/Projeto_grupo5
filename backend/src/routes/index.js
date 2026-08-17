const express = require('express')
const router = express.Router()


router.get('/', (req, res) => {
    res.json({
        mensagem: 'API Nômade funcionando',
        versao: '1.0.0',
        arquitetura: 'MVC + SOLID',
        recursos: [
            '/funcionarios',
            '/entrada',
            '/saida',
            '/produto',
            '/cargo',
            '/estoque',
            'devolucao',
        ]
    })
})

const ProdutoRoutes = require('./ProdutoRoutes');
const CargoRoutes = require('./CargoRoutes');
const FuncionarioRoutes = require('./FuncionarioRoutes');
const EstoqueRoutes = require('./EstoqueRoutes');
const EntradaRoutes = require('./EntradaRoutes');
const SaidaRoutes = require('./SaidaRoutes');
const DevolucaoRoutes = require('./DevolucaoRoutes');

router.use('/produto', ProdutoRoutes);
router.use('/cargo', CargoRoutes);
router.use('/funcionarios', FuncionarioRoutes);
router.use('/estoque', EstoqueRoutes);
router.use('/entrada', EntradaRoutes);
router.use('/saida', SaidaRoutes);
router.use('/devolucao', DevolucaoRoutes);

module.exports = router;