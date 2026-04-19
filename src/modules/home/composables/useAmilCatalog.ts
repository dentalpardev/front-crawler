import { computed, reactive, type Ref } from 'vue'

import type { CrawlProvider } from '@/shared/types'
import { trimValue } from '@/shared/utils'
import {
  getAmilCities,
  getAmilNeighborhoods,
  getAmilPlans,
  getAmilSpecialties,
  getAmilStates,
  type AmilPlanOption,
  type AmilProviderOptions,
  type SelectOption,
} from '../api'

export const DEFAULT_AMIL_CODIGO_REDE = '844'
export const DEFAULT_AMIL_PLAN_KEY = `${DEFAULT_AMIL_CODIGO_REDE}::`
export const DEFAULT_AMIL_BAIRRO = 'TODOS OS BAIRROS'
export const DEFAULT_AMIL_ESPECIALIDADE = 'CLINICA GERAL'

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

function createPlanKey(option: Pick<AmilPlanOption, 'codigoRede' | 'codigoPlano'>): string {
  return `${option.codigoRede}::${option.codigoPlano ?? ''}`
}

function formatPlanDisplay(option: Pick<AmilPlanOption, 'nome' | 'tipo' | 'linha'>): string {
  if (option.tipo === 'rede') {
    return `${option.nome} · Rede`
  }

  return option.linha ? `${option.nome} · ${option.linha}` : `${option.nome} · Plano`
}

function createDefaultPlan(): AmilPlanOption {
  return {
    codigoRede: DEFAULT_AMIL_CODIGO_REDE,
    codigoPlano: null,
    nome: 'Rede Amil Dental',
    operadora: null,
    linha: null,
    uri: null,
    tipo: 'rede',
    key: DEFAULT_AMIL_PLAN_KEY,
    displayName: 'Rede Amil Dental · Rede',
  }
}

