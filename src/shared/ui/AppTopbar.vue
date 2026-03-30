<script setup lang="ts">
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'

import { useColorMode } from '@/shared/composables/useColorMode'
import AppBrandLogo from './AppBrandLogo.vue'

defineProps<{
  title: string
}>()

const { isDarkMode, toggleColorMode } = useColorMode()
</script>

<template>
  <header class="app-topbar-frame">
    <Toolbar :aria-label="`Barra principal do ${title}`" class="app-topbar">
      <template #start>
        <div class="brand">
          <AppBrandLogo size="md" />
          <span>{{ title }}</span>
        </div>
      </template>

      <template #end>
        <div class="actions">
          <slot name="actions" />
          <Button
            :aria-label="isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'"
            :icon="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"
            rounded
            severity="secondary"
            variant="text"
            @click="toggleColorMode"
          />
        </div>
      </template>
    </Toolbar>
  </header>
</template>

<style scoped>
.app-topbar-frame {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid color-mix(in srgb, var(--p-content-border-color) 72%, transparent);
  backdrop-filter: blur(18px);
  background: color-mix(in srgb, var(--app-panel-background) 82%, transparent);
}

.app-topbar {
  width: min(100%, 74rem);
  margin: 0 auto;
  border: 0;
  border-radius: 0;
  padding: 0.65rem 1.25rem;
  background: transparent;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.brand span {
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.actions {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.actions :deep(> *) {
  flex-shrink: 0;
}

.actions :deep(.p-tag) {
  border-radius: 999px;
}

.actions :deep(.p-button.p-button-text),
.actions :deep(.p-button.p-button-outlined) {
  width: 2.25rem;
  height: 2.25rem;
}

.actions :deep(.p-button.p-button-text:not(.p-button-rounded)),
.actions :deep(.p-button.p-button-outlined:not(.p-button-rounded)) {
  width: auto;
  min-width: 2.25rem;
}

@media (max-width: 640px) {
  .app-topbar {
    padding-inline: 0.75rem;
    padding-block: 0.55rem;
  }

  .brand span {
    font-size: 0.94rem;
  }
}
</style>
