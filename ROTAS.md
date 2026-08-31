# 📋 Documentação de Rotas - Projeto Grupo 5

## 🔐 Auth
**Base URL:** `/auth`

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/login` | Autenticar usuário |
| POST | `/refresh-token` | Renovar token JWT |
| POST | `/logout` | Fazer logout |

---

## 📦 Cargo
**Base URL:** `/cargo`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar todos os cargos |
| GET | `/:id` | Buscar cargo por ID |
| POST | `/` | Cadastrar novo cargo |
| PUT | `/:id` | Atualizar cargo |
| DELETE | `/:id` | Excluir cargo |

---

## 🏭 Produto
**Base URL:** `/produto`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/ativos` | Listar produtos ativos |
| GET | `/desativados` | Listar produtos desativados |
| GET | `/:id` | Buscar produto por ID |
| POST | `/` | Cadastrar novo produto |
| PUT | `/:id` | Atualizar produto |

---

## 👥 Funcionário
**Base URL:** `/funcionario`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar todos os funcionários |
| GET | `/:id` | Buscar funcionário por ID |
| POST | `/` | Cadastrar novo funcionário |
| PUT | `/:id` | Atualizar funcionário |
| DELETE | `/:id` | Excluir funcionário |

---

## 🔄 Devolução
**Base URL:** `/devolucao`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar todas as devoluções |
| GET | `/:id` | Buscar devolução por ID |
| POST | `/` | Cadastrar nova devolução |

---

## 📥 Entrada
**Base URL:** `/entrada`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar todas as entradas |
| GET | `/:id` | Buscar entrada por ID |
| POST | `/` | Cadastrar nova entrada |

---

## 📤 Saída
**Base URL:** `/saida`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar todas as saídas |
| GET | `/:id` | Buscar saída por ID |
| POST | `/` | Cadastrar nova saída |

---

## 📌 Resumo Estatístico

| Domínio | GET | POST | PUT | DELETE | Total |
|---------|-----|------|-----|--------|-------|
| Auth | 0 | 3 | 0 | 0 | 3 |
| Cargo | 2 | 1 | 1 | 1 | 5 |
| Produto | 3 | 1 | 1 | 0 | 5 |
| Funcionário | 2 | 1 | 1 | 1 | 5 |
| Devolução | 2 | 1 | 0 | 0 | 3 |
| Entrada | 2 | 1 | 0 | 0 | 3 |
| Saída | 2 | 1 | 0 | 0 | 3 |
| **TOTAL** | **13** | **9** | **3** | **2** | **27** |

---

## ⚙️ Configuração no app.js

As rotas são registradas no `app.js` com os seguintes prefixos:

```javascript
app.use('/auth', AuthRoutes);
app.use('/cargo', CargoRoutes);
app.use('/produto', ProdutoRoutes);
app.use('/funcionario', FuncionarioRoutes);
app.use('/devolucao', DevolucaoRoutes);
app.use('/entrada', EntradaRoutes);
app.use('/saida', SaidaRoutes);
```

---

## 📝 Padrões Implementados

✅ **Estrutura CRUD Consistente:**
- GET (listar)
- GET /:id (buscar por ID)
- POST (criar)
- PUT /:id (atualizar)
- DELETE /:id (excluir - quando aplicável)

✅ **Validação:**
- Produto: Validação de ID numérico na rota

✅ **Comentários Descritivos:**
- Todas as rotas possuem comentários explicativos

✅ **Pontuação Consistente:**
- Todos os statements terminam com `;`
