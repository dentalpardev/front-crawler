<script setup lang="ts">
import Tag from 'primevue/tag'

import { AppCard } from '@/shared/ui'

defineProps<{
  title: string
  description: string
  path: string
}>()
</script>

<template>
  <AppCard>
    <template #content>
      <div class="architecture-card">
        <Tag :value="path" rounded />
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </div>
    </template>
  </AppCard>
</template>

<style scoped>
.architecture-card {
  display: grid;
  gap: 0.9rem;
}

.architecture-card h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}

.architecture-card p {
  margin: 0;
  line-height: 1.6;
}
</style>
