# Formato do payload de dentistas retornado pela API

Os endpoints `GET /api/v1/crawlers/jobs/{id}/dentists` e `GET /api/v1/crawlers/batches/{id}/dentists` retornam os dados dos dentistas encontrados em cada busca.

## Estrutura da resposta

### Por job

```
GET /api/v1/crawlers/jobs/{id}/dentists
```

```json
{
  "total": 2,
  "dentists": [
    { /* payload do dentista */ },
    { /* payload do dentista */ }
  ]
}
```

### Por batch

```
GET /api/v1/crawlers/batches/{id}/dentists
```

```json
{
  "batchId": "uuid",
  "totalProviders": 3,
  "totalDentists": 150,
  "results": [
    {
      "provider": "odontoprev",
      "total": 70,
      "dentists": [ /* payloads */ ]
    },
    {
      "provider": "hapvida",
      "total": 43,
      "dentists": [ /* payloads */ ]
    },
    {
      "provider": "amil",
      "total": 37,
      "dentists": [ /* payloads */ ]
    }
  ]
}
```

## Campos do payload de dentista

Todos os provedores retornam a mesma estrutura base. A diferenca esta nos campos que cada provedor consegue preencher.

| Campo | Tipo | Descricao |
|---|---|---|
| `provider` | `string` | `"odontoprev"`, `"hapvida"`, `"amil"` ou `"sulamerica"` |
| `externalId` | `string` | ID unico do dentista no provedor |
| `nome` | `string` | Nome completo |
| `cro` | `string\|null` | Registro no conselho (CRO) |
| `nomeFantasia` | `string\|null` | Nome fantasia (clinicas) |
| `email` | `string\|null` | Email de contato |
| `telefone` | `string\|null` | Telefone(s) |
| `whatsapp` | `string\|null` | Numero do WhatsApp |
| `atendeWhatsapp` | `bool` | Se atende por WhatsApp |
| `tipoPessoa` | `string\|null` | `"F"` (fisica) ou `"J"` (juridica) |
| `tipoPrestador` | `string\|null` | Tipo do prestador |
| `cnpj` | `string\|null` | CNPJ (somente PJ) |
| `logradouro` | `string\|null` | Endereco completo (rua, numero, complemento) |
| `bairro` | `string\|null` | Bairro |
| `area` | `string\|null` | Area de atuacao (somente SulAmerica) |
| `cep` | `string\|null` | CEP |
| `cidade` | `string` | Cidade |
| `uf` | `string` | Estado (2 letras) |
| `latitude` | `string\|null` | Latitude (quando disponivel) |
| `longitude` | `string\|null` | Longitude (quando disponivel) |
| `especialidades` | `array` | Lista de especialidades (ver abaixo) |
| `possuiTituloEspecialidade` | `bool` | Possui titulo de especialista |
| `tituloEspecialista` | `bool` | Titulo de especialista |
| `mestrado` | `bool` | Possui mestrado |
| `residencia` | `bool` | Possui residencia |
| `doutoradoPosGraduacao` | `bool` | Possui doutorado/pos-graduacao |
| `posGraduadoLatoSenso` | `bool` | Pos-graduacao lato sensu |
| `acessibilidadeCadeirante` | `bool` | Acessibilidade para cadeirante |
| `programaAcreditacao` | `bool` | Programa de acreditacao |
| `qualidadeMonitorada` | `bool` | Qualidade monitorada |
| `comunicacaoEventosAdversos` | `bool` | Comunica eventos adversos |
| `certificacoesEntidadesGestoras` | `bool` | Certificacoes de entidades gestoras |
| `certificacaoIso9001` | `bool` | Certificacao ISO 9001 |
| `boaconsultaUrl` | `string\|null` | URL do perfil no BoaConsulta |

## Campo `especialidades`

A estrutura do array de especialidades varia por provedor:

### OdontoPrev

Retorna codigo numerico e descricao. Um dentista pode ter multiplas especialidades.

```json
{
  "especialidades": [
    {"codigoEspecialidade": 1, "descricaoEspecialidade": "Clinico Geral"},
    {"codigoEspecialidade": 9, "descricaoEspecialidade": " Odontopediatria"}
  ]
}
```

