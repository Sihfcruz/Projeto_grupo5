const ModeloService = require('./ModeloService');
const ModeloRepository = require('./ModeloRepository');

jest.mock('./ModeloRepository', () => ({
    cadastrar: jest.fn(),
    listar: jest.fn()
}));

describe('ModeloService', () => {
    it('deve cadastrar modelo com sucesso', async () => {
        ModeloRepository.cadastrar.mockResolvedValue(1);
        const id = await ModeloService.cadastrar('Air Max', 1);
        expect(id).toBe(1);
    });
});