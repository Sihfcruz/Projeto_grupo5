require('dotenv').config()

const config = {
    //Sever
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
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
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173,http://localhost:5500').split(',')
    },

    jwt: {
        secret: process.env.JWT_SECRET || process.env.JWT_SECRET_SECUNDARY,
        expiry: process.env.JWT_EXPIRY || '15m',
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
        refreshExpiryDays: parseInt(process.env.JWT_REFRESH_EXPIRY_DAYS || '7', 10)
    },

    nivelAdmin: parseInt(process.env.NIVEL_ADMIN || '100', 10),

    //API
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production'
}

module.exports = config