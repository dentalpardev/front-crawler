<script setup lang="ts">
import { computed, getCurrentInstance, useAttrs } from 'vue'

import IftaLabel from 'primevue/iftalabel'
import Select from 'primevue/select'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  label?: string
  hint?: string
  inputId?: string
}>()

const attrs = useAttrs()
const instance = getCurrentInstance()

const fieldId = computed(() =>
  props.inputId ??
  (typeof attrs.name === 'string' ? `field-${attrs.name}` : `field-${instance?.uid ?? 'select'}`),
)
</script>

<template>
  <div class="field">
    <IftaLabel v-if="label" class="field-control">
      <Select v-bind="$attrs" :input-id="fieldId" fluid />
      <label :for="fieldId">{{ label }}</label>
    </IftaLabel>
    <Select v-else v-bind="$attrs" :input-id="fieldId" class="field-control" fluid />
    <small v-if="hint" class="field-hint">{{ hint }}</small>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 0.4rem;
}

.field-control {
  width: 100%;
}

.field-hint {
  color: var(--p-text-muted-color);
  font-size: 0.82rem;
  line-height: 1.4;
}
</style>
