<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'

import Checkbox from 'primevue/checkbox'

const props = defineProps<{
  inputId?: string
  label: string
}>()

const model = defineModel<boolean>({
  default: false,
})

const instance = getCurrentInstance()
const fieldId = computed(() => props.inputId ?? `checkbox-${instance?.uid ?? 'field'}`)
const labelId = computed(() => `${fieldId.value}-label`)
</script>

<template>
  <label :for="fieldId" class="checkbox-field">
    <Checkbox :input-id="fieldId" :aria-labelledby="labelId" v-model="model" binary />
    <span :id="labelId">{{ label }}</span>
  </label>
</template>

<style scoped>
.checkbox-field {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.9rem;
}
</style>
