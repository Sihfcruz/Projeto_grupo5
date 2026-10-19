const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const compression = require('compression')
const path = require('path')
const { apiReference } = require('@scalar/express-api-reference')

const config = require('./config/environment')
const AppError = require('./shared/errors/AppError')
const errorHandler = require('./shared/middlewares/errorHandler')
const requestIdMiddleware = require('./shared/middlewares/requestId')
const requestLogger = require('./shared/middlewares/requestLogger')
const { verificarToken } = require('./shared/middlewares/authMiddleware')

const AuthRoutes = require('./domain/auth/AuthRoutes')
const CargoRoutes = require('./domain/cargo/CargoRoutes')
const FuncionarioRoutes = require('./domain/funcionario/FuncionarioRoutes')
const MarcaRoutes = require('./domain/marca/MarcaRoutes')
const CategoriaRoutes = require('./domain/categoria/CategoriaRoutes')
const ModeloRoutes = require('./domain/modelo/ModeloRoutes')
const FornecedorRoutes = require('./domain/fornecedor/FornecedorRoutes')
const ClienteRoutes = require('./domain/cliente/ClienteRoutes')
const SkuRoutes = require('./domain/sku/SkuRoutes')
const AjusteRoutes = require('./domain/ajuste/AjusteRoutes')
const EntradaRoutes = require('./domain/entrada/EntradaRoutes')
const VendaRoutes = require('./domain/venda/VendaRoutes')
const DevolucaoRoutes = require('./domain/devolucao/DevolucaoRoutes')
const EstoqueRoutes = require('./domain/estoque/EstoqueRoutes')

const app = express()

// Necessário para o rate limit enxergar o IP real atrás de proxy (Render, Nginx, etc.)
if (config.isProduction) app.set('trust proxy', 1)

app.use(helmet())

// A tela do Scalar precisa de scripts inline
app.use((req, res, next) => {
    if (req.path === '/api-docs' || req.path.startsWith('/api-docs/')) {
        res.removeHeader('Content-Security-Policy')
    }
    next()
})

app.use(compression())
app.use(requestIdMiddleware)
app.use(requestLogger)

// Rate limit global (o login tem um limite próprio, mais rígido)
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.isProduction ? 1000 : 5000,
    message: { sucesso: false, erro: 'Muitas requisições, tente novamente mais tarde' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => config.nodeEnv === 'test'
}))

app.use(cors({
    origin: config.cors.allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
}))

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ limit: '1mb', extended: true }))

// Documentação (pública)
app.get('/api-docs/openapi.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'swagger-output.json'))
})
app.use('/api-docs', apiReference({ spec: { url: '/api-docs/openapi.json' } }))

// Rota informativa (pública)
app.get('/', (req, res) => {
    res.json({
        mensagem: 'API Nômade funcionando',
        versao: '1.0.0',
        documentacao: '/api-docs',
        recursos: [
            '/auth', '/cargo', '/funcionario', '/marca', '/categoria', '/modelo', '/fornecedor',
            '/cliente', '/sku', '/entrada', '/venda', '/devolucao', '/ajuste', '/estoque'
        ]
    })
})

// Rotas públicas
app.use('/auth', AuthRoutes)

// A partir daqui, tudo exige login (Bearer token)
app.use(verificarToken)

app.use('/cargo', CargoRoutes)
app.use('/funcionario', FuncionarioRoutes)
app.use('/marca', MarcaRoutes)
app.use('/categoria', CategoriaRoutes)
app.use('/modelo', ModeloRoutes)
app.use('/fornecedor', FornecedorRoutes)
app.use('/cliente', ClienteRoutes)
app.use('/sku', SkuRoutes)
app.use('/ajuste', AjusteRoutes)
app.use('/entrada', EntradaRoutes)
app.use('/venda', VendaRoutes)
app.use('/devolucao', DevolucaoRoutes)
app.use('/estoque', EstoqueRoutes)

// Rota inexistente
app.use((req, res, next) => next(new AppError('Rota não encontrada', 404)))

// Middleware de erro sempre por último
app.use(errorHandler)

module.exports = app