export function useAmilCatalog(options: {
  token: Ref<string | null>
  selectedProviders: Ref<CrawlProvider[]>
  selectedStateCode: Ref<string>
  city: Ref<string>
  clearLoadError: () => void
  handleLoadError: (error: unknown, fallbackMessage: string) => Promise<void>
}) {
  const loading = reactive({
    plans: false,
    states: false,
    cities: false,
    neighborhoods: false,
    specialties: false,
  })

  const catalog = reactive({
    plans: [createDefaultPlan()] as AmilPlanOption[],
    states: [] as SelectOption[],
    cities: [] as SelectOption[],
    neighborhoods: [createOption(DEFAULT_AMIL_BAIRRO)] as SelectOption[],
    specialties: [createOption(DEFAULT_AMIL_ESPECIALIDADE)] as SelectOption[],
  })

  const form = reactive({
    selectedPlanKey: DEFAULT_AMIL_PLAN_KEY,
    bairro: DEFAULT_AMIL_BAIRRO,
    especialidade: DEFAULT_AMIL_ESPECIALIDADE,
  })

  const selectedPlan = computed(
    () => catalog.plans.find((option) => option.key === form.selectedPlanKey) ?? null,
  )

  const planSelectionOptions = computed(() =>
    catalog.plans.map((option) => ({
      key: option.key,
      label: option.displayName,
    })),
  )

  const isLoading = computed(() => Object.values(loading).some(Boolean))

  const isCityCompatible = computed(() => {
    if (
      !options.selectedProviders.value.includes('amil') ||
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

  function resetStatesAndBelow(): void {
    form.bairro = DEFAULT_AMIL_BAIRRO
    form.especialidade = DEFAULT_AMIL_ESPECIALIDADE
    catalog.states = []
    catalog.cities = []
    catalog.neighborhoods = [createOption(DEFAULT_AMIL_BAIRRO)]
    catalog.specialties = [createOption(DEFAULT_AMIL_ESPECIALIDADE)]
  }

  function resetCitiesAndBelow(): void {
    form.bairro = DEFAULT_AMIL_BAIRRO
    form.especialidade = DEFAULT_AMIL_ESPECIALIDADE
    catalog.cities = []
    catalog.neighborhoods = [createOption(DEFAULT_AMIL_BAIRRO)]
    catalog.specialties = [createOption(DEFAULT_AMIL_ESPECIALIDADE)]
  }

  function resetNeighborhoodsAndBelow(): void {
    form.bairro = DEFAULT_AMIL_BAIRRO
    form.especialidade = DEFAULT_AMIL_ESPECIALIDADE
    catalog.neighborhoods = [createOption(DEFAULT_AMIL_BAIRRO)]
    catalog.specialties = [createOption(DEFAULT_AMIL_ESPECIALIDADE)]
  }

  function resetSpecialties(): void {
    form.especialidade = DEFAULT_AMIL_ESPECIALIDADE
    catalog.specialties = [createOption(DEFAULT_AMIL_ESPECIALIDADE)]
  }

  function resetForm(): void {
    form.selectedPlanKey = DEFAULT_AMIL_PLAN_KEY
    form.bairro = DEFAULT_AMIL_BAIRRO
    form.especialidade = DEFAULT_AMIL_ESPECIALIDADE
  }

  async function loadPlanOptions(): Promise<void> {
    if (!options.token.value) {
      return
    }

    loading.plans = true
    options.clearLoadError()

    try {
      const plans = await getAmilPlans({}, options.token.value)

      catalog.plans = plans.map((option) => ({
        ...option,
        key: createPlanKey(option),
        displayName: formatPlanDisplay(option),
      }))
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar os catalogos da Amil.')
    } finally {
      loading.plans = false
    }
  }

  async function loadStateOptions(): Promise<void> {
    if (!options.token.value || !selectedPlan.value) {
      return
    }

    loading.states = true
    options.clearLoadError()

    try {
      catalog.states = await getAmilStates(
        {
          codigoRede: selectedPlan.value.codigoRede,
          codigoPlano: selectedPlan.value.codigoPlano ?? undefined,
        },
        options.token.value,
      )
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar as UFs da Amil.')
    } finally {
      loading.states = false
    }
  }

  async function loadCityOptions(): Promise<void> {
    if (!options.token.value || !selectedPlan.value || !options.selectedStateCode.value) {
      return
    }

    loading.cities = true
    options.clearLoadError()

    try {
      catalog.cities = await getAmilCities(
        {
          codigoRede: selectedPlan.value.codigoRede,
          codigoPlano: selectedPlan.value.codigoPlano ?? undefined,
          uf: options.selectedStateCode.value,
        },
        options.token.value,
      )

      if (getResolvedCity()) {
        await loadNeighborhoodOptions()
      }
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar os municipios da Amil.')
    } finally {
      loading.cities = false
    }
  }

  async function loadNeighborhoodOptions(): Promise<void> {
    if (!options.token.value || !selectedPlan.value || !options.selectedStateCode.value || !trimValue(options.city.value)) {
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
      catalog.neighborhoods = await getAmilNeighborhoods(
        {
          codigoRede: selectedPlan.value.codigoRede,
          codigoPlano: selectedPlan.value.codigoPlano ?? undefined,
          uf: options.selectedStateCode.value,
          cidade: resolvedCity,
        },
        options.token.value,
      )

      const defaultNeighborhood =
        catalog.neighborhoods.find((option) => normalizeCatalogValue(option.codigo) === 'TODOS OS BAIRROS') ??
        null

      if (!form.bairro && defaultNeighborhood) {
        form.bairro = defaultNeighborhood.codigo
      }
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar os bairros da Amil.')
    } finally {
      loading.neighborhoods = false
    }
  }

  async function loadSpecialtyOptions(): Promise<void> {
    if (
      !options.token.value ||
      !selectedPlan.value ||
      !options.selectedStateCode.value ||
      !trimValue(options.city.value) ||
      !form.bairro
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
      catalog.specialties = await getAmilSpecialties(
        {
          codigoRede: selectedPlan.value.codigoRede,
          codigoPlano: selectedPlan.value.codigoPlano ?? undefined,
          uf: options.selectedStateCode.value,
          cidade: resolvedCity,
          bairro: form.bairro,
          tipoServico: 'DENTAL',
        },
        options.token.value,
      )
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar as especialidades da Amil.')
    } finally {
      loading.specialties = false
    }
  }

  async function retryCatalog(): Promise<void> {
    await loadPlanOptions()

    if (selectedPlan.value) {
      await loadStateOptions()

      if (options.selectedStateCode.value) {
        await loadCityOptions()
      }
    }

    if (form.bairro) {
      await loadSpecialtyOptions()
    }
  }

  function buildPayload(options: { forceRefresh?: boolean } = {}): AmilProviderOptions | undefined {
    const payload: AmilProviderOptions = {}

    if (selectedPlan.value && form.selectedPlanKey !== DEFAULT_AMIL_PLAN_KEY) {
      payload.codigoRede = selectedPlan.value.codigoRede

      if (selectedPlan.value.codigoPlano) {
        payload.codigoPlano = selectedPlan.value.codigoPlano
      }
    } else if (form.selectedPlanKey && form.selectedPlanKey !== DEFAULT_AMIL_PLAN_KEY) {
      const [codigoRede, codigoPlano] = form.selectedPlanKey.split('::')
      payload.codigoRede = codigoRede

      if (codigoPlano) {
        payload.codigoPlano = codigoPlano
      }
    }

    if (form.bairro && form.bairro !== DEFAULT_AMIL_BAIRRO) {
      payload.bairro = form.bairro
    }

    if (form.especialidade && form.especialidade !== DEFAULT_AMIL_ESPECIALIDADE) {
      payload.especialidade = form.especialidade
    }

    if (options.forceRefresh) {
      payload.forceRefresh = true
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
    loadNeighborhoodOptions,
    loadPlanOptions,
    loadSpecialtyOptions,
    loadStateOptions,
    loading,
    planSelectionOptions,
    resetCitiesAndBelow,
    resetForm,
    resetNeighborhoodsAndBelow,
    resetSpecialties,
    resetStatesAndBelow,
    retryCatalog,
    selectedPlan,
  }
}