Codigos conhecidos:

| Codigo | Especialidade |
|---|---|
| 1 | Clinico Geral / Cirurgia |
| 2 | Dentistica |
| 3 | Endodontia |
| 4 | Periodontia |
| 5 | Cirurgia / Clinico Geral |
| 6 | Ortodontia |
| 9 | Odontopediatria |
| 11 | Ortopedia Func. dos Maxilares |
| 13 | Protese Dentaria |
| 14 | Radiologia |
| 15 | Estetica |
| 25 | Prevencao |

### Hapvida

Retorna codigo string e descricao. Geralmente uma especialidade por dentista.

```json
{
  "especialidades": [
    {"codigoEspecialidade": "522", "descricaoEspecialidade": "ODONTOLOGIA CLINICA"}
  ]
}
```

Codigos conhecidos:

| Codigo | Especialidade |
|---|---|
| 522 | Odontologia Clinica |
| 524 | Ortodontia |
| 525 | Periodontia |
| 526 | Endodontia |
| 527 | Cirurgia Odontologica |
| 528 | Odontopediatria |
| 530 | Protese Dentaria |
| 534 | Implantes Odonto |
| 999 | Radiologia |

### Amil

Retorna somente a descricao, sem codigo. Uma especialidade por dentista.

```json
{
  "especialidades": [
    {"descricaoEspecialidade": "CLINICA GERAL"}
  ]
}
```

### SulAmerica

Retorna somente a descricao, sem codigo. Pode ter multiplas (incluindo "Nao Disponivel").

```json
{
  "especialidades": [
    {"descricaoEspecialidade": "Clinica Geral"},
    {"descricaoEspecialidade": "Nao Disponivel"}
  ]
}
```

## Exemplos reais (dados do banco)

### OdontoPrev

```json
{
  "provider": "odontoprev",
  "externalId": "432615",
  "nome": "Marcela Maia Nader",
  "cro": "43528",
  "nomeFantasia": "MAIA ODONTOLOGIA",
  "email": "atendimento@marcelamaia.com",
  "telefone": "16 3761-4208",
  "whatsapp": "16999965777",
  "atendeWhatsapp": true,
  "tipoPessoa": "J",
  "tipoPrestador": "Clinica Odontologica - Pessoa Juridica",
  "cnpj": "38.225.972/0001-57",
  "logradouro": "Rua Carlos Gomes, 251",
  "bairro": "CENTRO",
  "cep": "14300-061",
  "cidade": "BATATAIS",
  "uf": "SP",
  "latitude": "-20.891278",
  "longitude": "-47.5820417",
  "especialidades": [
    {"codigoEspecialidade": 1, "descricaoEspecialidade": "Clinico Geral"},
    {"codigoEspecialidade": 9, "descricaoEspecialidade": " Odontopediatria"}
  ],
  "possuiTituloEspecialidade": false,
  "tituloEspecialista": false,
  "mestrado": false,
  "acessibilidadeCadeirante": false,
  "programaAcreditacao": false,
  "qualidadeMonitorada": false,
  "posGraduadoLatoSenso": false,
  "comunicacaoEventosAdversos": false,
  "certificacoesEntidadesGestoras": false,
  "certificacaoIso9001": false,
  "residencia": false,
  "doutoradoPosGraduacao": false,
  "boaconsultaUrl": null
}
```

### Hapvida

```json
{
  "provider": "hapvida",
  "externalId": "26103922810",
  "nome": "MICHELLE SALVADIO MOURA",
  "cro": "75866",
  "nomeFantasia": "MICHELLE SALVADIO MO",
  "email": null,
  "telefone": "(11) 4201-7406",
  "whatsapp": null,
  "atendeWhatsapp": false,
  "tipoPessoa": "F",
  "tipoPrestador": null,
  "cnpj": null,
  "logradouro": null,
  "bairro": "RECANTO PHRYNEA",
  "cep": "06437040",
  "cidade": "BARUERI",
  "uf": "SP",
  "latitude": null,
  "longitude": null,
  "especialidades": [
    {"codigoEspecialidade": "522", "descricaoEspecialidade": "ODONTOLOGIA CLINICA"}
  ],
  "possuiTituloEspecialidade": false,
  "tituloEspecialista": false,
  "mestrado": false,
  "acessibilidadeCadeirante": false,
  "programaAcreditacao": false,
  "qualidadeMonitorada": false,
  "posGraduadoLatoSenso": true,
  "comunicacaoEventosAdversos": false,
  "certificacoesEntidadesGestoras": false,
  "certificacaoIso9001": false,
  "residencia": false,
  "doutoradoPosGraduacao": false,
  "boaconsultaUrl": null
}
```

