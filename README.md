# Dentalpar Frontend

Frontend da plataforma de busca odontologica da Dentalpar.

A aplicacao concentra autenticacao, recuperacao de senha, disparo de crawlers por provider, acompanhamento assíncrono de `jobs` e `batches` e exibicao paginada dos dentistas retornados pelo backend.

## Stack

- Vue 3 + TypeScript
- Vite
- PrimeVue 4 em `styled mode`
- Tema `Aura`
- Pinia
- Vue Router
- Vitest
- Playwright

## O Que o Projeto Faz

- login, cadastro e recuperacao de senha integrados ao backend
- rotas publicas e protegidas com controle de sessao JWT
- busca principal guiada por `UF -> municipio`
- selecao de um ou varios providers na mesma busca
- filtros especificos por provider com valores default pre-preenchidos
- criacao de `job` individual ou `batch` multi-provider
- polling de status ate conclusao
- retry automatico excluindo providers com falha no batch
- listagem de resultados com paginacao
- exportacao completa em CSV com todos os campos do dentista
- suporte a light mode e dark mode

## Providers Suportados

- `OdontoPrev`
  rede ou plano (mutuamente exclusivos) e filtros opcionais de especialidade, acessibilidade e idioma.
- `Hapvida`
  fluxo em cascata: tipo de contrato, produto, servico, especialidade e bairro.
- `Amil`
  fluxo dental em cascata: rede ou plano, bairro e especialidade; `tipoServico` e enviado como `DENTAL`.
- `SulAmerica`
  produto, plano e refinamento opcional de horario.

Todos os providers tem valores default pre-selecionados que permitem buscar sem configurar nenhum filtro. Os catalogos de cada provider sao carregados sob demanda quando o painel do provider e aberto.

## Fluxos Principais

### Autenticacao

- `POST /auth/login`
- `POST /users/register`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

Em desenvolvimento local, o fluxo de recuperacao de senha pode ser validado via Mailpit.

### Busca e Coleta

- o usuario escolhe a `UF` e o `municipio` (carregado via API do IBGE, evitando erro de digitacao)
- seleciona um ou mais providers e ajusta os filtros se necessario
- com um provider selecionado, o frontend cria um `job`; com varios, cria um `batch`
- a tela faz polling de status ate conclusao
- em caso de falha parcial, e possivel retentar apenas os providers que falharam com `forceRefresh`

### Resultados

- cards responsivos para dentistas com badges de qualificacao
- paginacao com PrimeVue `Paginator`
- exportacao da lista completa em CSV com todos os campos: contato, endereco, especialidades e 11 indicadores de qualificacao como Sim/Nao

## Estrutura

```text
src/
  app/         bootstrap da aplicacao, router, tema e shell
  modules/
    auth/      paginas publicas, formularios e store de sessao
    home/      busca, filtros por provider, jobs, batches e resultados
  shared/      client HTTP, tipos e UI reutilizavel
```

Arquivos de referencia:

- [src/app/main.ts](src/app/main.ts)
- [src/app/router.ts](src/app/router.ts)
- [src/app/primevue.ts](src/app/primevue.ts)
- [src/modules/auth/store/useAuthStore.ts](src/modules/auth/store/useAuthStore.ts)
- [src/modules/home/store/useHomeSearchStore.ts](src/modules/home/store/useHomeSearchStore.ts)
- [src/modules/home/api/crawlersApi.ts](src/modules/home/api/crawlersApi.ts)
- [src/modules/home/pages/HomePage.vue](src/modules/home/pages/HomePage.vue)

## Tema e UI

O projeto usa PrimeVue da forma nativa recomendada:

- `styled mode`
- preset `Aura`
- `inputVariant: 'filled'`
- `darkModeSelector: '.app-dark'`
- customizacao de tokens em [src/app/primevue.ts](src/app/primevue.ts)

## Requisitos

- Node.js `^20.19.0 || >=22.12.0`
- npm
- backend da Dentalpar rodando localmente

## Configuracao

Instale as dependencias:

```sh
npm install
```

Crie um arquivo `.env` na raiz se quiser sobrescrever a URL padrao da API:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Se a variavel nao existir, o frontend usa `http://localhost:8000/api/v1` por padrao.

## Executando o Projeto

Modo desenvolvimento:

```sh
npm run dev
```

Build de producao:

```sh
npm run build
```

Preview local da build:

```sh
npm run preview
```

## Scripts Disponiveis

```sh
npm run dev
npm run build
npm run preview
npm run type-check
npm run lint
npm run test:unit -- --run
npm run test:e2e
npm run format
```

## Qualidade

```sh
npm run type-check
npm run lint
npm run test:unit -- --run
npm run test:e2e
```

Na primeira execucao do Playwright, pode ser necessario instalar os browsers:

```sh
npx playwright install
```

## Integracao com o Backend

O frontend usa um client compartilhado em [src/shared/api/httpClient.ts](src/shared/api/httpClient.ts).

Rotas consumidas:

- `POST /auth/login`
- `POST /users/register`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /crawlers/odontoprev`
- `POST /crawlers/hapvida`
- `POST /crawlers/amil`
- `POST /crawlers/sulamerica`
- `POST /crawlers/batches`
- `GET /crawlers/jobs/{id}`
- `GET /crawlers/jobs/{id}/dentists`
- `GET /crawlers/batches/{id}`
- `GET /crawlers/batches/{id}/dentists`

## Observacoes

- a sessao do usuario e persistida em `localStorage`
- municipios sao carregados por UF via API do IBGE para reduzir erro humano
- os resultados sao paginados para evitar scroll excessivo em listas grandes
- na Amil, a busca pode demorar mais porque o backend usa automacao de navegador na etapa final
- o CSV exporta todos os campos do payload de dentista, incluindo CNPJ com mascara e booleans de qualificacao como Sim/Nao
