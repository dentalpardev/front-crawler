# Auth Module

## Proposito

Centraliza as telas publicas de autenticacao e os contratos necessarios para login, cadastro, recuperacao e redefinicao de senha.

## Rotas

- `/login` (`login`): entrada de usuarios existentes.
- `/register` (`register`): cadastro de novos usuarios.
- `/forgot-password` (`forgot-password`): solicitacao de recuperacao de senha.
- `/reset-password` (`reset-password`): redefinicao de senha a partir de token.

As rotas publicas usam `meta.module = 'auth'`; as rotas de entrada usam `guestOnly` quando devem ser evitadas por usuarios autenticados.

## API Publica

O arquivo `index.ts` exporta apenas as rotas e seus nomes:

- `authRoutes`
- `LOGIN_ROUTE_NAME`
- `REGISTER_ROUTE_NAME`
- `FORGOT_PASSWORD_ROUTE_NAME`
- `RESET_PASSWORD_ROUTE_NAME`

Submodulos tambem possuem seus proprios barrels:

- `api/index.ts`: funcoes de request e tipos de payload/resposta.
- `store/index.ts`: `useAuthStore`.

## Dependencias Importantes

- `vue-router` para declaracao das rotas.
- `pinia` no store de autenticacao.
- `shared/api` para chamadas HTTP.
- Componentes de formulario em `shared/ui`.

## Pontos de Extensao

- Novas telas publicas devem entrar em `routes.ts` e expor nome de rota constante.
- Novas chamadas de autenticacao devem ficar em `api/authApi.ts` e ser reexportadas por `api/index.ts`.
- Estado autenticado compartilhado deve ser adicionado em `store/useAuthStore.ts`.
