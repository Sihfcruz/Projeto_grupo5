# Contrato da API Nômade

Base local: http://localhost:3000. Rotas protegidas recebem Authorization: Bearer <accessToken>. Valores numéricos devem ser números JSON; datas de negócio usam AAAA-MM-DD.

## Autenticação (pública)

| Método | Rota | Corpo / resposta |
|---|---|---|
| POST | /auth/login | {email, senha} → {funcionario, accessToken, refreshToken} |
| POST | /auth/refresh-token | {refreshToken} → novo {accessToken, refreshToken} |
| POST | /auth/logout | {refreshToken} → 204 sem corpo |

## Cadastros

/cargo, /marca, /categoria, /modelo, /fornecedor, /cliente e /sku oferecem GET na coleção e em /:id, POST na coleção, PUT/PATCH em /:id e DELETE em /:id.

Respostas: {sucesso, dados, total?, mensagem?}. Criação retorna 201. Escrita de cargo exige admin; DELETE dos demais cadastros exige admin. Campos omitidos em PUT/PATCH são preservados.

| Recurso | Campos de criação (* obrigatório) | ID retornado |
|---|---|---|
| cargo | nome*, nivelAcesso* | idCargo |
| marca | nome* | idMarca |
| categoria | nome* | idCategoria |
| modelo | nome*, idMarca*, idCategoria*, descricao, idFornecedor, genero | idModelo |
| fornecedor | razaoSocial*, cnpj*, email, telefone | idFornecedor |
| cliente | nome*, cpfCnpj*, tipoPessoa, email, telefone, cep, logradouro, numero, complemento, bairro, cidade, uf | idCliente |
| sku | idModelo*, tamanho*, cor*, codigoBarras*, precoCusto*, precoVenda*, estoqueMinimo | idSku |

Modelo/cliente recebem idFuncionarioCadastro do token. Gênero: MASCULINO, FEMININO, UNISSEX ou INFANTIL. O saldo do SKU não pode ser alterado por cadastro.

## Funcionários (admin)

GET /funcionario, GET /:id, POST, PUT/PATCH /:id, DELETE /:id (desativação) e DELETE /:id/permanente (exclusão sujeita a vínculos).

POST recebe {nome, dataNascimento, senha, email, idCargo}. PUT/PATCH recebe os campos a alterar. Respostas de leitura usam id_funcionario, nome_completo, data_nascimento, id_cargo, email, ativo, sem senha. Idade mínima: 14; senha: mínimo 8 caracteres e máximo 72 bytes.

## Movimentações

O responsável é sempre extraído do token. Entrada/devolução oferecem GET na coleção e em /:id, além de POST. Vendas oferecem GET paginado, GET /:id, POST e PATCH /:id/status.

- POST /entrada: {idSku, quantidade, valorTotal, dataEntrada, lote, idFornecedor?, notaFiscal?}. Retorna camelCase, incluindo idEntrada. Lote único por SKU.
- POST /venda: {idCliente?, canal?, desconto?, codigoRastreamento?, observacao?, itens:[{idSku, quantidade, descontoItem?}], pagamentos?:[{forma, parcelas?, valor, status?}]}. Preços e total são calculados na API. Desconto do item é o desconto total da linha. Respostas usam campos SQL (id_venda, valor_total); detalhe inclui itens e pagamentos.
- GET /venda?limite=20&cursor=...: limite de 1 a 100, resposta {sucesso, dados, paginacao:{limite, temMais, proximoCursor}}. Use o cursor opaco retornado.
- PATCH /venda/:id/status: {status}. ABERTA → PAGA/CANCELADA; PAGA → ENVIADA/ENTREGUE/CANCELADA; ENVIADA → ENTREGUE. Cancelamento repõe saldo; venda com devoluções não pode ser cancelada.
- POST /devolucao: {idItemVenda, tipo, quantidade, motivo, reutilizavel, valorReembolso?, idVendaTroca?, dataDevolucao}. Tipo DEVOLUCAO ou TROCA; reutilizavel é booleano. TROCA exige uma nova venda existente. Retorna camelCase, incluindo idDevolucao.
- POST /ajuste (admin): {idSku, quantidade, motivo}. Quantidade inteira diferente de zero, positiva ou negativa; motivo até 255 caracteres.
- GET /estoque e /estoque/:id: visão consolidada com id_sku, nome_modelo, nome_marca, saldo_estoque, estoque_minimo, preco_venda, abaixo_do_minimo, ativo, tamanho, cor e código de barras.

Canal: LOJA/ONLINE. Pagamento: DINHEIRO, PIX, CARTAO_CREDITO, CARTAO_DEBITO, BOLETO ou VALE_TROCA. Parcelas de 1 a 24; parcelamento somente no crédito. Status do pagamento: PENDENTE, APROVADO, RECUSADO ou ESTORNADO. Pagamentos informados precisam somar o total da venda.

## Erros e documentação

Erros retornam {sucesso:false, erro, requestId?}: 400 validação, 401 sessão inválida, 403 permissão, 404 registro ausente, 409 conflito/saldo insuficiente e 429 limite de requisições.

GET / informa a API. GET /api-docs abre o Scalar e GET /api-docs/openapi.json retorna OpenAPI. As rotas antigas /produto e /saida não existem; use catálogo/SKU e /venda.
