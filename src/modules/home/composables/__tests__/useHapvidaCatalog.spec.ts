import { ref } from 'vue'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { getHapvidaCities, getHapvidaServices } from '../../api'
import { useHapvidaCatalog } from '..'

vi.mock('../../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api')>()

  return {
    ...actual,
    getHapvidaCities: vi.fn(),
    getHapvidaServices: vi.fn(),
  }
})

function createCatalog() {
  return useHapvidaCatalog({
    token: ref('token'),
    selectedProviders: ref(['hapvida']),
    selectedStateCode: ref('SP'),
    city: ref('Barueri'),
    clearLoadError: vi.fn(),
    handleLoadError: vi.fn(),
  })
}

describe('useHapvidaCatalog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('omits the default filters from the payload', () => {
    const catalog = createCatalog()

    expect(catalog.buildPayload()).toBeUndefined()
  })

  it('builds a compact payload with changed filters', () => {
    const catalog = createCatalog()

    catalog.form.tipoContrato = 'Empresarial'
    catalog.form.produto = 'Produto Premium'
    catalog.form.servico = 'Servico'
    catalog.form.especialidade = 'Ortodontia'
    catalog.form.bairro = 'Centro'

    expect(catalog.buildPayload({ forceRefresh: true })).toEqual({
      tipoContrato: 'Empresarial',
      produto: 'Produto Premium',
      servico: 'Servico',
      especialidade: 'Ortodontia',
      bairro: 'Centro',
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

  it('loads services after a matching city is loaded', async () => {
    vi.mocked(getHapvidaCities).mockResolvedValue([{ codigo: 'BARUERI', nome: 'Barueri' }])
    vi.mocked(getHapvidaServices).mockResolvedValue([{ codigo: 'CLINICA', nome: 'Clinica' }])

    const catalog = createCatalog()

    await catalog.loadCityOptions()

    expect(getHapvidaCities).toHaveBeenCalledWith(
      { produto: 'Personal Individual', uf: 'SP' },
      'token',
    )
    expect(getHapvidaServices).toHaveBeenCalledWith(
      {
        produto: 'Personal Individual',
        uf: 'SP',
        cidade: 'BARUERI',
      },
      'token',
    )
    expect(catalog.catalog.services).toEqual([{ codigo: 'CLINICA', nome: 'Clinica' }])
  })
})
