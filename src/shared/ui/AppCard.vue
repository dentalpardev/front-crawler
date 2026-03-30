<script setup lang="ts">
import Card from 'primevue/card'

defineOptions({
  inheritAttrs: false,
})
</script>

<template>
  <Card v-bind="$attrs">
    <template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>
  </Card>
</template>
