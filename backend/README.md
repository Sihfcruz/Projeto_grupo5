# API Nômade

API de gestão de estoque, vendas e trocas de uma loja de tênis (Node.js + Express + MySQL).

## Como rodar

```bash
npm install
cp .env.example .env          # preencha DB_*, JWT_SECRET e JWT_REFRESH_SECRET (mín. 32 chars cada)
mysql -u root -p nomade < src/config/schema.sql
ADMIN_EMAIL=admin@nomade.com ADMIN_SENHA='SenhaForte123' npm run seed:admin
npm start
```

- Documentação interativa: `http://localhost:3000/api-docs`
- Testes: `npm test`

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
`/entrada`, `/venda` (inclui `PATCH /:id/status` e `PATCH /:id/pagamento`), `/devolucao`,
`/ajuste` (inclui `GET /`), `/estoque`.
