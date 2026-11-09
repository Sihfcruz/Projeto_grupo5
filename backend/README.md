# API Nômade

Express + MySQL, mantendo rotas/controllers/services/repositories e helpers CRUD compartilhados.

## Preparação

Execute `npm ci` nesta pasta. Copie .env.example para .env e configure banco, JWT_SECRET e JWT_REFRESH_SECRET (diferentes, mínimo 32 caracteres). JWT_SECRET_SECUNDARY pode substituir uma chave de acesso principal inválida ou ausente.

Importe src/config/schema.sql em uma base nova. O script usa o banco nomade; para mudar DB_NAME, ajuste também CREATE DATABASE e USE no SQL. Não reaplique o schema em uma base em uso.

Crie a primeira conta administrativa no PowerShell:

```powershell
$env:ADMIN_EMAIL = "admin@nomade.com"
$env:ADMIN_NOME = "Administrador"
$env:ADMIN_NASCIMENTO = "1990-01-01"
$env:ADMIN_SENHA = "defina-uma-senha-forte"
npm run seed:admin
Remove-Item Env:ADMIN_SENHA
```

O comando cria uma conta com hash bcrypt e cargo de nível >= 100; não altera contas existentes.

## Executar

- `npm start`: gera documentação e inicia na porta PORT (3000 por padrão).
- `npm run dev`: reinício automático ao salvar.
- `npm run docs:generate`: atualiza src/swagger-output.json.
- `npm test`: testes unitários e HTTP com persistência simulada.

O ambiente é carregado de backend/.env independentemente do diretório de execução. A conexão é verificada ao iniciar o servidor.

## Autenticação e CORS

POST /auth/login recebe { email, senha } e retorna { funcionario, accessToken, refreshToken }. Envie Authorization: Bearer <accessToken> nas rotas protegidas. O acesso dura JWT_EXPIRY (15m por padrão), e o refresh dura sete dias.

POST /auth/refresh-token recebe { refreshToken } e retorna um novo par: ambos precisam ser salvos. POST /auth/logout revoga o refresh e retorna 204 sem corpo. Tokens de acesso já emitidos permanecem válidos até expirar.

ALLOWED_ORIGINS lista origens completas separadas por vírgula. As portas 5173 e 4173 em localhost/127.0.0.1 são permitidas por padrão. GET, POST, PUT, PATCH e DELETE aceitam Authorization e Content-Type.

Cargo com nivel_acesso >= 100 é administrador. Escrita em /cargo, todas as rotas /funcionario e POST /ajuste exigem admin. Exclusões dos demais cadastros também exigem admin.

## Estoque

O saldo em sku.quantidade_estoque muda por entrada (+), venda (-), devolução reutilizável (+), cancelamento (+) e ajuste (+/-), dentro de transações. Falta de saldo retorna 409. O funcionário responsável vem do token.

Consulte [ROTAS.md](../ROTAS.md). Documentação interativa em http://localhost:3000/api-docs.
