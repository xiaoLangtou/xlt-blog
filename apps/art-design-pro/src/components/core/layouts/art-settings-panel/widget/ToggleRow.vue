<template>
  <div
    class="art-settings-panel__trow"
    :class="{ 'art-settings-panel__mobile-hide': config.mobileHide }"
  >
    <div class="art-settings-panel__trow-left">
      <ArtSvgIcon :icon="config.icon" class="art-settings-panel__trow-icon" />
      <div class="art-settings-panel__trow-text">
        <p>{{ config.label }}</p>
        <small v-if="config.description">{{ config.description }}</small>
      </div>
    </div>
    <SettingToggle :model-value="modelValue" @update:model-value="$emit('change', $event)" />
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
