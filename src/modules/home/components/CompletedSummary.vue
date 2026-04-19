<script setup lang="ts">
import Button from 'primevue/button'

import { formatDentistCount } from '../utils'

defineProps<{
  isSubmitting: boolean
  items: Array<{
    key: string
    label: string
    tone: string
    total: number | null
  }>
  showRetry: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="completed-banner">
    <div class="completed-banner-main">
      <template v-for="item in items" :key="item.key">
        <div class="completed-banner-item">
          <i class="pi pi-check-circle" :class="item.tone" aria-hidden="true" />
          <strong>{{ item.label }}</strong>
          <span>{{ formatDentistCount(item.total) }}</span>
        </div>
      </template>
    </div>
    <Button
      v-if="showRetry"
      :loading="isSubmitting"
      icon="pi pi-replay"
      label="Tentar falhas novamente"
      severity="warn"
      size="small"
      variant="outlined"
      @click="emit('retry')"
    />
  </div>
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

.completed-banner {
  display: flex;
  align-items: center;
  min-height: 3.15rem;
  padding: 0.75rem 0.95rem;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 56%, transparent);
  border-radius: calc(var(--p-content-border-radius) + 0.2rem);
  background: var(--app-panel-background);
  box-shadow: none;
}

.completed-banner-main {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem 1rem;
  color: var(--p-text-muted-color);
  font-size: 0.92rem;
}

.completed-banner-item {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.completed-banner-item .pi {
  font-size: 1rem;
}

.completed-banner-item strong {
  color: var(--p-text-color);
  font-size: 0.95rem;
  font-weight: 600;
}

.completed-banner-item span::before {
  content: '\2014';
  margin-right: 0.45rem;
  color: var(--p-text-muted-color);
}
</style>
