# Frontend Handoff - Filtros Padrao e Retry Manual

Data: 2026-04-14

Este documento resume o contrato que o frontend deve seguir para criacao de crawls apos a mudanca de produto: os filtros das operadoras agora possuem valores padrao no backend, mas continuam podendo ser alterados pelo usuario.

## Resumo

- O frontend deve pedir obrigatoriamente apenas `cidade`, `uf` e a selecao de operadoras.
- Os filtros especificos de cada operadora devem aparecer como valores padrao na UI.
- Se o usuario nao alterar filtros, o frontend pode omitir `providerOptions` no batch ou omitir os campos especificos na rota individual.
- Se o usuario alterar um filtro, o frontend envia somente os campos alterados ou pode enviar o conjunto completo daquela operadora.
- O backend faz apenas 1 tentativa por job.
- Se um job falhar, o frontend deve oferecer uma acao de retry que cria um novo job.

## Filtros Padrao

| Operadora | Filtros padrao aplicados pelo backend |
|---|---|
| OdontoPrev | `codigoRede=241008130` (`Rede Unna`) |
| Hapvida | `tipoContrato=Individual/Familiar`, `produto=Personal Individual`, `servico=CONSULTORIOS/CLINICAS`, `especialidade=Odontologia Clinica`, `bairro=TODOS OS BAIRROS` |
| Amil | `codigoRede=844`, `bairro=TODOS OS BAIRROS`, `tipoServico=DENTAL`, `especialidade=CLINICA GERAL` |
| SulAmerica | `produto=100` (`Odonto Individual`), `plano=Odonto Mais` |

## UI Recomendada

Na tela de busca, mostrar os campos:

- `cidade`
- `uf`
- operadoras selecionadas
- filtros avancados por operadora, inicialmente preenchidos com os defaults

Os filtros avancados podem ficar em uma area expansivel. O fluxo principal deve funcionar mesmo sem o usuario abrir essa area.

Quando o usuario mantiver os defaults, o frontend pode enviar apenas `cidade`, `uf` e `providers`. Isso reduz acoplamento com codigos internos.

## Criar Batch com Defaults

Endpoint:

```http
POST /api/v1/crawlers/batches
Authorization: Bearer <token>
Content-Type: application/json
```

Payload minimo:

```json
{
  "cidade": "Joinville",
  "uf": "SC",
  "providers": ["odontoprev", "hapvida", "amil", "sulamerica"]
}
```

O backend vai criar um job por operadora usando os defaults.

## Criar Batch com Overrides

Enviar `providerOptions` apenas para a operadora que o usuario alterou.

Exemplo alterando bairro da Hapvida e area da SulAmerica:

```json
{
  "cidade": "Joinville",
  "uf": "SC",
  "providers": ["hapvida", "sulamerica"],
  "providerOptions": {
    "hapvida": {
      "bairro": "CENTRO"
    },
    "sulamerica": {
      "area": "Clinica Geral"
    }
  }
}
```

O backend completa o restante dos filtros com os defaults de cada operadora.

## Regras por Operadora

### OdontoPrev

Default:

```json
{
  "codigoRede": "241008130"
}
```

Se o usuario escolher um plano, envie `codigoPlano` e nao envie `codigoRede`.

```json
{
  "providerOptions": {
    "odontoprev": {
      "codigoPlano": "240867150"
    }
  }
}
```

`codigoRede` e `codigoPlano` continuam mutuamente exclusivos.

### Hapvida

Defaults:

```json
{
  "tipoContrato": "Individual/Familiar",
  "produto": "Personal Individual",
  "servico": "CONSULTORIOS/CLINICAS",
  "especialidade": "Odontologia Clinica",
  "bairro": "TODOS OS BAIRROS"
}
```

O usuario pode alterar qualquer campo. Campos omitidos voltam para o default.

### Amil

Defaults:

