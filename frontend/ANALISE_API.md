# Análise do backend e contratos — Nômade

A análise abaixo corresponde ao backend enviado, que permanece sem alterações. A conversão para React preserva esses contratos e as mesmas operações bloqueadas. As instruções de execução e a validação da versão React estão em `README.md`.

## Análise do backend

### Estrutura e fluxo

O backend é Node.js/CommonJS com Express e MySQL (`mysql2/promise`). A organização principal é **rotas → controllers → services → repositories → banco**. Os services concentram validações, os repositories fazem consultas parametrizadas, e os controllers formam a resposta HTTP.

`server.js` carrega ambiente, aplicação e pool, verifica uma chave JWT e tenta conectar ao banco antes de escutar a porta. `app.js` registra Helmet, compressão, identificador de requisição, logging, limitação global de 100 requisições por 15 minutos, CORS, parsers, rotas e tratamento final de erro.

Existem pontos positivos no desenho: senha com bcrypt, consultas parametrizadas, exclusão lógica de funcionários e transações em vendas/devoluções. O service de vendas calcula preços no servidor e usa centavos para descontos/pagamentos. A transação de venda bloqueia SKUs com `FOR UPDATE`. **Isso não resolve sozinho o saldo:** a rotina enviada não valida/decrementa `quantidade_estoque`, dependendo de triggers que não estão implementados no SQL fornecido.

### Bloqueios encontrados no código enviado

As referências abaixo identificam arquivos do projeto original; eles não acompanham esta entrega.

