const request = require('supertest');
const app = require('../../app');
const pool = require('../../config/database');

jest.mock('../../config/database', () => {
    const mockConnection = {
        beginTransaction: jest.fn(),
        query: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
    };
    return {
        query: jest.fn(),
        getConnection: jest.fn().mockResolvedValue(mockConnection)
    };
});

describe('Integração - Ajuste Estoque', () => {
    it('deve registrar ajuste na rota POST /ajuste', async () => {
        const response = await request(app).post('/ajuste').send({ idSku: 1, quantidade: 10, motivo: 'Contagem manual' });
        expect(response.status).toBe(200);
        expect(response.body.sucesso).toBe(true);
    });
});
