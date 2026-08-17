const express = require('express')
const router = express.Router()
const DevolucaoRoutes = require('./DevolucaoRoutes')
const EntradaRoutes = require('./EntradaRoutes')
const SaidaRoutes = require('./SaidaRoutes')
const ProdutoRoutes = require('./ProdutoRoutes');
// const CargoRoutes = require('./CargoRoutes');
const FuncionarioRoutes = require('./FuncionarioRoutes');
// const EstoqueRoutes = require('./EstoqueRoutes');




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

<<<<<<< HEAD
const ProdutoRoutes = require('./ProdutoRoutes');
const CargoRoutes = require('./CargoRoutes');
const FuncionarioRoutes = require('./FuncionarioRoutes');
const EstoqueRoutes = require('./EstoqueRoutes');
const EntradaRoutes = require('./EntradaRoutes');
const SaidaRoutes = require('./SaidaRoutes');
const DevolucaoRoutes = require('./DevolucaoRoutes')


=======



>>>>>>> ab8520b2b3d35622a92cc9969db9ed2a73ee5f8a
router.use('/produto', ProdutoRoutes);
// router.use('/cargo', CargoRoutes);
router.use('/funcionarios', FuncionarioRoutes);
// router.use('/estoque', EstoqueRoutes);
router.use('/entrada', EntradaRoutes);
router.use('/saida', SaidaRoutes);
router.use('/devolucao', DevolucaoRoutes);

module.exports = router;
