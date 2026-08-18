<template>
  <div class="art-settings-panel__card">
    <div class="art-settings-panel__card-head">
      <div class="art-settings-panel__card-icon" :class="`is-${tone}`">
        <ArtSvgIcon :icon="icon" />
      </div>
      <div class="art-settings-panel__card-head-text">
        <h3>{{ title }}</h3>
        <p v-if="desc">{{ desc }}</p>
      </div>
    </div>
    <div class="art-settings-panel__card-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    icon: string
    title: string
    desc?: string
    tone?: 'purple' | 'blue' | 'orange' | 'green'
  }>()
</script>