| Prioridade | Evidência no código                                                                                                                                                                                                                                                          | Consequência                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Crítica    | `src/domain/entrada/EntradasRepository.js` e `src/domain/sku/SkuRepository.js` usam `require('../config/database')`. Esse destino não existe.                                                                                                                                | O carregamento do módulo de entrada falha antes de a API iniciar. O caminho real para esses arquivos é `../../config/database`.                                                    |
| Crítica    | `EntradaService.js` e `EntradaSchema.js` usam `../../errors/AppError`; o arquivo existente fica em `shared/errors/AppError.js`.                                                                                                                                              | Outro bloqueio de carregamento do módulo de entrada.                                                                                                                               |
| Crítica    | `VendaRoutes.js` registra `VendaController.listar`, mas o controller tem `listarVendasPaginadas`, não `listar`.                                                                                                                                                              | Express recebe callback `undefined` e não registra a rota. A inconsistência foi reproduzida em isolamento, sem conectar ao banco.                                                  |
| Crítica    | `schema.sql` contém texto explicativo sem comentário, uma marcação `SQL`, um `ALTER TABLE` que adiciona novamente `quantidade_estoque` já presente no `CREATE TABLE sku` e um `DELIMITER $$` sem definição posterior.                                                        | O arquivo não é um script de instalação completo e executável.                                                                                                                     |
| Alta       | `refresh_tokens` é consultada/inserida pela autenticação, mas não é criada em `schema.sql`.                                                                                                                                                                                  | O login tenta salvar o refresh token e pode falhar mesmo com credenciais válidas. Um banco montado fora desse arquivo pode ter a tabela; isso não foi confirmado.                  |
| Alta       | Auth assina `{ id: user.id }`, mas o banco fornece `id_funcionario`; retorna `funcionario.nome`, enquanto a coluna é `nome_completo`.                                                                                                                                        | O token pode sair sem o identificador correto e a renovação buscar um funcionário indefinido. O front usa o e-mail quando não recebe nome, mas não repara o JWT.                   |
| Alta       | `AuthRepository.findByEmail/findById` filtram `deleted_at`, mas não `ativo`; `buscarRefreshToken` não compara `expira_em`.                                                                                                                                                   | Regras de atividade/expiração não estão aplicadas completamente. A verificação JWT de renovação existe, mas não substitui todas as verificações do registro.                       |
| Alta       | `verificarToken` e `verificarAdmin` existem, mas não são aplicados às rotas registradas.                                                                                                                                                                                     | CRUD e movimentações não exigem autenticação/autorização pelo código fornecido. O Bearer do front não torna essas rotas seguras.                                                   |
| Alta       | `MarcaRepository.cadastrar` escreve em `marca.nome`, enquanto o SQL define `nome_marca`; `ModeloRepository.cadastrar` escreve em `modelo.nome`, enquanto o SQL define `nome_modelo`. O modelo ainda exige categoria e funcionário de cadastro não recebidos pelo controller. | Criação de marca/modelo incompatível com o schema.                                                                                                                                 |
| Alta       | `CargoRepository.buscarPorNome` consulta `WHERE nome = ?`; a coluna é `nome_cargo`.                                                                                                                                                                                          | O cadastro de cargo falha antes da inserção ao verificar duplicidade.                                                                                                              |
| Alta       | `FuncionariosRepository.atualizarFuncionario` usa as chaves de entrada como nomes SQL (`nome`, `idCargo`). O banco usa `nome_completo`, `id_cargo`; `dataNascimento` é extraída pelo service, mas não adicionada ao payload de atualização.                                  | Edição completa de funcionário não corresponde ao banco. Atualizar apenas e-mail/senha usa colunas existentes, mas ainda depende de resolver CORS para PUT.                        |
| Alta       | CORS permite `GET, POST, PATCH, DELETE`, embora existam rotas `PUT`.                                                                                                                                                                                                         | Atualizações entre front na porta 5173 e API na porta 3000 são bloqueadas pelo navegador. PATCH não possui handlers neste projeto.                                                 |
| Alta       | Entrada e devolução inserem registros, mas não atualizam `sku.quantidade_estoque`. Venda insere itens sem decrementar essa coluna ou comparar a quantidade pedida com o saldo. O SQL elimina os triggers antigos sem criar novos.                                            | A movimentação pode ser gravada sem refletir no saldo e sem garantir disponibilidade/limite de devolução. É necessário definir uma estratégia transacional consistente no backend. |
| Alta       | `AjusteRepository` insere em `ajuste_estoque`, ausente no schema, e atualiza `sku.quantidade`, também ausente.                                                                                                                                                               | Ajuste incompatível com o banco fornecido.                                                                                                                                         |
| Média      | Controller de paginação de venda chama repository diretamente, recebe cursor da query como string e devolve `proximoCursorRaw` como objeto. O service já possui codificação/decodificação de cursor, mas não é utilizado nesse caminho.                                      | A paginação não continua corretamente. O front sinaliza consulta parcial e não interpreta objeto como um cursor válido.                                                            |
| Média      | `FuncionarioRoutes.js` registra duas vezes `DELETE /:id`; o primeiro handler responde sem `next()`. O controller de exclusão “permanente” e o service correspondente também usam exclusão lógica.                                                                            | A segunda rota normalmente não é alcançada e não implementa uma exclusão permanente distinta.                                                                                      |
| Média      | Controllers de cargo/funcionário devolvem 500 para erros de validação; outros módulos preservam o status do domínio.                                                                                                                                                         | Contrato de erro inconsistente. O front trata tanto `erro` quanto `mensagem` e não deduz sucesso por status inesperado.                                                            |
| Média      | `server.js` aceita fallback de chave JWT, mas AuthService e authMiddleware leem diretamente `JWT_SECRET`.                                                                                                                                                                    | A validação do startup pode passar e a assinatura/verificação falhar com o fallback.                                                                                               |
| Média      | `src/shared/lib/jwtUtils.js` importa `../config/environment`, destino inexistente. Não é usado no fluxo principal AuthService.                                                                                                                                               | Esse utilitário também está quebrado, embora não seja o bloqueio principal da inicialização.                                                                                       |
| Média      | Testes de venda/entrada ainda importam módulos antigos como `SaidaRepository`, `ProdutoRepository`; testes de marca/modelo/ajuste importam `../../app`, cujo destino não é `src/app.js`.                                                                                     | A existência desses testes não comprova o funcionamento da versão enviada. A suíte de backend não foi executada.                                                                   |

O README original apresenta um exemplo de teste em TypeScript de um módulo `users` que não corresponde aos arquivos encontrados. `ROTAS.md` e a resposta informativa de `/` também listam recursos antigos/inexistentes. O inventário a seguir foi obtido dos arquivos de rotas e de `app.js`, não daquela documentação.

## Todas as rotas efetivamente declaradas

São **29 combinações únicas de método/caminho de domínio**, mais `GET /` (30 únicas). Há ainda uma segunda declaração duplicada de `DELETE /funcionario/:id`. “Declarada” não significa operacional: os bloqueios de inicialização afetam a aplicação inteira até serem resolvidos.

