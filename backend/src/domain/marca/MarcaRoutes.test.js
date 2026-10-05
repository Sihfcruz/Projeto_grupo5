const request = require('supertest');
const app = require('../../app');
const pool = require('../../config/database');

jest.mock('../../config/database', () => ({
    query: jest.fn(),
    getConnection: jest.fn()
}));

describe('Integração - Marca', () => {
    it('deve listar marcas na rota GET /marca', async () => {
        pool.query.mockResolvedValue([[{ id_marca: 1, nome: 'Nike' }]]);
        const response = await request(app).get('/marca');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ id_marca: 1, nome: 'Nike' }]);
    });

    it('deve cadastrar marca na rota POST /marca', async () => {
        pool.query.mockResolvedValue([{ insertId: 10 }]);
        const response = await request(app).post('/marca').send({ nome: 'Adidas' });
        expect(response.status).toBe(201);
        expect(response.body.id).toBe(10);
    });
});
