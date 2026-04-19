<script setup lang="ts">
import { computed } from 'vue'

import Card from 'primevue/card'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Tag from 'primevue/tag'

import type { SelectOption } from '../api'
import ProviderLoadErrorMessage from './ProviderLoadErrorMessage.vue'

type SulamericaLoadingState = {
  products: boolean
  plans: boolean
  cities: boolean
  hours: boolean
}

type SulamericaErrors = Partial<Record<'produto' | 'plano', string>>

const props = defineProps<{
  cities: SelectOption[]
  errors: SulamericaErrors
  horarioFinal: string
  horarioInicial: string
  hours: SelectOption[]
  isCityCompatible: boolean
  isRetrying: boolean
  loadError: string
  loading: SulamericaLoadingState
  plano: string
  plans: SelectOption[]
  produto: string
  products: SelectOption[]
}>()

const emit = defineEmits<{
  retry: []
  'update:horarioFinal': [value: string]
  'update:horarioInicial': [value: string]
  'update:plano': [value: string]
  'update:produto': [value: string]
}>()

const produtoModel = computed({
  get: () => props.produto,
  set: (value: string) => emit('update:produto', value),
})

const planoModel = computed({
  get: () => props.plano,
  set: (value: string) => emit('update:plano', value),
})

const horarioInicialModel = computed({
  get: () => props.horarioInicial,
  set: (value: string) => emit('update:horarioInicial', value),
})

const horarioFinalModel = computed({
  get: () => props.horarioFinal,
  set: (value: string) => emit('update:horarioFinal', value),
})

const showCityWarning = computed(
  () => !props.loadError && props.cities.length > 0 && !props.isCityCompatible,
)

const hasErrors = computed(() => Object.keys(props.errors).length > 0)
</script>

<template>
  <Card class="provider-panel">
    <template #content>
      <div class="provider-panel-body">
        <div class="provider-panel-header">
          <div>
            <h2>Filtros SulAmerica</h2>
            <p>
              Escolha produto e plano e, se quiser, refine apenas a janela de horario. Municipio e
              UF continuam vindo do topo.
            </p>
          </div>
          <Tag class="provider-tone--sulamerica" rounded severity="secondary" value="SulAmerica" />
        </div>

        <ProviderLoadErrorMessage
          :is-retrying="isRetrying"
          :message="loadError"
          @retry="emit('retry')"
        />

        <Message v-if="showCityWarning" severity="warn" size="small" variant="outlined">
          O municipio selecionado no topo nao apareceu no catalogo atual da SulAmerica para o
          produto, plano e UF selecionados.
        </Message>

        <div class="provider-fields-grid">
          <div class="provider-field provider-field--full">
            <label for="sulamerica-produto">Produto</label>
            <Select
              v-model="produtoModel"
              input-id="sulamerica-produto"
              :invalid="Boolean(errors.produto)"
              :loading="loading.products"
              :options="products"
              option-label="nome"
              option-value="codigo"
              placeholder="Selecione"
              show-clear
            />
          </div>

          <div class="provider-field provider-field--full">
            <label for="sulamerica-plano">Plano</label>
            <Select
              v-model="planoModel"
              input-id="sulamerica-plano"
              :disabled="!produto"
              :invalid="Boolean(errors.plano)"
              :loading="loading.plans"
              :options="plans"
              option-label="nome"
              option-value="codigo"
              placeholder="Selecione"
              show-clear
            />
          </div>
        </div>

        <section class="provider-subsection">
          <div class="provider-subsection-header">
            <div class="provider-subsection-copy">
              <div class="provider-subsection-title">
                <span aria-hidden="true" class="provider-subsection-title-line" />
                <h3>Refinar horario</h3>
              </div>
              <p>Opcional: limite a busca a uma janela de atendimento especifica.</p>
            </div>
          </div>

          <div class="provider-fields-grid provider-fields-grid--time-range">
            <div class="provider-field provider-field--time-range">
              <label for="sulamerica-hora-inicial">Horario inicial</label>
              <Select
                v-model="horarioInicialModel"
                input-id="sulamerica-hora-inicial"
                :loading="loading.hours"
                :options="hours"
                option-label="nome"
                option-value="codigo"
                placeholder="Selecione"
                show-clear
              />
            </div>

            <div class="provider-field provider-field--time-range">
              <label for="sulamerica-hora-final">Horario final</label>
              <Select
                v-model="horarioFinalModel"
                input-id="sulamerica-hora-final"
                :loading="loading.hours"
                :options="hours"
                option-label="nome"
                option-value="codigo"
                placeholder="Selecione"
                show-clear
              />
            </div>
          </div>
        </section>

        <div v-if="hasErrors" class="provider-inline-errors">
          <small v-if="errors.produto">{{ errors.produto }}</small>
          <small v-if="errors.plano">{{ errors.plano }}</small>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.provider-tone--sulamerica {
  color: var(--app-provider-sulamerica-color);
}

.provider-panel {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 65%, transparent);
  box-shadow: var(--app-panel-shadow);
}

.provider-panel :deep(.p-card-body) {
  gap: 0;
}

.provider-panel-body {
  display: grid;
  gap: 0.95rem;
}

.provider-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.provider-panel-header h2 {
  margin: 0;
  font-size: 1rem;
}

.provider-panel-header p {
  margin: 0.35rem 0 0;
  color: var(--p-text-muted-color);
  line-height: 1.55;
}

.provider-fields-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.provider-fields-grid--time-range {
  align-items: end;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.provider-field {
  display: grid;
  gap: 0.4rem;
  min-width: 0;
}

.provider-field label {
  color: var(--p-text-muted-color);
  font-size: 0.88rem;
  font-weight: 600;
}

.provider-field--full {
  grid-column: 1 / -1;
}

.provider-field--time-range {
  min-width: 0;
}

.provider-field :deep(.p-select),
.provider-field :deep(.p-inputtext) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.provider-field :deep(.p-select) {
  overflow: hidden;
}

.provider-field :deep(.p-select-label) {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-subsection {
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 50%, transparent);
  border-radius: var(--p-content-border-radius);
  background: var(--app-panel-background-soft);
}

.provider-subsection-header {
  display: grid;
  gap: 0.45rem;
}

.provider-subsection-copy {
  display: grid;
  gap: 0.45rem;
}

.provider-subsection-title {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.provider-subsection-title-line {
  width: 1.45rem;
  height: 1px;
  background: color-mix(in srgb, var(--p-text-color) 78%, transparent);
  flex: 0 0 auto;
}

.provider-subsection-title h3 {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.2;
}

.provider-subsection-header p {
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.88rem;
  line-height: 1.55;
}

.provider-inline-errors {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}

.provider-inline-errors small {
  color: var(--p-red-500);
  line-height: 1.5;
}

@media (max-width: 640px) {
  .provider-fields-grid {
    grid-template-columns: 1fr;
  }

  .provider-panel-header {
    flex-direction: column;
  }

  .provider-field--full {
    grid-column: auto;
  }
}
</style>