### Amil

```json
{
  "provider": "amil",
  "externalId": "68982798-1",
  "nome": "HELENA ZANETTI MOSCHIAR",
  "cro": "131304",
  "nomeFantasia": "HELENA ZANETTI MOSCHIAR",
  "email": "helenamoschiar@yahoo.com.br",
  "telefone": "16-37612733",
  "whatsapp": null,
  "atendeWhatsapp": false,
  "tipoPessoa": "F",
  "tipoPrestador": "D",
  "cnpj": null,
  "logradouro": "LG OFELIA BORGES SILVA ALVES, 25",
  "bairro": "CENTRO",
  "cep": "14300015",
  "cidade": "BATATAIS",
  "uf": "SP",
  "latitude": "-20.889406204224",
  "longitude": "-47.586986541748",
  "especialidades": [
    {"descricaoEspecialidade": "CLINICA GERAL"}
  ],
  "possuiTituloEspecialidade": false,
  "tituloEspecialista": false,
  "mestrado": false,
  "acessibilidadeCadeirante": false,
  "programaAcreditacao": false,
  "qualidadeMonitorada": false,
  "posGraduadoLatoSenso": false,
  "comunicacaoEventosAdversos": false,
  "certificacoesEntidadesGestoras": false,
  "certificacaoIso9001": false,
  "residencia": false,
  "doutoradoPosGraduacao": false,
  "boaconsultaUrl": null
}
```

### SulAmerica

```json
{
  "provider": "sulamerica",
  "externalId": "27968-1::CLINICA-GAHA",
  "nome": "Clinica Gaha",
  "cro": "19015",
  "nomeFantasia": "Clinica Gaha",
  "email": "cristianecoppio@hotmail.com",
  "telefone": "11 41934248 - 11 41931383",
  "whatsapp": null,
  "atendeWhatsapp": false,
  "tipoPessoa": "J",
  "tipoPrestador": null,
  "cnpj": "29905014000136",
  "logradouro": "Alameda Rio Negro 911 Conj 802",
  "bairro": "Alphaville Centro Industrial E Empr",
  "area": "Clinica Geral",
  "cep": "06454-000",
  "cidade": "Barueri",
  "uf": "SP",
  "latitude": null,
  "longitude": null,
  "especialidades": [
    {"descricaoEspecialidade": "Clinica Geral"},
    {"descricaoEspecialidade": "Nao Disponivel"}
  ],
  "possuiTituloEspecialidade": false,
  "tituloEspecialista": false,
  "mestrado": false,
  "acessibilidadeCadeirante": false,
  "programaAcreditacao": false,
  "qualidadeMonitorada": false,
  "posGraduadoLatoSenso": false,
  "comunicacaoEventosAdversos": false,
  "certificacoesEntidadesGestoras": false,
  "certificacaoIso9001": false,
  "residencia": false,
  "doutoradoPosGraduacao": false,
  "boaconsultaUrl": null
}
```

## Diferencas entre provedores

| Campo | OdontoPrev | Hapvida | Amil | SulAmerica |
|---|---|---|---|---|
| `especialidades[].codigoEspecialidade` | int | string | ausente | ausente |
| `especialidades[].descricaoEspecialidade` | presente | presente | presente | presente |
| `whatsapp` | preenchido | raro | raro | ausente |
| `latitude`/`longitude` | presente | ausente | presente | ausente |
| `email` | presente | raro | presente | presente |
| `area` | ausente | ausente | ausente | presente |
| `cnpj` | PJ | ausente | PJ | PJ |
| `tipoPessoa` | F/J | F/J | F/J | F/J |
| `logradouro` | completo | ausente | completo | completo |
| `boaconsultaUrl` | pode ter | ausente | ausente | ausente |
