# Shared

## Proposito

Contem o kernel reutilizavel do frontend: cliente HTTP, tipos globais, componentes base, composables transversais e utilidades que nao pertencem a um modulo especifico.

## Rotas

`shared/` nao expoe rotas. Modulos de dominio devem declarar suas rotas localmente e reexportar apenas o necessario pelo barrel do modulo.

## API Publica

Barrels principais:

- `api/index.ts`: `apiRequest`, `ApiError`, `isApiError` e tipos de validacao.
- `types/index.ts`: tipos compartilhados como `CrawlProvider`, `CrawlJobStatus` e `CrawlBatchStatus`.
- `ui/index.ts`: componentes base reutilizaveis (`AppTopbar`, inputs, card, botao e logo).
- `utils/index.ts`: formatadores e helpers genericos (`trimValue`, `formatBoolean`, `formatCnpj`, `downloadTextFile`).

## Dependencias Importantes

- `axios` no cliente HTTP.
- PrimeVue dentro dos componentes base.
- APIs de navegador somente em utilidades que protegem execucao fora do browser.

## Pontos de Extensao

- Adicione em `shared/` apenas codigo reutilizavel por mais de um modulo.
- Componentes base devem ser pequenos, sem conhecimento de regras de dominio.
- Tipos especificos de uma feature devem permanecer dentro do respectivo modulo.
- Toda nova API compartilhada deve ser reexportada pelo `index.ts` do subdiretorio correspondente.
