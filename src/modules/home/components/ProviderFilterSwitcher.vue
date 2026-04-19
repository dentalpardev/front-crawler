<script setup lang="ts">
import Button from 'primevue/button'

import type { CrawlProvider } from '@/shared/types'
import type { ProviderOption } from '../store'

defineProps<{
  activeProvider: CrawlProvider | null
  options: ProviderOption[]
}>()

const emit = defineEmits<{
  select: [provider: CrawlProvider]
}>()
</script>

<template>
  <div class="provider-panel-switcher">
    <span class="section-label">Filtros por provider</span>
    <p class="provider-panel-help">
      Configure um provider por vez. Quando o catalogo do provider definir o municipio, ele sera
      sincronizado automaticamente com a busca principal.
    </p>
    <div class="provider-panel-switcher-buttons" role="tablist" aria-label="Filtros por provider">
      <Button
        v-for="option in options"
        :key="option.value"
        :class="[
          'provider-panel-trigger',
          { 'provider-panel-trigger--active': activeProvider === option.value },
        ]"
        :label="option.label"
        :severity="activeProvider === option.value ? 'primary' : 'secondary'"
        :variant="activeProvider === option.value ? undefined : 'outlined'"
        rounded
        size="small"
        @click="emit('select', option.value)"
      />
    </div>
  </div>
</template>

<style scoped>
.section-label {
  color: var(--p-text-muted-color);
  font-size: 0.84rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.provider-panel-switcher {
  display: grid;
  gap: 0.6rem;
}

.provider-panel-help {
  margin: 0;
  color: var(--p-text-muted-color);
  line-height: 1.55;
}

.provider-panel-switcher-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.provider-panel-trigger {
  min-width: 0;
}

.provider-panel-trigger--active {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--p-primary-color) 20%, transparent);
}
</style>
