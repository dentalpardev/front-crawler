<script setup lang="ts">
import { computed, getCurrentInstance, useAttrs } from 'vue'

import IconField from 'primevue/iconfield'
import IftaLabel from 'primevue/iftalabel'
import InputIcon from 'primevue/inputicon'
import Password from 'primevue/password'

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
  (typeof attrs.name === 'string' ? `field-${attrs.name}` : `field-${instance?.uid ?? 'password'}`),
)
</script>

<template>
  <div class="field">
    <IftaLabel v-if="label" class="field-control">
      <IconField v-if="icon">
        <InputIcon :class="icon" />
        <Password v-bind="$attrs" :input-id="fieldId" fluid toggle-mask :feedback="false" />
      </IconField>
      <Password v-else v-bind="$attrs" :input-id="fieldId" fluid toggle-mask :feedback="false" />
      <label :for="fieldId">{{ label }}</label>
    </IftaLabel>
    <IconField v-else-if="icon" class="field-control">
      <InputIcon :class="icon" />
      <Password v-bind="$attrs" :input-id="fieldId" fluid toggle-mask :feedback="false" />
    </IconField>
    <Password
      v-else
      v-bind="$attrs"
      :input-id="fieldId"
      class="field-control"
      fluid
      toggle-mask
      :feedback="false"
    />
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
