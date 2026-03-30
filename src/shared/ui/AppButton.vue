<script setup lang="ts">
import Button from 'primevue/button'

defineOptions({
  inheritAttrs: false,
})
</script>

<template>
  <Button v-bind="$attrs">
    <template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>
  </Button>
</template>
