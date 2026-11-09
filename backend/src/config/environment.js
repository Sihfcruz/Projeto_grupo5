const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const config = {
    //Server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    nivelAdmin: 100,
    loglevel: process.env.LOG_LEVEL || 'info',

    //Database
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'nomade',
        port: process.env.DB_PORT || 3306
    },

    //CORS
    cors: {
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173').split(',').map((origin) => origin.trim()).filter(Boolean)
    },

    jwt: {
        secret: process.env.JWT_SECRET?.length >= 32 ? process.env.JWT_SECRET : process.env.JWT_SECRET_SECUNDARY,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        refreshExpiry: '7d',
        refreshExpiryDays: 7,
        expiry: process.env.JWT_EXPIRY || '15m'
    },

    //API
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production'
}

module.exports = config