```json
{
  "codigoRede": "844",
  "bairro": "TODOS OS BAIRROS",
  "tipoServico": "DENTAL",
  "especialidade": "CLINICA GERAL"
}
```

Para forcar uma nova execucao ao inves de reaproveitar cache, envie:

```json
{
  "forceRefresh": true
}
```

### SulAmerica

Defaults:

```json
{
  "produto": "100",
  "plano": "Odonto Mais"
}
```

Filtros opcionais continuam disponiveis:

```json
{
  "bairro": "Centro",
  "area": "Clinica Geral",
  "horarioInicial": "08:00",
  "horarioFinal": "18:00"
}
```

## Rotas Individuais

Tambem e possivel criar um job individual usando apenas cidade e UF.

```json
POST /api/v1/crawlers/hapvida
{
  "cidade": "Joinville",
  "uf": "SC"
}
```

```json
POST /api/v1/crawlers/sulamerica
{
  "cidade": "Joinville",
  "uf": "SC"
}
```

```json
POST /api/v1/crawlers/amil
{
  "cidade": "Joinville",
  "uf": "SC"
}
```

```json
POST /api/v1/crawlers/odontoprev
{
  "cidade": "Joinville",
  "uf": "SC"
}
```

## Polling e Status

Depois de criar um job ou batch, o frontend deve continuar usando polling:

```http
GET /api/v1/crawlers/jobs/{jobId}
GET /api/v1/crawlers/batches/{batchId}
```

Status esperados:

| Status | Significado para UI |
|---|---|
| `queued` | Job aguardando processamento |
| `running` | Job em execucao |
| `done` | Job concluido com sucesso |
| `failed` | Job falhou; mostrar erro e botao de retry |
| `partial_failed` | Batch teve ao menos uma falha e ao menos um sucesso |

## Retry Manual no Frontend

O backend nao faz retry automatico de job.

Quando um job falhar:

1. Mostrar `errorMessage` para o usuario.
2. Mostrar botao `Tentar novamente`.
3. Ao clicar, criar um novo job com o mesmo payload efetivo.
4. Usar o novo `jobId` para polling.

Para retries iniciados pelo usuario, recomendamos enviar `forceRefresh=true` quando o endpoint aceitar esse campo. Isso garante uma nova execucao real e evita reaproveitamento de cache.

Hoje, a rota individual da Amil aceita `forceRefresh`. No batch, `forceRefresh` pode ser enviado dentro de `providerOptions` da operadora. Nas rotas individuais das outras operadoras, reenviar o mesmo payload sem `forceRefresh`.

Exemplo para retry da Amil:

```json
POST /api/v1/crawlers/amil
{
  "cidade": "Joinville",
  "uf": "SC",
  "forceRefresh": true
}
```

Exemplo para retry de uma operadora dentro de um batch:

```json
POST /api/v1/crawlers/batches
{
  "cidade": "Joinville",
  "uf": "SC",
  "providers": ["hapvida"],
  "providerOptions": {
    "hapvida": {
      "forceRefresh": true
    }
  }
}
```

O frontend nao deve tentar consumir a fila `failed` do Messenger. Essa fila e manutencao interna do backend.

## Resultados

Quando o job terminar com `done`, buscar resultados:

```http
GET /api/v1/crawlers/jobs/{jobId}/dentists
```

Para batch:

```http
GET /api/v1/crawlers/batches/{batchId}/dentists
```

## Checklist para Implementacao

- [ ] Tela permite selecionar cidade, UF e operadoras.
- [ ] Filtros avancados aparecem com os defaults descritos neste documento.
- [ ] Payload minimo funciona sem `providerOptions`.
- [ ] Overrides sao enviados somente quando o usuario altera filtros.
- [ ] UI faz polling de job ou batch.
- [ ] Em `failed`, UI mostra `errorMessage`.
- [ ] Em `failed`, UI oferece `Tentar novamente`.
- [ ] Retry cria um novo job e usa o novo `jobId`.
- [ ] Frontend nao depende de retry automatico do backend.
