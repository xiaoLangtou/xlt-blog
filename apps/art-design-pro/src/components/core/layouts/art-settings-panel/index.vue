<!-- 兼容旧引用，转发至 SettingsProvider -->
<script setup lang="ts">
  import SettingsProvider from './SettingsProvider.vue'

  defineOptions({ name: 'ArtSettingsPanel' })
</script>

<template>
  <SettingsProvider />
</template>
