const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const rateLimit = require('express-rate-limit')
const compression = require('compression')

const app = express()
routes = require('./routes')
const errorHandler = require('./middlewares/errorHandler')
const requestIdMiddleware = require('./middlewares/requestId')
const requestLogger = require('./middlewares/requestLogger')

// Helmet - headers de segurança HTTP (configurado para permitir imagens)
app.use(helmet())

app.use(compression())

//Request ID único
app.use(requestIdMiddleware)

// Logging ID único
app.use(requestLogger)

//Rate limiting global
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutos
    max: 100, //máximo de 100 requisições por janela
    message: 'Muitas requisições, tente novamente mais tarde',
    standardHeaders: true,
    legacyHeaders: false
})
app.use(limiter)

const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-request-Id']
}
app.use(cors(corsOptions))


// parsers
app.use(express.json({ limit: '10mb'}))
app.use(express.urlencoded({ limit: '10mb', extend: true}))

//Rotas
app.use('/', routes)

//ERROR handling
//middleware de rro por ultimo
app.use(errorHandler)

module.exports = app

