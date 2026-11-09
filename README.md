# Nômade — Projeto Grupo 5

Gestão de estoque de calçados com React/Vite, Express e MySQL. As páginas HTML e a organização em rotas, controllers, services e repositories foram mantidas.

## Requisitos e execução

Requer Node.js 22.12+ com npm e MySQL 8.0.16+.

1. Na pasta backend, execute `npm ci` e copie .env.example para .env.
2. Configure DB_* e defina JWT_SECRET e JWT_REFRESH_SECRET diferentes, com pelo menos 32 caracteres cada.
3. Importe backend/src/config/schema.sql no MySQL em uma instalação nova. Não reaplique sobre uma base existente. O script cria e usa o banco nomade; se mudar DB_NAME, ajuste também o SQL.
4. Crie a primeira conta administrativa conforme [backend/README.md](backend/README.md).
5. Na pasta backend, execute `npm start`.
6. Em outro terminal, na pasta frontend, execute `npm ci` e `npm run dev`.
7. Acesse http://localhost:5173/login.html com a conta criada.

## Conexão

A API usa http://localhost:3000. Configure PORT em backend/.env e VITE_API_URL em frontend/.env para alterar. Reinicie o Vite após mudar o ambiente; a versão de produção exige nova compilação.

ALLOWED_ORIGINS lista origens completas separadas por vírgula. Desenvolvimento (5173) e prévia (4173), em localhost e 127.0.0.1, são permitidos por padrão.

## Validação

Na pasta backend: `npm test`, `npm run test:watch` ou `npm run test:coverage`. Um arquivo específico: `npm test -- src/domain/auth/AuthService.test.js`.

Na pasta frontend: `npm test`, `npm run build` e `npm run preview` (porta 4173).

Os testes unitários e HTTP usam persistência simulada; a validação de transações e concorrência requer MySQL real.

## Documentação

- [Backend](backend/README.md): instalação e conta inicial.
- [Frontend](frontend/README.md): páginas e configuração.
- [Rotas](ROTAS.md): métodos, permissões e payloads.
- Documentação interativa: http://localhost:3000/api-docs. Regenerar com `npm run docs:generate` no backend.

A demonstração usa dados fictícios e permite somente consulta. SKU, categoria, cliente e fornecedor têm API, mas ainda não possuem telas próprias.
