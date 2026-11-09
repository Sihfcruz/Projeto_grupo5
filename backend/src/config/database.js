const mysql = require('mysql2/promise')
const config = require('./environment')
const logger = require('../shared/lib/logger')


const pool = mysql.createPool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    port: config.database.port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
})

module.exports = pool
