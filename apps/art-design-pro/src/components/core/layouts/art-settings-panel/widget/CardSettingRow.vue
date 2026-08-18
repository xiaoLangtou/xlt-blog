<template>
  <div class="art-settings-panel__srow" :class="{ 'is-top': alignTop }">
    <div class="art-settings-panel__srow-l">
      <label>{{ label }}</label>
      <p v-if="desc">{{ desc }}</p>
    </div>
    <div class="art-settings-panel__srow-r">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    label: string
    desc?: string
    alignTop?: boolean
  }>()
</script>
