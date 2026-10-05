const AjusteService = require('./AjusteService');
const AjusteRepository = require('./AjusteRepository');

jest.mock('./AjusteRepository', () => ({
    registrar: jest.fn()
}));

describe('AjusteService', () => {
    it('deve registrar ajuste com sucesso', async () => {
        AjusteRepository.registrar.mockResolvedValue();
        const r = await AjusteService.ajustar(1, 10, 'Contagem manual');
        expect(r.sucesso).toBe(true);
    });
});