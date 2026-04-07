export type MunicipalityOption = {
  code: string
  name: string
}

type IbgeMunicipalityResponse = {
  id?: number
  nome?: string
}

const IBGE_LOCATIONS_API_BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades'

function normalizeMunicipalityOptions(data: unknown): MunicipalityOption[] {
  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map((item) => {
      const municipality = item as IbgeMunicipalityResponse

      if (!municipality?.nome) {
        return null
      }

      return {
        code: String(municipality.id ?? municipality.nome),
        name: municipality.nome,
      }
    })
    .filter((item): item is MunicipalityOption => Boolean(item))
}

export async function getMunicipalitiesByState(stateCode: string) {
  const response = await fetch(
    `${IBGE_LOCATIONS_API_BASE_URL}/estados/${stateCode}/municipios?orderBy=nome`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar os municipios desta UF.')
  }

  const data = await response.json()

  return normalizeMunicipalityOptions(data)
}
