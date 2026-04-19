<script setup lang="ts">
import { computed } from 'vue'

import Card from 'primevue/card'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Tag from 'primevue/tag'

import type { AmilPlanOption, SelectOption } from '../api'
import ProviderLoadErrorMessage from './ProviderLoadErrorMessage.vue'

type AmilLoadingState = {
  plans: boolean
  states: boolean
  cities: boolean
  neighborhoods: boolean
  specialties: boolean
}

type AmilErrors = Partial<Record<'plan' | 'bairro' | 'especialidade', string>>

type AmilPlanSelectionOption = {
  key: string
  label: string
}

const props = defineProps<{
  bairro: string
  cities: SelectOption[]
  errors: AmilErrors
  especialidade: string
  hasLocation: boolean
  isCityCompatible: boolean
  isRetrying: boolean
  loadError: string
  loading: AmilLoadingState
  neighborhoods: SelectOption[]
  planOptions: AmilPlanSelectionOption[]
  selectedPlan: AmilPlanOption | null
  selectedPlanKey: string
  specialties: SelectOption[]
}>()

const emit = defineEmits<{
  retry: []
  'update:bairro': [value: string]
  'update:especialidade': [value: string]
  'update:selectedPlanKey': [value: string]
}>()

const selectedPlanKeyModel = computed({
  get: () => props.selectedPlanKey,
  set: (value: string) => emit('update:selectedPlanKey', value),
})

const bairroModel = computed({
  get: () => props.bairro,
  set: (value: string) => emit('update:bairro', value),
})

const especialidadeModel = computed({
  get: () => props.especialidade,
  set: (value: string) => emit('update:especialidade', value),
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
            <h2>Filtros Amil</h2>
            <p>
              Comece por rede ou plano. UF e municipio continuam vindo do topo da tela e os demais
              filtros seguem a cascata da Amil.
            </p>
          </div>
          <Tag class="provider-tone--amil" rounded severity="secondary" value="Amil" />
        </div>

        <ProviderLoadErrorMessage
          :is-retrying="isRetrying"
          :message="loadError"
          @retry="emit('retry')"
        />

        <Message v-if="showCityWarning" severity="warn" size="small" variant="outlined">
          O municipio selecionado no topo nao apareceu no catalogo atual da Amil para a rede ou
          plano escolhido.
        </Message>

        <div class="provider-fields-grid">
          <div class="provider-field provider-field--full">
            <label for="amil-plan">Rede ou plano</label>
            <Select
              v-model="selectedPlanKeyModel"
              input-id="amil-plan"
              :invalid="Boolean(errors.plan)"
              :loading="loading.plans"
              :options="planOptions"
              filter
              filterPlaceholder="Busque por rede ou plano"
              option-label="label"
              option-value="key"
              placeholder="Selecione"
              show-clear
              :virtualScrollerOptions="{ itemSize: 38 }"
            />
          </div>

          <div v-if="selectedPlan" class="provider-field provider-field--full">
            <Message severity="secondary" variant="simple">
              {{
                selectedPlan.tipo === 'rede'
                  ? 'Busca dental por rede selecionada.'
                  : 'Busca dental por plano especifico selecionado.'
              }}
              Tipo de servico definido automaticamente como DENTAL.
            </Message>
          </div>

          <div class="provider-field">
            <label for="amil-bairro">Bairro</label>
            <Select
              v-model="bairroModel"
              input-id="amil-bairro"
              :disabled="!hasLocation || !selectedPlan || !isCityCompatible"
              :invalid="Boolean(errors.bairro)"
              :loading="loading.cities || loading.neighborhoods"
              :options="neighborhoods"
              filter
              filterPlaceholder="Busque o bairro"
              option-label="nome"
              option-value="codigo"
              placeholder="Selecione"
              show-clear
              :virtualScrollerOptions="{ itemSize: 38 }"
            />
          </div>

          <div class="provider-field">
            <label for="amil-especialidade">Especialidade</label>
            <Select
              v-model="especialidadeModel"
              input-id="amil-especialidade"
              :disabled="!bairro"
              :invalid="Boolean(errors.especialidade)"
              :loading="loading.specialties"
              :options="specialties"
              filter
              filterPlaceholder="Busque a especialidade"
              option-label="nome"
              option-value="codigo"
              placeholder="Selecione"
              show-clear
              :virtualScrollerOptions="{ itemSize: 38 }"
            />
          </div>
        </div>

        <div v-if="hasErrors" class="provider-inline-errors">
          <small v-if="errors.plan">{{ errors.plan }}</small>
          <small v-if="errors.bairro">{{ errors.bairro }}</small>
          <small v-if="errors.especialidade">{{ errors.especialidade }}</small>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.provider-tone--amil {
  color: var(--app-provider-amil-color);
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
