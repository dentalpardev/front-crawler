<script setup lang="ts">
import { computed } from 'vue'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Select from 'primevue/select'

import type { MunicipalityOption } from '../api'
import type { StateOption } from '../store'

const props = defineProps<{
  canClearScreen: boolean
  canSubmitSearch: boolean
  city: string
  formError: string
  formErrors: Record<string, string>
  isLoadingMunicipalities: boolean
  isSubmitting: boolean
  municipalityLoadError: string
  municipalityOptions: MunicipalityOption[]
  municipalityPlaceholder: string
  searchButtonLabel: string
  searchStateOptions: StateOption[]
  selectedProvidersCount: number
  selectedState: StateOption | null
}>()

const emit = defineEmits<{
  clear: []
  retry: []
  retryMunicipalities: []
  search: []
  'update:city': [value: string]
  'update:selectedState': [value: StateOption | null]
}>()

const selectedStateModel = computed({
  get: () => props.selectedState,
  set: (value: StateOption | null) => emit('update:selectedState', value),
})

const cityModel = computed({
  get: () => props.city,
  set: (value: string) => emit('update:city', value),
})

const hasInlineErrors = computed(() =>
  Boolean(props.formErrors.cidade || props.formErrors.uf || props.formErrors.providers),
)
</script>

<template>
  <Card class="search-card" role="search">
    <template #content>
      <div class="search-card-body">
        <div class="search-controls">
          <Select
            v-model="selectedStateModel"
            :disabled="selectedProvidersCount === 0"
            :invalid="Boolean(formErrors.uf)"
            :options="searchStateOptions"
            aria-label="UF"
            class="state-select"
            fluid
            option-label="code"
            placeholder="UF"
          />

          <Select
            v-model="cityModel"
            :disabled="selectedProvidersCount === 0 || !selectedState"
            :filter="Boolean(selectedState)"
            :invalid="Boolean(formErrors.cidade)"
            :loading="isLoadingMunicipalities"
            :options="municipalityOptions"
            :virtualScrollerOptions="{ itemSize: 38 }"
            aria-label="Municipio"
            class="municipality-select"
            filterPlaceholder="Busque o municipio"
            fluid
            option-label="name"
            option-value="name"
            :placeholder="municipalityPlaceholder"
            resetFilterOnClear
            resetFilterOnHide
            showClear
          />

          <Button
            :disabled="!canSubmitSearch"
            :label="searchButtonLabel"
            :loading="isSubmitting"
            class="search-submit"
            icon="pi pi-search"
            @click="emit('search')"
          />

          <Button
            v-if="canClearScreen"
            :disabled="isSubmitting"
            class="search-clear"
            icon="pi pi-times"
            label="Limpar tela"
            severity="secondary"
            variant="outlined"
            @click="emit('clear')"
          />
        </div>

        <p v-if="selectedProvidersCount > 0" class="search-submit-hint">
          A busca final e confirmada pelo botao acima. UF e municipio definidos aqui valem para
          todos os providers selecionados.
        </p>

        <Message v-if="formError" severity="error" variant="outlined">
          <div class="retry-message-content">
            <span>{{ formError }}</span>
            <Button
              :disabled="!canSubmitSearch"
              :loading="isSubmitting"
              icon="pi pi-refresh"
              label="Tentar novamente"
              severity="danger"
              size="small"
              variant="text"
              @click="emit('retry')"
            />
          </div>
        </Message>

        <Message v-if="municipalityLoadError" severity="error" variant="outlined">
          <div class="retry-message-content">
            <span>{{ municipalityLoadError }}</span>
            <Button
              :disabled="!selectedState"
              :loading="isLoadingMunicipalities"
              icon="pi pi-refresh"
              label="Tentar novamente"
              severity="danger"
              size="small"
              variant="text"
              @click="emit('retryMunicipalities')"
            />
          </div>
        </Message>

        <div v-if="hasInlineErrors" class="inline-errors">
          <Message v-if="formErrors.cidade" severity="error" size="small" variant="simple">
            {{ formErrors.cidade }}
          </Message>
          <Message v-if="formErrors.uf" severity="error" size="small" variant="simple">
            {{ formErrors.uf }}
          </Message>
          <Message v-if="formErrors.providers" severity="error" size="small" variant="simple">
            {{ formErrors.providers }}
          </Message>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.search-card {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 65%, transparent);
  box-shadow: var(--app-panel-shadow);
}

.search-card :deep(.p-card-body) {
  gap: 0;
}

.search-card-body {
  display: grid;
  gap: 0.85rem;
}

.search-controls {
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr) auto auto;
  gap: 0.65rem;
  align-items: center;
}

.municipality-select,
.state-select,
.search-clear,
.search-submit {
  min-height: 3rem;
}

.municipality-select :deep(.p-select-label),
.state-select :deep(.p-select-label) {
  font-size: 0.98rem;
}

.municipality-select :deep(.p-select-label) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-submit {
  padding-inline: 1.2rem;
  white-space: nowrap;
}

.search-clear {
  white-space: nowrap;
}

.inline-errors {
  display: grid;
  gap: 0.35rem;
}

.retry-message-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.retry-message-content span {
  min-width: 0;
  line-height: 1.45;
}

.search-submit-hint {
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
  line-height: 1.55;
}

@media (max-width: 960px) {
  .search-clear,
  .search-submit {
    width: 100%;
    justify-content: center;
  }

  .retry-message-content {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .search-controls {
    grid-template-columns: 1fr;
  }
}
</style>
