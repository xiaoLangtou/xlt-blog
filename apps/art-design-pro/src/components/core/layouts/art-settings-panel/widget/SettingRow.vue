<template>
  <div class="art-settings-panel__row" :class="{ 'is-top': alignTop }">
    <div class="art-settings-panel__row-left">
      <ArtSvgIcon v-if="icon" :icon="icon" class="art-settings-panel__row-icon" />
      <span v-if="label" class="art-settings-panel__row-label">{{ label }}</span>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    icon?: string
    label?: string
    alignTop?: boolean
  }>()
</script>
