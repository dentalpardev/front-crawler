import { reactive, ref, type Ref } from 'vue'

import { trimValue } from '@/shared/utils'
import {
  getOdontoprevFilters,
  type OdontoprevProviderOptions,
  type SelectOption,
} from '../api'

export const DEFAULT_ODONTOPREV_REDE = '241008130'

export function useOdontoprevCatalog(options: {
  token: Ref<string | null>
  clearLoadError: () => void
  handleLoadError: (error: unknown, fallbackMessage: string) => Promise<void>
}) {
  const isLoadingFilters = ref(false)

  const catalog = reactive({
    loaded: false,
    redes: [{ codigo: DEFAULT_ODONTOPREV_REDE, nome: 'Rede Unna' }] as SelectOption[],
    planos: [] as SelectOption[],
    especialidades: [] as SelectOption[],
  })

  const form = reactive({
    codigoRede: DEFAULT_ODONTOPREV_REDE,
    codigoPlano: '',
    codigoEspecialidade: '',
    isEspecialista: false,
    isAtendeWhatsApp: false,
    nomeDentista: '',
    acessibilidade: false,
    idioma: '',
  })

  function resetForm(): void {
    form.codigoRede = DEFAULT_ODONTOPREV_REDE
    form.codigoPlano = ''
    form.codigoEspecialidade = ''
    form.isEspecialista = false
    form.isAtendeWhatsApp = false
    form.nomeDentista = ''
    form.acessibilidade = false
    form.idioma = ''
  }

  function handleNetworkChange(value: string | null): void {
    form.codigoRede = value ?? ''

    if (form.codigoRede) {
      form.codigoPlano = ''
    }
  }

  function handlePlanChange(value: string | null): void {
    form.codigoPlano = value ?? ''

    if (form.codigoPlano) {
      form.codigoRede = ''
    }
  }

  function getSelectionError(): string {
    if (form.codigoRede && form.codigoPlano) {
      return 'Selecione rede ou plano, nao os dois.'
    }

    return ''
  }

  async function loadCatalog(force = false): Promise<void> {
    if (!options.token.value || (!force && (isLoadingFilters.value || catalog.loaded))) {
      return
    }

    isLoadingFilters.value = true
    options.clearLoadError()

    try {
      const response = await getOdontoprevFilters(options.token.value)

      catalog.redes = response.redes
      catalog.planos = response.planos
      catalog.especialidades = response.especialidades
      catalog.loaded = true
    } catch (error) {
      await options.handleLoadError(error, 'Nao foi possivel carregar os filtros da OdontoPrev.')
    } finally {
      isLoadingFilters.value = false
    }
  }

  function buildPayload(options: { forceRefresh?: boolean } = {}): OdontoprevProviderOptions | undefined {
    const payload: OdontoprevProviderOptions = {}

    if (form.codigoPlano) {
      payload.codigoPlano = form.codigoPlano
    } else if (form.codigoRede && form.codigoRede !== DEFAULT_ODONTOPREV_REDE) {
      payload.codigoRede = form.codigoRede
    }

    if (options.forceRefresh) {
      payload.forceRefresh = true
    }

    if (form.codigoEspecialidade) {
      payload.codigoEspecialidade = form.codigoEspecialidade
    }

    if (form.isEspecialista) {
      payload.isEspecialista = true
    }

    if (form.isAtendeWhatsApp) {
      payload.isAtendeWhatsApp = true
    }

    if (trimValue(form.nomeDentista)) {
      payload.nomeDentista = trimValue(form.nomeDentista)
    }

    if (form.acessibilidade) {
      payload.acessibilidade = 'S'
    }

    if (trimValue(form.idioma)) {
      payload.idioma = trimValue(form.idioma)
    }

    return Object.keys(payload).length > 0 ? payload : undefined
  }

  return {
    buildPayload,
    catalog,
    form,
    getSelectionError,
    handleNetworkChange,
    handlePlanChange,
    isLoadingFilters,
    loadCatalog,
    resetForm,
  }
}
