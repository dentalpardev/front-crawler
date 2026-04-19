<script setup lang="ts">
import { computed } from 'vue'

import Card from 'primevue/card'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Tag from 'primevue/tag'

import type { SelectOption } from '../api'
import ProviderLoadErrorMessage from './ProviderLoadErrorMessage.vue'

type HapvidaLoadingState = {
  contractTypes: boolean
  products: boolean
  states: boolean
  cities: boolean
  services: boolean
  specialties: boolean
  neighborhoods: boolean
}

type HapvidaErrors = Partial<
  Record<'tipoContrato' | 'produto' | 'servico' | 'especialidade' | 'bairro', string>
>

const props = defineProps<{
  bairro: string
  cities: SelectOption[]
  contractTypes: SelectOption[]
  errors: HapvidaErrors
  especialidade: string
  hasLocation: boolean
  isCityCompatible: boolean
  isRetrying: boolean
  loadError: string
  loading: HapvidaLoadingState
  neighborhoods: SelectOption[]
  products: SelectOption[]
  produto: string
  services: SelectOption[]
  servico: string
  specialties: SelectOption[]
  tipoContrato: string
}>()

const emit = defineEmits<{
  retry: []
  'update:bairro': [value: string]
  'update:especialidade': [value: string]
  'update:produto': [value: string]
  'update:servico': [value: string]
  'update:tipoContrato': [value: string]
}>()

const tipoContratoModel = computed({
  get: () => props.tipoContrato,
  set: (value: string) => emit('update:tipoContrato', value),
})

const produtoModel = computed({
  get: () => props.produto,
  set: (value: string) => emit('update:produto', value),
})

const servicoModel = computed({
  get: () => props.servico,
  set: (value: string) => emit('update:servico', value),
})

const especialidadeModel = computed({
  get: () => props.especialidade,
  set: (value: string) => emit('update:especialidade', value),
})

const bairroModel = computed({
  get: () => props.bairro,
  set: (value: string) => emit('update:bairro', value),
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
            <h2>Filtros Hapvida</h2>
            <p>
              Configure apenas os filtros complementares. O municipio e a UF desta busca continuam
              vindo do topo da tela.
            </p>
          </div>
          <Tag class="provider-tone--hapvida" rounded severity="secondary" value="Hapvida" />
        </div>

        <ProviderLoadErrorMessage
          :is-retrying="isRetrying"
          :message="loadError"
          @retry="emit('retry')"
        />

        <Message v-if="showCityWarning" severity="warn" size="small" variant="outlined">
          O municipio selecionado no topo nao apareceu no catalogo atual da Hapvida para este
          produto e UF.
        </Message>

        <div class="provider-fields-grid">
          <div class="provider-field provider-field--full">
            <label for="hapvida-tipo-contrato">Tipo de contrato</label>
            <Select
              v-model="tipoContratoModel"
              input-id="hapvida-tipo-contrato"
              :invalid="Boolean(errors.tipoContrato)"
              :loading="loading.contractTypes"
              :options="contractTypes"
              option-label="nome"
              option-value="codigo"
              placeholder="Selecione"
              show-clear
            />
          </div>

          <div class="provider-field provider-field--full">
            <label for="hapvida-produto">Produto</label>
            <Select
              v-model="produtoModel"
              input-id="hapvida-produto"
              :disabled="!tipoContrato"
              :invalid="Boolean(errors.produto)"
              :loading="loading.products"
              :options="products"
              option-label="nome"
              option-value="codigo"
              placeholder="Selecione"
              show-clear
            />
          </div>

          <div class="provider-field">
            <label for="hapvida-servico">Servico</label>
            <Select
              v-model="servicoModel"
              input-id="hapvida-servico"
              :disabled="!hasLocation || !produto || !isCityCompatible || loading.cities"
              :invalid="Boolean(errors.servico)"
              :loading="loading.cities || loading.services"
              :options="services"
              option-label="nome"
              option-value="codigo"
              placeholder="Selecione"
              show-clear
            />
          </div>

          <div class="provider-field">
            <label for="hapvida-especialidade">Especialidade</label>
            <Select
              v-model="especialidadeModel"
              input-id="hapvida-especialidade"
              :disabled="!servico"
              :invalid="Boolean(errors.especialidade)"
              :loading="loading.specialties"
              :options="specialties"
              option-label="nome"
              option-value="codigo"
              placeholder="Selecione"
              show-clear
            />
          </div>

          <div class="provider-field">
            <label for="hapvida-bairro">
              Bairro
              <span class="provider-field-optional">Opcional</span>
            </label>
            <Select
              v-model="bairroModel"
              input-id="hapvida-bairro"
              :disabled="!especialidade"
              :invalid="Boolean(errors.bairro)"
              :loading="loading.neighborhoods"
              :options="neighborhoods"
              option-label="nome"
              option-value="codigo"
              placeholder="Selecione"
              show-clear
            />
          </div>
        </div>

        <div v-if="hasErrors" class="provider-inline-errors">
          <small v-if="errors.tipoContrato">{{ errors.tipoContrato }}</small>
          <small v-if="errors.produto">{{ errors.produto }}</small>
          <small v-if="errors.servico">{{ errors.servico }}</small>
          <small v-if="errors.especialidade">{{ errors.especialidade }}</small>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.provider-tone--hapvida {
  color: var(--app-provider-hapvida-color);
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

.provider-field-optional {
  margin-left: 0.45rem;
  color: var(--p-text-muted-color);
  font-size: 0.78rem;
  font-weight: 500;
}

.provider-field--full {
  grid-column: 1 / -1;
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
