const request = require('supertest');
const app = require('../../app');
const pool = require('../../config/database');

jest.mock('../../config/database', () => ({
    query: jest.fn(),
    getConnection: jest.fn()
}));

describe('Integração - Modelo', () => {
    it('deve listar modelos na rota GET /modelo', async () => {
        pool.query.mockResolvedValue([[{ id_modelo: 1, nome: 'Air Max', id_marca: 1 }]]);
        const response = await request(app).get('/modelo');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ id_modelo: 1, nome: 'Air Max', id_marca: 1 }]);
    });
});
