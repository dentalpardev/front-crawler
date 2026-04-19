<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'

defineProps<{
  canSubmitSearch: boolean
  isBatch: boolean
  isRefreshing: boolean
  isSubmitting: boolean
  isTrackingRunning: boolean
  showRetry: boolean
  statusLabel: string
  statusRows: Array<{
    key: string
    provider: string
    status: string
    tone: string
    total: string
  }>
  statusSeverity: string
}>()

const emit = defineEmits<{
  refresh: []
  retry: []
}>()
</script>

<template>
  <Card class="status-card">
    <template #content>
      <div class="status-card-body">
        <h2>{{ isBatch ? 'Status dos crawlers' : 'Status da coleta' }}</h2>

        <div class="status-list">
          <div v-for="row in statusRows" :key="row.key" class="status-row">
            <div class="status-row-main">
              <span class="status-dot" :class="row.tone" />
              <strong>{{ row.provider }}</strong>
            </div>

            <div class="status-row-meta">
              <span class="status-row-label">{{ row.total }}</span>
              <span class="status-row-label">{{ row.status }}</span>
              <ProgressSpinner
                v-if="isTrackingRunning"
                aria-label="Atualizando status"
                stroke-width="6"
                style="width: 1rem; height: 1rem"
              />
            </div>
          </div>
        </div>

        <div class="status-actions">
          <Tag :value="statusLabel" :severity="statusSeverity" rounded />
          <Button
            :loading="isRefreshing"
            icon="pi pi-refresh"
            label="Atualizar status"
            severity="secondary"
            size="small"
            variant="text"
            @click="emit('refresh')"
          />
          <Button
            v-if="showRetry"
            :disabled="!canSubmitSearch"
            :loading="isSubmitting"
            icon="pi pi-replay"
            label="Tentar novamente"
            severity="danger"
            size="small"
            variant="outlined"
            @click="emit('retry')"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.provider-tone--odontoprev {
  color: var(--app-provider-odontoprev-color);
}

.provider-tone--hapvida {
  color: var(--app-provider-hapvida-color);
}

.provider-tone--amil {
  color: var(--app-provider-amil-color);
}

.provider-tone--sulamerica {
  color: var(--app-provider-sulamerica-color);
}

.status-card {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 65%, transparent);
  box-shadow: var(--app-panel-shadow);
}

.status-card :deep(.p-card-body) {
  gap: 0;
}

.status-card-body {
  display: grid;
  gap: 0.9rem;
}

.status-card-body h2 {
  margin: 0;
  font-size: 1rem;
}

.status-list {
  display: grid;
  gap: 0.6rem;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: var(--p-border-radius-xl);
  background: var(--app-panel-background-soft);
}

.status-row-main,
.status-row-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.status-row-label {
  color: var(--p-text-muted-color);
  font-size: 0.92rem;
}

.status-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: currentColor;
  flex: 0 0 auto;
}

.status-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

@media (max-width: 960px) {
  .status-row,
  .status-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
