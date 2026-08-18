<template>
  <div
    class="art-settings-panel__srow"
    :class="{ 'art-settings-panel__mobile-hide': config.mobileHide }"
  >
    <div class="art-settings-panel__srow-l">
      <label>{{ config.label }}</label>
      <p v-if="config.description">{{ config.description }}</p>
    </div>
    <div class="art-settings-panel__srow-r">
      <SettingToggle :model-value="modelValue" @update:model-value="$emit('change', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import SettingToggle from './SettingToggle.vue'

  interface ToggleConfig {
    key: string
    label: string
    description?: string
    icon: string
    mobileHide?: boolean
  }

  defineProps<{
    config: ToggleConfig
    modelValue: boolean
  }>()

  defineEmits<{
    change: [value: boolean]
  }>()
</script>
