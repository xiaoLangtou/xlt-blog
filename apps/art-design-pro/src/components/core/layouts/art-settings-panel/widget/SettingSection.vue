<template>
  <section class="art-settings-panel__sec">
    <div class="art-settings-panel__sec-label">{{ title }}</div>
    <slot />
  </section>
</template>

<script setup lang="ts">
  defineProps<{
    title: string
  }>()
</script>
