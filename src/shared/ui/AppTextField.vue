<script setup lang="ts">
import { computed, getCurrentInstance, useAttrs } from 'vue'

import IconField from 'primevue/iconfield'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import InputIcon from 'primevue/inputicon'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  icon?: string
  label?: string
  hint?: string
  inputId?: string
}>()

const attrs = useAttrs()
const instance = getCurrentInstance()

const fieldId = computed(() =>
  props.inputId ??
  (typeof attrs.name === 'string' ? `field-${attrs.name}` : `field-${instance?.uid ?? 'text'}`),
)
</script>

<template>
  <div class="field">
    <IftaLabel v-if="label" class="field-control">
      <IconField v-if="icon">
        <InputIcon :class="icon" />
        <InputText v-bind="$attrs" :id="fieldId" fluid />
      </IconField>
      <InputText v-else v-bind="$attrs" :id="fieldId" fluid />
      <label :for="fieldId">{{ label }}</label>
    </IftaLabel>
    <IconField v-else-if="icon" class="field-control">
      <InputIcon :class="icon" />
      <InputText v-bind="$attrs" :id="fieldId" fluid />
    </IconField>
    <InputText v-else v-bind="$attrs" :id="fieldId" class="field-control" fluid />
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
