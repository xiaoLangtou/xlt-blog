<template>
  <label class="art-settings-panel__toggle">
    <input type="checkbox" :checked="modelValue" @change="handleChange" />
    <span class="art-settings-panel__toggle-track" />
  </label>
</template>

<script setup lang="ts">
  defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
  }>()

  const handleChange = (event: Event) => {
    emit('update:modelValue', (event.target as HTMLInputElement).checked)
  }
</script>
