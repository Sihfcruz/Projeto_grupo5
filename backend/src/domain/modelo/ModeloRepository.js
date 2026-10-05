const pool = require('../../config/database');
class ModeloRepository {
    async listar() { const [rows] = await pool.query('SELECT * FROM modelo'); return rows; }
    async cadastrar(nome, idMarca) { const [result] = await pool.query('INSERT INTO modelo (nome, id_marca) VALUES (?, ?)', [nome, idMarca]); return result.insertId; }
}
module.exports = new ModeloRepository();