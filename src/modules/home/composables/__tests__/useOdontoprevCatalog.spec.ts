import { ref } from 'vue'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { getOdontoprevFilters } from '../../api'
import { DEFAULT_ODONTOPREV_REDE, useOdontoprevCatalog } from '..'

vi.mock('../../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api')>()

  return {
    ...actual,
    getOdontoprevFilters: vi.fn(),
  }
})

function createCatalog() {
  return useOdontoprevCatalog({
    token: ref('token'),
    clearLoadError: vi.fn(),
    handleLoadError: vi.fn(),
  })
}

describe('useOdontoprevCatalog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('keeps network and plan mutually exclusive', () => {
    const catalog = createCatalog()

    catalog.handlePlanChange('plan-1')

    expect(catalog.form.codigoPlano).toBe('plan-1')
    expect(catalog.form.codigoRede).toBe('')

    catalog.handleNetworkChange('network-1')

    expect(catalog.form.codigoRede).toBe('network-1')
    expect(catalog.form.codigoPlano).toBe('')
  })

  it('builds a compact payload from selected filters', () => {
    const catalog = createCatalog()

    catalog.handleNetworkChange('network-2')
    catalog.form.codigoEspecialidade = 'specialty-1'
    catalog.form.isEspecialista = true
    catalog.form.isAtendeWhatsApp = true
    catalog.form.nomeDentista = '  Maria Silva  '
    catalog.form.acessibilidade = true
    catalog.form.idioma = '  ingles  '

    expect(catalog.buildPayload({ forceRefresh: true })).toEqual({
      codigoRede: 'network-2',
      forceRefresh: true,
      codigoEspecialidade: 'specialty-1',
      isEspecialista: true,
      isAtendeWhatsApp: true,
      nomeDentista: 'Maria Silva',
      acessibilidade: 'S',
      idioma: 'ingles',
    })
  })

  it('omits the default network when no optional filters changed', () => {
    const catalog = createCatalog()

    expect(catalog.form.codigoRede).toBe(DEFAULT_ODONTOPREV_REDE)
    expect(catalog.buildPayload()).toBeUndefined()
  })

  it('loads catalog options once unless forced', async () => {
    vi.mocked(getOdontoprevFilters).mockResolvedValue({
      redes: [{ codigo: 'rede-1', nome: 'Rede 1' }],
      planos: [{ codigo: 'plano-1', nome: 'Plano 1' }],
      especialidades: [{ codigo: 'esp-1', nome: 'Especialidade 1' }],
      planosPorCodigo: {},
    })

    const clearLoadError = vi.fn()
    const handleLoadError = vi.fn()
    const catalog = useOdontoprevCatalog({
      token: ref('token'),
      clearLoadError,
      handleLoadError,
    })

    await catalog.loadCatalog()
    await catalog.loadCatalog()
    await catalog.loadCatalog(true)

    expect(getOdontoprevFilters).toHaveBeenCalledTimes(2)
    expect(clearLoadError).toHaveBeenCalledTimes(2)
    expect(handleLoadError).not.toHaveBeenCalled()
    expect(catalog.catalog.redes).toEqual([{ codigo: 'rede-1', nome: 'Rede 1' }])
  })
})
