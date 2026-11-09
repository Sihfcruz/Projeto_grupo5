jest.mock('../../config/database', () => ({ getConnection: jest.fn() }))
const pool = require('../../config/database')
const Repo = require('./DevolucaoRepository')

const dados = (extra = {}) => ({
  id_funcionario: 7, id_item_venda: 1, tipo: 'DEVOLUCAO', quantidade: 1, motivo: 'Teste',
  reutilizavel: true, valor_reembolso: 40, id_venda_troca: null, data_devolucao: '2026-01-15', ...extra
})
let connection
beforeEach(() => {
  connection = { beginTransaction: jest.fn(), query: jest.fn(), execute: jest.fn(),
    commit: jest.fn(), rollback: jest.fn(), release: jest.fn() }
  pool.getConnection.mockResolvedValue(connection)
  connection.query.mockResolvedValueOnce([[{
    id_item_venda: 1, id_sku: 2, id_venda: 3, quantidade: 2, preco_unitario: '100.00',
    desconto_item: '40.00', desconto: '80.00', valor_total: '80.00', status: 'PAGA'
  }]]).mockResolvedValueOnce([[{ jaDevolvido: 0 }]])
  connection.execute.mockResolvedValue([{ insertId: 8 }])
})
test('reembolso considera descontos do item e da venda', async () => {
  await expect(Repo.cadastrarDevolucao(dados({ valor_reembolso: 40.01 }))).rejects.toMatchObject({ statusCode: 400 })
  expect(connection.rollback).toHaveBeenCalled()
  expect(connection.execute).not.toHaveBeenCalled()
  expect(connection.release).toHaveBeenCalled()
})
test('devolução reutilizável confirma registro e reposição na mesma transação', async () => {
  await expect(Repo.cadastrarDevolucao(dados())).resolves.toBe(8)
  expect(connection.query).toHaveBeenLastCalledWith(expect.stringContaining('UPDATE sku'), [1, 2])
  expect(connection.commit).toHaveBeenCalled()
  expect(connection.rollback).not.toHaveBeenCalled()
})
test('troca não pode referenciar a própria venda', async () => {
  await expect(Repo.cadastrarDevolucao(dados({ tipo: 'TROCA', id_venda_troca: 3 }))).rejects.toMatchObject({ statusCode: 400 })
  expect(connection.rollback).toHaveBeenCalled()
})
