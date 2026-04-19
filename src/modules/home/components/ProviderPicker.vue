<script setup lang="ts">
import { computed } from 'vue'

import Checkbox from 'primevue/checkbox'

import type { CrawlProvider } from '@/shared/types'
import type { ProviderOption } from '../store'

const props = defineProps<{
  modelValue: CrawlProvider[]
  options: ProviderOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CrawlProvider[]]
}>()

const selectedProviders = computed({
  get: () => props.modelValue,
  set: (value: CrawlProvider[]) => emit('update:modelValue', value),
})

function getProviderTone(value: CrawlProvider) {
  if (value === 'odontoprev') {
    return 'provider-tone--odontoprev'
  }

  if (value === 'hapvida') {
    return 'provider-tone--hapvida'
  }

  if (value === 'amil') {
    return 'provider-tone--amil'
  }

  return 'provider-tone--sulamerica'
}
</script>

<template>
  <div class="provider-picker">
    <div class="provider-picker-header">
      <span class="section-label">Provedores</span>
      <span class="provider-picker-help">Selecione um ou mais providers</span>
    </div>

    <div class="provider-choice-group" role="group" aria-label="Provedores">
      <label
        v-for="option in options"
        :key="option.value"
        :class="[
          'provider-choice',
          { 'provider-choice--active': selectedProviders.includes(option.value) },
        ]"
      >
        <Checkbox
          v-model="selectedProviders"
          :input-id="`provider-${option.value}`"
          :name="`provider-${option.value}`"
          :value="option.value"
        />
        <span :class="['provider-choice-label', getProviderTone(option.value)]">
          {{ option.label }}
        </span>
      </label>
    </div>
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

.provider-picker {
  display: grid;
  gap: 0.45rem;
}

.section-label {
  color: var(--p-text-muted-color);
  font-size: 0.84rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.provider-picker-header {
  display: grid;
  gap: 0.15rem;
}

.provider-picker-help {
  color: var(--p-text-muted-color);
  font-size: 0.88rem;
}

.provider-choice-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.provider-choice {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.5rem;
  padding: 0.5rem 0.8rem;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 72%, transparent);
  border-radius: 999px;
  background: var(--app-panel-background);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.provider-choice:hover {
  border-color: var(--p-primary-300);
}

.provider-choice--active {
  border-color: var(--p-primary-color);
  background: color-mix(in srgb, var(--p-primary-color) 7%, var(--app-panel-background));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--p-primary-color) 22%, transparent);
}

.provider-choice :deep(.p-checkbox) {
  flex: 0 0 auto;
}

.provider-choice-label {
  font-size: 0.94rem;
  font-weight: 600;
}
</style>
