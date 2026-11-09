# Nômade — frontend React

React + Vite, mantendo as entradas .html e os estilos existentes.

## Executar

Requer Node.js 22.12+ e npm. Execute `npm ci` e `npm run dev` nesta pasta. Abra http://localhost:5173/login.html. Prepare a API e o MySQL conforme [README principal](../README.md).

Copie .env.example para .env para configurar VITE_API_URL (padrão http://localhost:3000). Reinicie o Vite após alterações. `npm run build` gera dist; `npm run preview` serve na porta 4173, permitida no CORS padrão. Não use file://.

## Páginas

| Entrada | Tela |
|---|---|
| index.html / login.html | Login e demonstração |
| dashboard.html | Indicadores, alertas e recebimentos |
| inventory.html | Estoque, filtros, detalhes e CSV |
| registration.html | Consulta e criação de marcas e modelos |
| movements.html | Entradas, vendas, devoluções/trocas, ajustes e histórico |
| reports.html | Relatório do estoque atual |
| users.html | Equipe e cargos, somente administradores |

A demonstração é somente consulta e nunca substitui dados de uma API com erro. As operações administrativas dependem do papel retornado no login; o servidor aplica a autorização efetiva.

A sessão usa accessToken. A renovação salva o novo par de tokens e repete uma única vez requisições recusadas por autenticação. Falhas de conexão em gravações orientam consultar o histórico antes de reenviar.

## Organização e contrato

- src/pages: telas.
- src/components: navegação, componentes compartilhados e formulários.
- src/services: configuração, sessão, requisições, dados e hooks.
- src/styles: estilos da equipe.

Cargos, marcas e modelos retornam campos camelCase. Estoque, funcionários e vendas mantêm os campos SQL existentes; entradas e devoluções usam camelCase. Consulte [ROTAS.md](../ROTAS.md).

SKU, categoria, cliente e fornecedor possuem API, mas não telas próprias. Para criar modelos, cadastre uma categoria pela API; para movimentar estoque, cadastre um SKU pela API.

## Verificação

`npm test` verifica o cliente HTTP e os cálculos com respostas simuladas. `npm run build` valida as oito entradas da aplicação. Transações e concorrência exigem MySQL real.
