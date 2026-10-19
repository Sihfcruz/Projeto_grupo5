# API Nômade

API de gestão de estoque, vendas e trocas de uma loja de tênis (Node.js + Express + MySQL).

## Como rodar

```bash
npm install
cp .env.example .env          # preencha DB_* e as duas chaves JWT (mín. 32 caracteres)
mysql -u root -p < src/config/schema.sql
ADMIN_EMAIL=admin@nomade.com ADMIN_SENHA='SenhaForte123' npm run seed:admin
npm start                     # ou: npm run dev
```

- Documentação interativa: `http://localhost:3000/api-docs` (regenerar com `npm run swagger`)
- Testes unitários: `npm test`
- Teste ponta a ponta (precisa de MySQL com o schema carregado): `npm run test:e2e`

## Autenticação

`POST /auth/login` retorna `accessToken` (curto) e `refreshToken`. Envie `Authorization: Bearer <accessToken>`
em todas as outras rotas. `POST /auth/refresh-token` troca o refresh por um novo par (rotação) e
`POST /auth/logout` invalida o refresh token.

Cargo com `nivel_acesso >= 100` é administrador. Somente admin: `/cargo` (escrita), `/funcionario`, `/ajuste`
e `DELETE` nos demais recursos.

## Estoque

O saldo fica em `sku.quantidade_estoque` (nunca negativo — há `CHECK` no banco) e é alterado **apenas** por:

| Operação | Efeito |
|---|---|
| `POST /entrada` | soma |
| `POST /venda` | subtrai (409 se faltar saldo) |
| `POST /devolucao` (`reutilizavel: true`) | soma |
| `PATCH /venda/:id/status` → `CANCELADA` | repõe os itens |
| `POST /ajuste` (admin) | soma/subtrai (quantidade positiva ou negativa) |

Tudo roda em transação com `SELECT ... FOR UPDATE`. O funcionário responsável (`idFuncionario`) sempre vem do token.

## Rotas

`/auth`, `/cargo`, `/funcionario`, `/marca`, `/categoria`, `/modelo`, `/fornecedor`, `/cliente`, `/sku`,
`/entrada`, `/venda` (inclui `PATCH /:id/status`), `/devolucao`, `/ajuste`, `/estoque`.
