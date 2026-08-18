<!-- 设置初始化（全局挂载，无 UI） -->
<template>
  <span class="hidden" aria-hidden="true" />
</template>

<script setup lang="ts">
  import { useSettingsPanel } from './composables/useSettingsPanel'

  defineOptions({ name: 'SettingsProvider' })

  const settingsPanel = useSettingsPanel()
  const { initializeSettings, cleanupSettings } = settingsPanel.useSettingsInitializer()

  onMounted(() => {
    initializeSettings()
  })

  onUnmounted(() => {
    cleanupSettings()
  })
</script>
