import { ref } from 'vue'

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getSulamericaCities,
  getSulamericaHours,
  getSulamericaPlans,
  getSulamericaProducts,
} from '../../api'
import { useSulamericaCatalog } from '..'

vi.mock('../../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api')>()

  return {
    ...actual,
    getSulamericaCities: vi.fn(),
    getSulamericaHours: vi.fn(),
    getSulamericaPlans: vi.fn(),
    getSulamericaProducts: vi.fn(),
  }
})

function createCatalog() {
  return useSulamericaCatalog({
    token: ref('token'),
    selectedProviders: ref(['sulamerica']),
    selectedStateCode: ref('SP'),
    city: ref('Sao Paulo'),
    clearLoadError: vi.fn(),
    handleLoadError: vi.fn(),
  })
}

describe('useSulamericaCatalog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('omits default product and plan from the payload', () => {
    const catalog = createCatalog()

    expect(catalog.buildPayload()).toBeUndefined()
  })

  it('builds a compact payload with changed filters', () => {
    const catalog = createCatalog()

    catalog.form.produto = '200'
    catalog.form.plano = 'Plano Plus'
    catalog.form.horarioInicial = '08:00'
    catalog.form.horarioFinal = '12:00'

    expect(catalog.buildPayload({ forceRefresh: true })).toEqual({
      produto: '200',
      plano: 'Plano Plus',
      horarioInicial: '08:00',
      horarioFinal: '12:00',
      forceRefresh: true,
    })
  })

  it('checks city compatibility against loaded city codes', () => {
    const catalog = createCatalog()

    catalog.catalog.cities = [{ codigo: 'SAO PAULO', nome: 'Sao Paulo' }]

    expect(catalog.isCityCompatible.value).toBe(true)

    catalog.catalog.cities = [{ codigo: 'BARUERI', nome: 'Barueri' }]

    expect(catalog.isCityCompatible.value).toBe(false)
  })

  it('loads forced products and hours during retry', async () => {
    vi.mocked(getSulamericaProducts).mockResolvedValue([{ codigo: '100', nome: 'Odonto Individual' }])
    vi.mocked(getSulamericaHours).mockResolvedValue([{ codigo: '08:00', nome: '08:00' }])
    vi.mocked(getSulamericaPlans).mockResolvedValue([{ codigo: 'Odonto Mais', nome: 'Odonto Mais' }])
    vi.mocked(getSulamericaCities).mockResolvedValue([{ codigo: 'SAO PAULO', nome: 'Sao Paulo' }])

    const catalog = createCatalog()

    await catalog.retryCatalog()

    expect(getSulamericaProducts).toHaveBeenCalledWith('token')
    expect(getSulamericaHours).toHaveBeenCalledWith('token')
    expect(getSulamericaCities).toHaveBeenCalledWith(
      {
        uf: 'SP',
        produto: '100',
        plano: 'Odonto Mais',
      },
      'token',
    )
  })
})
