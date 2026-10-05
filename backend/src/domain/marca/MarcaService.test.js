const MarcaService = require('./MarcaService');
const MarcaRepository = require('./MarcaRepository');

jest.mock('./MarcaRepository', () => ({
    cadastrar: jest.fn(),
    listar: jest.fn()
}));

describe('MarcaService', () => {
    it('deve cadastrar marca com sucesso', async () => {
        MarcaRepository.cadastrar.mockResolvedValue(1);
        const id = await MarcaService.cadastrar('Nike');
        expect(id).toBe(1);
    });
    it('deve falhar se nome for vazio', async () => {
        await expect(MarcaService.cadastrar('')).rejects.toThrow('Nome obrigatorio');
    });
});