const pool = require('../../config/database');
class MarcaRepository {
    async listar() { const [rows] = await pool.query('SELECT * FROM marca'); return rows; }
    async cadastrar(nome) { const [result] = await pool.query('INSERT INTO marca (nome) VALUES (?)', [nome]); return result.insertId; }
}
module.exports = new MarcaRepository();