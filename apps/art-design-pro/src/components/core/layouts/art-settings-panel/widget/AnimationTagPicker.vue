<template>
  <div class="art-settings-panel__atags">
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      class="art-settings-panel__atag"
      :class="{ 'is-active': modelValue === option.value }"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    modelValue: string
    options: Array<{ label: string; value: string }>
  }>()

  defineEmits<{
    'update:modelValue': [value: string]
  }>()
</script>
