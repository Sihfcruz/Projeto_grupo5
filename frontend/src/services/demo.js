/** Dados fictícios exclusivos da demonstração; nunca substituem uma falha de API. */
const now = new Date();
const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const stock = [
  [101, "Air Max 90", "Nike", 40, "Preto", 24, 6, 699.9],
  [102, "Air Max 90", "Nike", 42, "Branco", 4, 6, 699.9],
  [103, "Old Skool", "Vans", 39, "Preto", 18, 5, 399.9],
  [104, "Runner", "Adidas", 41, "Cinza", 0, 4, 549.9],
  [105, "Classic", "Converse", 38, "Branco", 12, 4, 299.9],
  [106, "Runner", "Adidas", 40, "Azul", 32, 5, 549.9],
].map(
  ([
    id_sku,
    nome_modelo,
    nome_marca,
    tamanho,
    cor,
    saldo_estoque,
    estoque_minimo,
    preco_venda,
  ]) => ({
    id_sku,
    nome_modelo,
    nome_marca,
    tamanho,
    cor,
    saldo_estoque,
    estoque_minimo,
    preco_venda,
    codigo_barras: `7890000000${id_sku}`,
    abaixo_do_minimo: saldo_estoque <= estoque_minimo,
    ativo: true,
  }),
);
export const demo = {
  "/estoque": stock,
  "/marca": [
    { id_marca: 1, nome_marca: "Nike" },
    { id_marca: 2, nome_marca: "Adidas" },
    { id_marca: 3, nome_marca: "Vans" },
    { id_marca: 4, nome_marca: "Converse" },
  ],
  "/modelo": [
    {
      id_modelo: 1,
      nome_modelo: "Air Max 90",
      id_marca: 1,
      genero: "UNISSEX",
      ativo: 1,
    },
    {
      id_modelo: 2,
      nome_modelo: "Runner",
      id_marca: 2,
      genero: "UNISSEX",
      ativo: 1,
    },
  ],
  "/cargo": [
    { id_cargo: 1, nome_cargo: "Administrador", nivel_acesso: 2 },
    { id_cargo: 2, nome_cargo: "Vendedor", nivel_acesso: 1 },
  ],
  "/funcionario": [
    {
      id_funcionario: 1,
      nome_completo: "Ana Martins",
      email: "ana@example.com",
      id_cargo: 1,
      ativo: 1,
    },
    {
      id_funcionario: 2,
      nome_completo: "Carlos Silva",
      email: "carlos@example.com",
      id_cargo: 2,
      ativo: 1,
    },
  ],
  "/entrada": [
    {
      idEntrada: 3,
      idSku: 101,
      quantidade: 12,
      valorTotal: 4200,
      dataEntrada: day,
      lote: "DEMO-03",
      idFuncionario: 1,
    },
  ],
  "/venda": [
    {
      id_venda: 8,
      data_venda: day,
      valor_total: 699.9,
      status: "PAGA",
      canal: "LOJA",
      id_funcionario: 2,
      itens: [
        {
          id_item_venda: 11,
          id_sku: 101,
          nome_modelo: "Air Max 90",
          quantidade: 1,
          preco_unitario: 699.9,
          desconto_item: 0,
        },
      ],
      pagamentos: [{ forma: "PIX", valor: 699.9, status: "APROVADO" }],
    },
  ],
  "/devolucao": [],
};
