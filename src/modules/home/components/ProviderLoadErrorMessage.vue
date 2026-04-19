<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'

defineProps<{
  isRetrying: boolean
  message: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <Message v-if="message" severity="error" size="small" variant="outlined">
    <div class="retry-message-content">
      <span>{{ message }}</span>
      <Button
        :loading="isRetrying"
        icon="pi pi-refresh"
        label="Tentar novamente"
        severity="danger"
        size="small"
        variant="text"
        @click="emit('retry')"
      />
    </div>
  </Message>
</template>

<style scoped>
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

@media (max-width: 960px) {
  .retry-message-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
