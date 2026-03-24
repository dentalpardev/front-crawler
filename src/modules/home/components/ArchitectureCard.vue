<script setup lang="ts">
defineProps<{
  title: string
  description: string
  path: string
}>()
</script>

<template>
  <article class="architecture-card">
    <p class="path">{{ path }}</p>
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
  </article>
</template>

<style scoped>
.architecture-card {
  border: 1px solid #d8dee9;
  border-radius: 20px;
  padding: 1.25rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 247, 250, 0.96) 100%);
  box-shadow: 0 16px 40px -28px rgba(15, 23, 42, 0.35);
}

.architecture-card h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
  color: #102a43;
}

.architecture-card p {
  margin: 0;
  color: #486581;
  line-height: 1.6;
}

.path {
  display: inline-flex;
  margin-bottom: 0.9rem;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: #e0f2fe;
  color: #075985;
  font-size: 0.85rem;
  font-weight: 700;
}
</style>
