# Documentação de Rotas - Nomade API

Todas as rotas (exceto `/auth`) exigem `Authorization: Bearer <accessToken>`.  
Rotas marcadas com **(admin)** exigem `nivel_acesso >= 100`.

---

## /auth

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/login` | Autenticar (retorna `accessToken` + `refreshToken`) |
| POST | `/refresh-token` | Renovar tokens (rotação) |
| POST | `/logout` | Invalidar refresh token |

---

## /cargo (admin escrita)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar cargos |
| GET | `/:id` | Buscar cargo por ID |
| POST | `/` **(admin)** | Cadastrar cargo |
| PUT | `/:id` **(admin)** | Atualizar cargo |
| DELETE | `/:id` **(admin)** | Excluir cargo |

---

## /funcionario (admin)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar funcionários ativos |
| GET | `/:id` | Buscar funcionário |
| POST | `/` | Cadastrar funcionário |
| PUT / PATCH | `/:id` | Atualizar funcionário |
| DELETE | `/:id` | Desativar funcionário (soft delete) |
| DELETE | `/:id/permanente` | Excluir permanentemente |

---

## /marca

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar marcas |
| GET | `/:id` | Buscar marca |
| POST | `/` | Cadastrar marca |
| PUT / PATCH | `/:id` | Atualizar marca |
| DELETE | `/:id` **(admin)** | Excluir marca |

---

## /categoria

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar categorias |
| GET | `/:id` | Buscar categoria |
| POST | `/` | Cadastrar categoria |
| PUT / PATCH | `/:id` | Atualizar categoria |
| DELETE | `/:id` **(admin)** | Excluir categoria |

---

## /modelo

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar modelos |
| GET | `/:id` | Buscar modelo |
| POST | `/` | Cadastrar modelo (`idMarca`, `idCategoria` obrigatórios) |
| PUT / PATCH | `/:id` | Atualizar modelo |
| DELETE | `/:id` **(admin)** | Soft delete |

---

## /fornecedor

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar fornecedores |
| GET | `/:id` | Buscar fornecedor |
| POST | `/` | Cadastrar fornecedor |
| PUT / PATCH | `/:id` | Atualizar fornecedor |
| DELETE | `/:id` **(admin)** | Soft delete |

---

## /cliente

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar clientes |
| GET | `/:id` | Buscar cliente |
| POST | `/` | Cadastrar cliente |
| PUT / PATCH | `/:id` | Atualizar cliente |
| DELETE | `/:id` **(admin)** | Soft delete |

---

## /sku

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar SKUs |
| GET | `/:id` | Buscar SKU |
| POST | `/` | Cadastrar SKU |
| PUT / PATCH | `/:id` | Atualizar SKU |
| DELETE | `/:id` **(admin)** | Soft delete |

---

## /entrada

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar entradas |
| GET | `/:id` | Buscar entrada |
| POST | `/` | Registrar entrada (incrementa estoque) |

---

## /venda

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar vendas (paginado) |
| GET | `/:id` | Buscar venda com itens e pagamentos |
| POST | `/` | Criar venda |
| PATCH | `/:id/status` | Atualizar status (ABERTA → PAGA/CANCELADA/…) |
| PATCH | `/:id/pagamento` | Adicionar pagamento a uma venda |

---

## /devolucao

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar devoluções |
| GET | `/:id` | Buscar devolução |
| POST | `/` | Registrar devolução (valida contra item vendido) |

---

## /ajuste (admin)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` **(admin)** | Listar ajustes de estoque |
| POST | `/` **(admin)** | Registrar ajuste manual (`idSku`, `quantidade`, `motivo`) |

---

## /estoque

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Consultar estoque atual (`vw_estoque_atual`) |