| Método | Caminho completo      | Contrato / comportamento declarado                                                   | Observação                                                                                                                     |
| ------ | --------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/`                   | Mensagem e versão da API.                                                            | Lista de recursos na resposta está desatualizada.                                                                              |
| POST   | `/auth/login`         | `{ email, senha }` → `{ funcionario, acessToken, refreshToken }`.                    | `acessToken` é a grafia real; status 201.                                                                                      |
| POST   | `/auth/refresh-token` | `{ refreshToken }` → `{ acessToken }`.                                               | Depende de corrigir identificador JWT e tabela.                                                                                |
| POST   | `/auth/logout`        | `{ refreshToken }` → 200, sem corpo.                                                 | Remove o refresh token; não invalida automaticamente access tokens já emitidos.                                                |
| GET    | `/cargo`              | Array direto de cargos.                                                              | Campos `id_cargo`, `nome_cargo`, `nivel_acesso`.                                                                               |
| GET    | `/cargo/:id`          | Objeto de cargo.                                                                     | Erros retornam 500 no controller.                                                                                              |
| POST   | `/cargo`              | `{ nome_cargo, nivel_acesso }` → ID inserido.                                        | Consulta de nome usa coluna incorreta.                                                                                         |
| PUT    | `/cargo/:id`          | Objeto com campos de cargo.                                                          | CORS não permite PUT; não há validação completa no update.                                                                     |
| DELETE | `/cargo/:id`          | `{ mensagem: 'Cargo removido.' }`.                                                   | Exclusão física, sujeita à restrição de FK. Front pede confirmação.                                                            |
| GET    | `/funcionario`        | `{ sucesso, dados, total }`, apenas ativos.                                          | Remove `senha` da resposta. Não retorna funcionários inativos.                                                                 |
| GET    | `/funcionario/:id`    | `{ sucesso, dados }`.                                                                | Busca funcionário ativo e remove senha.                                                                                        |
| POST   | `/funcionario`        | `{ nome, dataNascimento, senha, email, idCargo }`.                                   | Service valida e-mail, idade mínima de 14 anos, hash bcrypt.                                                                   |
| PUT    | `/funcionario/:id`    | Campos parciais `nome`, `email`, `senha`, `idCargo`; data não aplicada.              | Mapeamento SQL incorreto para nome/cargo e bloqueio CORS. Front preparado para editar somente e-mail/senha após correção CORS. |
| DELETE | `/funcionario/:id`    | Exclusão lógica com `ativo=0`, `deleted_at`.                                         | Duplicada no arquivo; front usa a primeira operação.                                                                           |
| GET    | `/marca`              | Array direto de marcas.                                                              | Campos definidos no banco: `id_marca`, `nome_marca`.                                                                           |
| POST   | `/marca`              | `{ nome }` → `{ id }`.                                                               | Payload do controller, não nome da coluna; repository incompatível com schema.                                                 |
| GET    | `/modelo`             | Array direto de modelos.                                                             | Campos de banco, incluindo `nome_modelo`, `id_marca`, `ativo`.                                                                 |
| POST   | `/modelo`             | `{ nome, idMarca }` → `{ id }`.                                                      | Não recebe todos os campos obrigatórios do schema.                                                                             |
| POST   | `/ajuste`             | `{ idSku, quantidade, motivo }` → `{ sucesso: true }`.                               | Quantidade é variação, inclusive negativa. Repository incompatível com schema. Não existe GET de ajustes.                      |
| GET    | `/entrada`            | `{ sucesso, dados, total }`.                                                         | Lista vazia é 404 com `Nenhuma entrada encontrada`.                                                                            |
| GET    | `/entrada/:id`        | `{ sucesso, dados }`.                                                                | Campos de resposta em camelCase.                                                                                               |
| POST   | `/entrada`            | Recebimento por SKU, quantidade, total, lote e data.                                 | Imports incorretos e saldo sem atualização.                                                                                    |
| GET    | `/venda`              | Intenção de listagem. Controller possui listagem paginada com `dados` e `paginacao`. | Handler `listar` não existe; a declaração não funciona como recebida.                                                          |
| GET    | `/venda/:id`          | `{ sucesso, dados }` com `itens` e `pagamentos`.                                     | Cabeçalho/itens usam snake_case do banco.                                                                                      |
| POST   | `/venda`              | Cabeçalho + `itens` + `pagamentos` opcionais.                                        | Preços vêm do servidor, mas falta consistência do saldo.                                                                       |
| GET    | `/devolucao`          | `{ sucesso, dados, total }`.                                                         | Lista vazia é 404 com `Nenhuma devolução encontrada`.                                                                          |
| GET    | `/devolucao/:id`      | `{ sucesso, dados }`.                                                                | Campos em camelCase.                                                                                                           |
| POST   | `/devolucao`          | Item vendido, tipo, quantidade, motivo, reutilização, reembolso e data.              | Troca exige ID de nova venda existente; falta controle de saldo/quantidade no código enviado.                                  |
| GET    | `/estoque`            | `{ sucesso, dados, total }` a partir de `vw_estoque_atual`.                          | A view considera SKUs ativos, saldo materializado e dados de modelo/marca.                                                     |
| GET    | `/estoque/:id`        | `{ sucesso, dados }` para ID de SKU.                                                 | Não é ID de modelo ou produto.                                                                                                 |

**Não existem rotas registradas para:** `/produto`, `/saida`, `/sku`, cliente, fornecedor, categoria, criação isolada de pagamentos, convite de usuários, recuperação de senha, upload de imagem ou alteração/cancelamento de venda. Há tabelas para algumas dessas entidades, mas tabela não é endpoint. Não foram criadas chamadas fictícias para elas.

## Contratos de movimentação usados pelo front

Números são enviados como números JSON; opcionais sem valor vão como `null`, quando previsto. Nenhuma operação altera somente uma tabela visual para aparentar persistência.

### Entrada

```json
{
  "idFuncionario": 1,
  "idSku": 101,
  "idFornecedor": null,
  "quantidade": 2,
  "valorTotal": 500.25,
  "dataEntrada": "2026-10-05",
  "lote": "L001",
  "notaFiscal": null
}
```

IDs positivos inteiros, quantidade inteira positiva, total positivo, lote de até 20 caracteres e nota fiscal de até 44. Os campos da resposta são `idEntrada`, `idSku`, `valorTotal`, `dataEntrada` etc.

### Venda

```json
{
  "idFuncionario": 1,
  "idCliente": null,
  "canal": "LOJA",
  "desconto": 5,
  "codigoRastreamento": null,
  "observacao": null,
  "itens": [{ "idSku": 101, "quantidade": 2, "descontoItem": 10 }],
  "pagamentos": [
    { "forma": "PIX", "parcelas": 1, "valor": 1384.8, "status": "APROVADO" }
  ]
}
```

Exemplo com preço cadastrado de R$ 699,90: `2 × 699,90 − 10 − 5 = 1.384,80`. O front não envia preço unitário nem valor total definitivo. O desconto do item é o desconto **total da linha**, não percentual nem desconto por unidade. SKUs duplicados são impedidos; a disponibilidade local é uma verificação auxiliar, nunca substitui o bloqueio no banco. O pagamento é opcional. A tela oferece um pagamento por venda; o backend possui contrato para múltiplos pagamentos. Sem pagamento, a venda é aberta; todos os pagamentos aprovados fazem o service escolher `PAGA`.

### Devolução / troca

```json
{
  "idFuncionario": 1,
  "idItemVenda": 11,
  "tipo": "DEVOLUCAO",
  "quantidade": 1,
  "motivo": "Tamanho",
  "reutilizavel": true,
  "valorReembolso": 0,
  "idVendaTroca": null,
  "dataDevolucao": "2026-10-05"
}
```

A tela consulta `/venda/:id` para selecionar um `id_item_venda` real. `reutilizavel` é booleano JSON. Troca usa `tipo: "TROCA"` e exige `idVendaTroca` positivo. O front não gera uma nova venda implicitamente. A quantidade exibida na seleção é a quantidade originalmente vendida, não um saldo calculado de devoluções; o backend precisa validar quanto ainda pode ser devolvido.

### Ajuste

```json
{ "idSku": 101, "quantidade": -2, "motivo": "Conferência" }
```

A quantidade é uma variação inteira diferente de zero. Não existe consulta de histórico de ajustes no backend; a tela não inventa uma.

## Ativação das operações

Em `src/services/config.js`, somente os fluxos de gravação sem incompatibilidade estrutural identificada permanecem habilitados: cadastro/desativação de funcionário e exclusão de cargo. **Mesmo eles dependem de a API iniciar e de um banco válido.** Não são operações certificadas contra um banco real.

| Flag                 | Valor entregue | Dependência antes de habilitar                                                                                               |
| -------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `createEmployee`     | `true`         | API/banco operacionais e política de autorização adequada.                                                                   |
| `deactivateEmployee` | `true`         | API/banco operacionais. A tela impede desativar a própria conta.                                                             |
| `deleteRole`         | `true`         | API/banco operacionais; exclusão confirmada e FK respeitada.                                                                 |
| `editEmployee`       | `false`        | Corrigir CORS de PUT. O formulário preparado só envia e-mail/senha.                                                          |
| `createRole`         | `false`        | Corrigir consulta de duplicidade para `nome_cargo`.                                                                          |
| `editRole`           | `false`        | Corrigir CORS de PUT e validar atualização no service.                                                                       |
| `createBrand`        | `false`        | Compatibilizar inserção com `nome_marca`.                                                                                    |
| `createModel`        | `false`        | Compatibilizar coluna e definir contrato completo para categoria/funcionário; se o contrato mudar, atualizar também o front. |
| `createEntry`        | `false`        | Corrigir imports e garantir atualização transacional de saldo.                                                               |
| `createSale`         | `false`        | Corrigir registro da rota e validação/decremento transacional do estoque.                                                    |
| `createReturn`       | `false`        | Validar limite de devolução e recomposição transacional quando reutilizável.                                                 |
| `adjustStock`        | `false`        | Definir tabela de ajuste e atualizar `quantidade_estoque` com validação/transação.                                           |

Habilitar uma flag não corrige o backend. A demonstração bloqueia todas as gravações independentemente dessas flags. A UI informa indisponibilidade, sem inserir detalhes internos de implementação no fluxo do usuário.

## Requisições e limitações explícitas

- O cliente aceita listas diretas (marca/modelo/cargo) e envelopes `dados` (estoque/funcionário/movimentações).
- Erros 404 de entrada/devolução só viram lista vazia quando a mensagem corresponde exatamente ao vazio conhecido. Uma rota inexistente continua sendo um erro.
- GET com 401, ou 403 de token, tenta renovar a sessão uma vez. Renovações concorrentes compartilham a mesma promessa. Falha de renovação encerra a sessão local.
- Escritas não são repetidas automaticamente, para evitar operações duplicadas. Timeout/conexão interrompida recomenda consultar o histórico antes de reenviar. O backend não fornece idempotência.
- Logout aceita 200 sem corpo. Se o servidor não confirmar, a sessão local é encerrada com um aviso sobre a revogação não confirmada.
- Listagem paginada de vendas só continua com cursor textual válido e não repetido. Cursor inválido/objeto é sinalizado como consulta parcial; registros repetidos interrompem a continuação.
- Relatórios usam o estoque atual. Não há gráficos de crescimento, lucro, categorias ou faturamento histórico com dados inventados. A view não fornece custo nem categoria.
- Cadastro/edição de SKU, reativação de funcionário, redefinição de senha, cancelamento de vendas, múltiplos pagamentos na interface e consulta de ajustes precisam de desenvolvimento posterior.

## Validação da conversão

Consulte `README.md` para a compilação e os testes de preservação de comportamento da versão React. O backend continua sem validação integrada com MySQL.

## Ordem sugerida para corrigir o backend posteriormente

1. Resolver imports e callback de listagem de venda, para a aplicação carregar.
2. Preparar um SQL limpo e completo, incluindo tabelas usadas por autenticação/ajuste.
3. Corrigir identificador/nome da autenticação, estratégia de chaves e aplicar autenticação/autorização nas rotas.
4. Compatibilizar repositories com schema e liberar PUT no CORS.
5. Centralizar validação e mutação do saldo dentro das transações de entrada/venda/devolução/ajuste.
6. Usar o service de paginação de vendas e revisar testes antigos.
7. Testar cada operação contra MySQL antes de habilitar sua flag no front.

Nenhuma dessas correções de backend foi aplicada nesta entrega, conforme o escopo solicitado.
