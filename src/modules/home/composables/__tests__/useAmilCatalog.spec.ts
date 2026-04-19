import { ref } from 'vue'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { getAmilCities, getAmilNeighborhoods, getAmilPlans } from '../../api'
import { useAmilCatalog } from '..'

vi.mock('../../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api')>()

  return {
    ...actual,
    getAmilCities: vi.fn(),
    getAmilNeighborhoods: vi.fn(),
    getAmilPlans: vi.fn(),
  }
})

function createCatalog() {
  return useAmilCatalog({
    token: ref('token'),
    selectedProviders: ref(['amil']),
    selectedStateCode: ref('SP'),
    city: ref('Barueri'),
    clearLoadError: vi.fn(),
    handleLoadError: vi.fn(),
  })
}

describe('useAmilCatalog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('omits default filters from the payload', () => {
    const catalog = createCatalog()

    expect(catalog.buildPayload()).toBeUndefined()
  })

  it('builds a compact payload with selected plan and changed filters', () => {
    const catalog = createCatalog()

    catalog.catalog.plans = [
      {
        codigoRede: '900',
        codigoPlano: '123',
        nome: 'Plano Dental',
        operadora: null,
        linha: 'Plus',
        uri: null,
        tipo: 'plano',
        key: '900::123',
        displayName: 'Plano Dental · Plus',
      },
    ]
    catalog.form.selectedPlanKey = '900::123'
    catalog.form.bairro = 'Centro'
    catalog.form.especialidade = 'ORTODONTIA'

    expect(catalog.buildPayload({ forceRefresh: true })).toEqual({
      codigoRede: '900',
      codigoPlano: '123',
      bairro: 'Centro',
      especialidade: 'ORTODONTIA',
      forceRefresh: true,
    })
  })

  it('checks city compatibility against loaded city options', () => {
    const catalog = createCatalog()

    catalog.catalog.cities = [{ codigo: 'BARUERI', nome: 'Barueri' }]

    expect(catalog.isCityCompatible.value).toBe(true)

    catalog.catalog.cities = [{ codigo: 'SAO PAULO', nome: 'Sao Paulo' }]

    expect(catalog.isCityCompatible.value).toBe(false)
  })

  it('maps plans and loads neighborhoods after a matching city is loaded', async () => {
    vi.mocked(getAmilPlans).mockResolvedValue([
      {
        codigoRede: '900',
        codigoPlano: null,
        nome: 'Rede Teste',
        operadora: null,
        linha: null,
        uri: null,
        tipo: 'rede',
      },
    ])
    vi.mocked(getAmilCities).mockResolvedValue([{ codigo: 'BARUERI', nome: 'Barueri' }])
    vi.mocked(getAmilNeighborhoods).mockResolvedValue([{ codigo: 'CENTRO', nome: 'Centro' }])

    const catalog = createCatalog()

    await catalog.loadPlanOptions()
    catalog.form.selectedPlanKey = '900::'
    await catalog.loadCityOptions()

    expect(catalog.planSelectionOptions.value).toEqual([
      { key: '900::', label: 'Rede Teste · Rede' },
    ])
    expect(getAmilCities).toHaveBeenCalledWith(
      {
        codigoRede: '900',
        codigoPlano: undefined,
        uf: 'SP',
      },
      'token',
    )
    expect(getAmilNeighborhoods).toHaveBeenCalledWith(
      {
        codigoRede: '900',
        codigoPlano: undefined,
        uf: 'SP',
        cidade: 'BARUERI',
      },
      'token',
    )
    expect(catalog.catalog.neighborhoods).toEqual([{ codigo: 'CENTRO', nome: 'Centro' }])
  })
})
