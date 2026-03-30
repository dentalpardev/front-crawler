<script setup lang="ts">
import Button from 'primevue/button'

import { useColorMode } from '@/shared/composables/useColorMode'

const { isDarkMode, toggleColorMode } = useColorMode()
</script>

<template>
  <main class="auth-page">
    <header class="auth-toolbar">
      <Button
        :aria-label="isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'"
        :icon="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"
        rounded
        severity="secondary"
        variant="text"
        @click="toggleColorMode"
      />
    </header>

    <section class="auth-shell">
      <slot />
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  padding: 0.75rem 1rem 2rem;
  background: var(--app-page-background);
  color: var(--p-text-color);
}

.auth-toolbar {
  display: flex;
  justify-content: flex-end;
  width: min(100%, 72rem);
  margin: 0 auto;
}

.auth-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, 72rem);
  min-height: calc(100vh - 4rem);
  margin: 0 auto;
  padding: 1.5rem 1rem 2rem;
}

@media (max-width: 640px) {
  .auth-page {
    padding-inline: 0.75rem;
  }

  .auth-shell {
    padding-inline: 0;
  }
}
</style>
