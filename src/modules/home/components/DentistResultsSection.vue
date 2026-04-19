<script setup lang="ts">
import { computed } from 'vue'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Paginator from 'primevue/paginator'
import Skeleton from 'primevue/skeleton'

import type { JobDentist } from '../api'
import DentistCard from './DentistCard.vue'

const props = defineProps<{
  dentists: JobDentist[]
  first: number
  helperText: string
  isLoading: boolean
  isTerminalState: boolean
  locationSummary: string
  paginatedDentists: JobDentist[]
  paginatorTemplate: Record<string, string>
  rows: number
  shouldShowPaginator: boolean
}>()

const emit = defineEmits<{
  'export-csv': []
  'update:first': [value: number]
  'update:rows': [value: number]
}>()

const firstModel = computed({
  get: () => props.first,
  set: (value: number) => emit('update:first', value),
})

const rowsModel = computed({
  get: () => props.rows,
  set: (value: number) => emit('update:rows', value),
})

function getDentistKey(dentist: JobDentist): string {
  return dentist.externalId ?? `${dentist.nome}-${dentist.telefone}`
}
</script>

<template>
  <section class="results-section">
    <div class="results-header">
      <div>
        <h2>{{ locationSummary }}</h2>
        <p>{{ helperText }}</p>
      </div>

      <Button
        v-if="dentists.length > 0"
        icon="pi pi-download"
        label="Exportar CSV"
        severity="secondary"
        variant="outlined"
        @click="emit('export-csv')"
      />
    </div>

    <div v-if="isLoading" class="results-grid">
      <Card v-for="index in 4" :key="index" class="result-card">
        <template #content>
          <div class="skeleton-stack">
            <Skeleton width="8rem" height="1rem" />
            <Skeleton width="100%" height="2.5rem" />
            <Skeleton width="70%" height="1rem" />
          </div>
        </template>
      </Card>
    </div>

    <template v-else-if="dentists.length > 0">
      <Paginator
        v-if="shouldShowPaginator"
        v-model:first="firstModel"
        v-model:rows="rowsModel"
        :alwaysShow="false"
        :rowsPerPageOptions="[12, 24, 48]"
        :template="paginatorTemplate"
        :totalRecords="dentists.length"
        class="results-paginator"
        currentPageReportTemplate="{first} - {last} de {totalRecords}"
      />

      <div class="results-grid">
        <DentistCard
          v-for="dentist in paginatedDentists"
          :key="getDentistKey(dentist)"
          :dentist="dentist"
        />
      </div>

      <Paginator
        v-if="shouldShowPaginator"
        v-model:first="firstModel"
        v-model:rows="rowsModel"
        :alwaysShow="false"
        :rowsPerPageOptions="[12, 24, 48]"
        :template="paginatorTemplate"
        :totalRecords="dentists.length"
        class="results-paginator results-paginator--bottom"
        currentPageReportTemplate="{first} - {last} de {totalRecords}"
      />
    </template>

    <Message v-else-if="isTerminalState" severity="info" variant="outlined">
      A coleta terminou, mas nenhuma rota de dentistas retornou registros para esta busca.
    </Message>
  </section>
</template>

<style scoped>
.results-section {
  width: 100%;
  margin: 0;
  display: grid;
  gap: 1.15rem;
}

.results-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}

.results-header h2 {
  margin: 0;
  color: var(--app-page-heading-color);
  font-size: clamp(1.1rem, 2.4vw, 1.4rem);
  line-height: 1.08;
}

.results-header p {
  margin: 0;
  color: var(--p-text-muted-color);
  line-height: 1.65;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.15rem;
}

.results-paginator {
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 68%, transparent);
  border-radius: calc(var(--p-content-border-radius) + 0.1rem);
  background: var(--app-panel-background);
  box-shadow: var(--app-panel-shadow);
  padding-inline: 0.2rem;
}

.results-paginator--bottom {
  margin-top: 0.15rem;
}

.skeleton-stack {
  display: grid;
  gap: 1rem;
}

@media (max-width: 960px) {
  .results-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .results-paginator {
    overflow-x: auto;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .results-section {
    width: 100%;
  }

  .results-grid {
    grid-template-columns: 1fr;
  }
}
</style>
