import { computed, reactive, type Ref } from 'vue'

import type { CrawlProvider } from '@/shared/types'
import { trimValue } from '@/shared/utils'
import {
  getHapvidaCities,
  getHapvidaContractTypes,
  getHapvidaNeighborhoods,
  getHapvidaProducts,
  getHapvidaServices,
  getHapvidaSpecialties,
  getHapvidaStates,
  type HapvidaProviderOptions,
  type SelectOption,
} from '../api'

export const DEFAULT_HAPVIDA_TIPO_CONTRATO = 'Individual/Familiar'
export const DEFAULT_HAPVIDA_PRODUTO = 'Personal Individual'
export const DEFAULT_HAPVIDA_SERVICO = 'CONSULTORIOS/CLINICAS'
export const DEFAULT_HAPVIDA_ESPECIALIDADE = 'Odontologia Clinica'
export const DEFAULT_HAPVIDA_BAIRRO = 'TODOS OS BAIRROS'

function createOption(value: string): SelectOption {
  return { codigo: value, nome: value }
}

function normalizeCatalogValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase()
}

function findMatchingCatalogOption(options: SelectOption[], value: string): SelectOption | null {
  const normalizedValue = normalizeCatalogValue(value)

  return (
    options.find(
      (option) =>
        normalizeCatalogValue(option.codigo) === normalizedValue ||
        normalizeCatalogValue(option.nome) === normalizedValue,
    ) ?? null
  )
}

