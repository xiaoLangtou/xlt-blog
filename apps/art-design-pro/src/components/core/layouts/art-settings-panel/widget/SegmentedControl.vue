<template>
  <div class="art-settings-panel__seg">
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      class="art-settings-panel__seg-btn"
      :class="{ 'is-active': modelValue === option.value }"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string | number">
  defineProps<{
    modelValue: T
    options: Array<{ label: string; value: T }>
  }>()

  defineEmits<{
    'update:modelValue': [value: T]
  }>()
</script>
