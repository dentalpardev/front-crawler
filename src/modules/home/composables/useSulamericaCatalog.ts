import { computed, reactive, type Ref } from 'vue'

import type { CrawlProvider } from '@/shared/types'
import { trimValue } from '@/shared/utils'
import {
  getSulamericaCities,
  getSulamericaHours,
  getSulamericaPlans,
  getSulamericaProducts,
  type SelectOption,
  type SulamericaProviderOptions,
} from '../api'

export const DEFAULT_SULAMERICA_PRODUTO = '100'
export const DEFAULT_SULAMERICA_PLANO = 'Odonto Mais'

function normalizeCatalogValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase()
}

export function useSulamericaCatalog(options: {
  token: Ref<string | null>
  selectedProviders: Ref<CrawlProvider[]>
  selectedStateCode: Ref<string>
  city: Ref<string>
  clearLoadError: () => void
  handleLoadError: (error: unknown, fallbackMessage: string) => Promise<void>
}) {
  const loading = reactive({
    products: false,
    plans: false,
    cities: false,
    hours: false,
  })

  const catalog = reactive({
    products: [{ codigo: DEFAULT_SULAMERICA_PRODUTO, nome: 'Odonto Individual' }] as SelectOption[],
    plans: [{ codigo: DEFAULT_SULAMERICA_PLANO, nome: DEFAULT_SULAMERICA_PLANO }] as SelectOption[],
    cities: [] as SelectOption[],
    hours: [] as SelectOption[],
  })

  const form = reactive({
    produto: DEFAULT_SULAMERICA_PRODUTO,
    plano: DEFAULT_SULAMERICA_PLANO,
    horarioInicial: '',
    horarioFinal: '',
  })

  const isLoading = computed(() => Object.values(loading).some(Boolean))

  const isCityCompatible = computed(() => {
    if (
      !options.selectedProviders.value.includes('sulamerica') ||
      !trimValue(options.city.value) ||
      catalog.cities.length === 0
    ) {
      return true
    }

    const currentCity = normalizeCatalogValue(options.city.value)

    return catalog.cities.some((option) => normalizeCatalogValue(option.codigo) === currentCity)
  })

  function resetPlansAndBelow(): void {
    form.plano = DEFAULT_SULAMERICA_PLANO
    catalog.plans = [{ codigo: DEFAULT_SULAMERICA_PLANO, nome: DEFAULT_SULAMERICA_PLANO }]
    catalog.cities = []
  }

  function resetCitiesAndBelow(): void {
    catalog.cities = []
  }

  function resetForm(): void {
    form.produto = DEFAULT_SULAMERICA_PRODUTO
    form.plano = DEFAULT_SULAMERICA_PLANO
    form.horarioInicial = ''
    form.horarioFinal = ''
  }

  async function loadProductOptions(force = false): Promise<void> {
    if (!options.token.value || (!force && (loading.products || catalog.products.length > 0))) {
      return
    }

    loading.products = true
    options.clearLoadError()

    try {
      catalog.products = await getSulamericaProducts(options.token.value)
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar os produtos da SulAmerica.')
    } finally {
      loading.products = false
    }
  }

  async function loadHourOptions(force = false): Promise<void> {
    if (!options.token.value || (!force && (loading.hours || catalog.hours.length > 0))) {
      return
    }

    loading.hours = true
    options.clearLoadError()

    try {
      catalog.hours = await getSulamericaHours(options.token.value)
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar os horarios da SulAmerica.')
    } finally {
      loading.hours = false
    }
  }

  async function loadPlanOptions(): Promise<void> {
    if (!options.token.value || !form.produto) {
      return
    }

    loading.plans = true
    options.clearLoadError()

    try {
      catalog.plans = await getSulamericaPlans({ produto: form.produto }, options.token.value)
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar os planos da SulAmerica.')
    } finally {
      loading.plans = false
    }
  }

  async function loadCityOptions(): Promise<void> {
    if (!options.token.value || !options.selectedStateCode.value || !form.produto || !form.plano) {
      return
    }

    loading.cities = true
    options.clearLoadError()

    try {
      catalog.cities = await getSulamericaCities(
        {
          uf: options.selectedStateCode.value,
          produto: form.produto,
          plano: form.plano,
        },
        options.token.value,
      )
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar as cidades da SulAmerica.')
    } finally {
      loading.cities = false
    }
  }

  async function retryCatalog(): Promise<void> {
    await Promise.all([loadProductOptions(true), loadHourOptions(true)])

    if (form.produto) {
      await loadPlanOptions()
    }

    if (form.plano && options.selectedStateCode.value) {
      await loadCityOptions()
    }
  }

  function buildPayload(options: { forceRefresh?: boolean } = {}): SulamericaProviderOptions | undefined {
    const payload: SulamericaProviderOptions = {
      ...(form.produto && form.produto !== DEFAULT_SULAMERICA_PRODUTO ? { produto: form.produto } : {}),
      ...(form.plano && form.plano !== DEFAULT_SULAMERICA_PLANO ? { plano: form.plano } : {}),
      ...(form.horarioInicial ? { horarioInicial: form.horarioInicial } : {}),
      ...(form.horarioFinal ? { horarioFinal: form.horarioFinal } : {}),
      ...(options.forceRefresh ? { forceRefresh: true } : {}),
    }

    return Object.keys(payload).length > 0 ? payload : undefined
  }

  return {
    buildPayload,
    catalog,
    form,
    isCityCompatible,
    isLoading,
    loadCityOptions,
    loadHourOptions,
    loadPlanOptions,
    loadProductOptions,
    loading,
    resetCitiesAndBelow,
    resetForm,
    resetPlansAndBelow,
    retryCatalog,
  }
}