export function useHapvidaCatalog(options: {
  token: Ref<string | null>
  selectedProviders: Ref<CrawlProvider[]>
  selectedStateCode: Ref<string>
  city: Ref<string>
  clearLoadError: () => void
  handleLoadError: (error: unknown, fallbackMessage: string) => Promise<void>
}) {
  const loading = reactive({
    contractTypes: false,
    products: false,
    states: false,
    cities: false,
    services: false,
    specialties: false,
    neighborhoods: false,
  })

  const catalog = reactive({
    contractTypes: [createOption(DEFAULT_HAPVIDA_TIPO_CONTRATO)] as SelectOption[],
    products: [createOption(DEFAULT_HAPVIDA_PRODUTO)] as SelectOption[],
    states: [] as SelectOption[],
    cities: [] as SelectOption[],
    services: [createOption(DEFAULT_HAPVIDA_SERVICO)] as SelectOption[],
    specialties: [createOption(DEFAULT_HAPVIDA_ESPECIALIDADE)] as SelectOption[],
    neighborhoods: [createOption(DEFAULT_HAPVIDA_BAIRRO)] as SelectOption[],
  })

  const form = reactive({
    tipoContrato: DEFAULT_HAPVIDA_TIPO_CONTRATO,
    produto: DEFAULT_HAPVIDA_PRODUTO,
    servico: DEFAULT_HAPVIDA_SERVICO,
    especialidade: DEFAULT_HAPVIDA_ESPECIALIDADE,
    bairro: DEFAULT_HAPVIDA_BAIRRO,
  })

  const isLoading = computed(() => Object.values(loading).some(Boolean))

  const isCityCompatible = computed(() => {
    if (
      !options.selectedProviders.value.includes('hapvida') ||
      !trimValue(options.city.value) ||
      catalog.cities.length === 0
    ) {
      return true
    }

    return Boolean(findMatchingCatalogOption(catalog.cities, options.city.value))
  })

  function getResolvedCity(): string {
    const currentCity = trimValue(options.city.value)

    if (!currentCity) {
      return ''
    }

    if (catalog.cities.length === 0) {
      return currentCity
    }

    return findMatchingCatalogOption(catalog.cities, currentCity)?.codigo ?? ''
  }

  function resetProductsAndBelow(): void {
    form.produto = DEFAULT_HAPVIDA_PRODUTO
    form.servico = DEFAULT_HAPVIDA_SERVICO
    form.especialidade = DEFAULT_HAPVIDA_ESPECIALIDADE
    form.bairro = DEFAULT_HAPVIDA_BAIRRO
    catalog.products = [createOption(DEFAULT_HAPVIDA_PRODUTO)]
    catalog.states = []
    catalog.cities = []
    catalog.services = [createOption(DEFAULT_HAPVIDA_SERVICO)]
    catalog.specialties = [createOption(DEFAULT_HAPVIDA_ESPECIALIDADE)]
    catalog.neighborhoods = [createOption(DEFAULT_HAPVIDA_BAIRRO)]
  }

  function resetStatesAndBelow(): void {
    form.servico = DEFAULT_HAPVIDA_SERVICO
    form.especialidade = DEFAULT_HAPVIDA_ESPECIALIDADE
    form.bairro = DEFAULT_HAPVIDA_BAIRRO
    catalog.states = []
    catalog.cities = []
    catalog.services = [createOption(DEFAULT_HAPVIDA_SERVICO)]
    catalog.specialties = [createOption(DEFAULT_HAPVIDA_ESPECIALIDADE)]
    catalog.neighborhoods = [createOption(DEFAULT_HAPVIDA_BAIRRO)]
  }

  function resetServicesAndBelow(): void {
    form.servico = DEFAULT_HAPVIDA_SERVICO
    form.especialidade = DEFAULT_HAPVIDA_ESPECIALIDADE
    form.bairro = DEFAULT_HAPVIDA_BAIRRO
    catalog.services = [createOption(DEFAULT_HAPVIDA_SERVICO)]
    catalog.specialties = [createOption(DEFAULT_HAPVIDA_ESPECIALIDADE)]
    catalog.neighborhoods = [createOption(DEFAULT_HAPVIDA_BAIRRO)]
  }

  function resetSpecialtiesAndBelow(): void {
    form.especialidade = DEFAULT_HAPVIDA_ESPECIALIDADE
    form.bairro = DEFAULT_HAPVIDA_BAIRRO
    catalog.specialties = [createOption(DEFAULT_HAPVIDA_ESPECIALIDADE)]
    catalog.neighborhoods = [createOption(DEFAULT_HAPVIDA_BAIRRO)]
  }

  function resetNeighborhoods(): void {
    form.bairro = DEFAULT_HAPVIDA_BAIRRO
    catalog.neighborhoods = [createOption(DEFAULT_HAPVIDA_BAIRRO)]
  }

  function resetForm(): void {
    form.tipoContrato = DEFAULT_HAPVIDA_TIPO_CONTRATO
    form.produto = DEFAULT_HAPVIDA_PRODUTO
    form.servico = DEFAULT_HAPVIDA_SERVICO
    form.especialidade = DEFAULT_HAPVIDA_ESPECIALIDADE
    form.bairro = DEFAULT_HAPVIDA_BAIRRO
  }

  async function loadContractTypeOptions(force = false): Promise<void> {
    if (!options.token.value || (!force && (loading.contractTypes || catalog.contractTypes.length > 0))) {
      return
    }

    loading.contractTypes = true
    options.clearLoadError()

    try {
      catalog.contractTypes = await getHapvidaContractTypes(options.token.value)
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar os filtros da Hapvida.')
    } finally {
      loading.contractTypes = false
    }
  }

  async function loadProductsOptions(): Promise<void> {
    if (!options.token.value || !form.tipoContrato) {
      return
    }

    loading.products = true
    options.clearLoadError()

    try {
      catalog.products = await getHapvidaProducts({ tipoContrato: form.tipoContrato }, options.token.value)
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar os produtos da Hapvida.')
    } finally {
      loading.products = false
    }
  }

  async function loadStateOptions(): Promise<void> {
    if (!options.token.value || !form.produto) {
      return
    }

    loading.states = true
    options.clearLoadError()

    try {
      catalog.states = await getHapvidaStates({ produto: form.produto }, options.token.value)
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar as UFs da Hapvida.')
    } finally {
      loading.states = false
    }
  }

  async function loadCityOptions(): Promise<void> {
    if (!options.token.value || !form.produto || !options.selectedStateCode.value) {
      return
    }

    loading.cities = true
    options.clearLoadError()

    try {
      catalog.cities = await getHapvidaCities(
        { produto: form.produto, uf: options.selectedStateCode.value },
        options.token.value,
      )

      if (getResolvedCity()) {
        await loadServiceOptions()
      }
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar as cidades da Hapvida.')
    } finally {
      loading.cities = false
    }
  }

  async function loadServiceOptions(): Promise<void> {
    if (!options.token.value || !form.produto || !options.selectedStateCode.value || !trimValue(options.city.value)) {
      return
    }

    const resolvedCity = getResolvedCity()

    if (!resolvedCity) {
      catalog.services = []
      return
    }

    loading.services = true
    options.clearLoadError()

    try {
      catalog.services = await getHapvidaServices(
        {
          produto: form.produto,
          uf: options.selectedStateCode.value,
          cidade: resolvedCity,
        },
        options.token.value,
      )
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar os servicos da Hapvida.')
    } finally {
      loading.services = false
    }
  }

  async function loadSpecialtyOptions(): Promise<void> {
    if (
      !options.token.value ||
      !form.produto ||
      !options.selectedStateCode.value ||
      !trimValue(options.city.value) ||
      !form.servico
    ) {
      return
    }

    const resolvedCity = getResolvedCity()

    if (!resolvedCity) {
      catalog.specialties = []
      return
    }

    loading.specialties = true
    options.clearLoadError()

    try {
      catalog.specialties = await getHapvidaSpecialties(
        {
          produto: form.produto,
          uf: options.selectedStateCode.value,
          cidade: resolvedCity,
          servico: form.servico,
        },
        options.token.value,
      )
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar as especialidades da Hapvida.')
    } finally {
      loading.specialties = false
    }
  }

  async function loadNeighborhoodOptions(): Promise<void> {
    if (
      !options.token.value ||
      !form.produto ||
      !options.selectedStateCode.value ||
      !trimValue(options.city.value) ||
      !form.servico ||
      !form.especialidade
    ) {
      return
    }

    const resolvedCity = getResolvedCity()

    if (!resolvedCity) {
      catalog.neighborhoods = []
      return
    }

    loading.neighborhoods = true
    options.clearLoadError()

    try {
      catalog.neighborhoods = await getHapvidaNeighborhoods(
        {
          produto: form.produto,
          uf: options.selectedStateCode.value,
          cidade: resolvedCity,
          servico: form.servico,
          especialidade: form.especialidade,
        },
        options.token.value,
      )
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar os bairros da Hapvida.')
    } finally {
      loading.neighborhoods = false
    }
  }

  async function retryCatalog(): Promise<void> {
    await loadContractTypeOptions(true)

    if (form.tipoContrato) {
      await loadProductsOptions()
    }

    if (form.produto) {
      await loadStateOptions()

      if (options.selectedStateCode.value) {
        await loadCityOptions()
      }
    }

    if (form.servico) {
      await loadSpecialtyOptions()
    }

    if (form.especialidade) {
      await loadNeighborhoodOptions()
    }
  }

  function buildPayload(options: { forceRefresh?: boolean } = {}): HapvidaProviderOptions | undefined {
    const payload: HapvidaProviderOptions = {
      ...(form.tipoContrato && form.tipoContrato !== DEFAULT_HAPVIDA_TIPO_CONTRATO
        ? { tipoContrato: form.tipoContrato }
        : {}),
      ...(form.produto && form.produto !== DEFAULT_HAPVIDA_PRODUTO ? { produto: form.produto } : {}),
      ...(form.servico && form.servico !== DEFAULT_HAPVIDA_SERVICO ? { servico: form.servico } : {}),
      ...(form.especialidade && form.especialidade !== DEFAULT_HAPVIDA_ESPECIALIDADE
        ? { especialidade: form.especialidade }
        : {}),
      ...(form.bairro && form.bairro !== DEFAULT_HAPVIDA_BAIRRO ? { bairro: form.bairro } : {}),
      ...(options.forceRefresh ? { forceRefresh: true } : {}),
    }

    return Object.keys(payload).length > 0 ? payload : undefined
  }

  return {
    buildPayload,
    catalog,
    form,
    getResolvedCity,
    isCityCompatible,
    isLoading,
    loadCityOptions,
    loadContractTypeOptions,
    loadNeighborhoodOptions,
    loadProductsOptions,
    loadServiceOptions,
    loadSpecialtyOptions,
    loadStateOptions,
    loading,
    resetForm,
    resetNeighborhoods,
    resetProductsAndBelow,
    resetServicesAndBelow,
    resetSpecialtiesAndBelow,
    resetStatesAndBelow,
    retryCatalog,
  }
}
