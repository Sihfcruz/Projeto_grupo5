const express = require('express')
const router = express.Router()
const DevolucaoRoutes = require('./DevolucaoRoutes')
const EntradaRoutes = require('./EntradaRoutes')
const SaidaRoutes = require('./SaidaRoutes')



router.get('/', (req, res) => {
    res.json({
        mensagem: 'API Nômade funcionando',
        versao: '1.0.0',
        arquitetura: 'MVC + SOLID',
        recursos: [
            '/funcionarios',
            '/entrada',
            '/saida',
        ]
    })
})

router.use('/entradas', EntradaRoutes)
router.use('/devolucao', DevolucaoRoutes)
router.use('/saidas', SaidaRoutes)

module.exports = router