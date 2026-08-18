<template>
  <div
    class="pref-row"
    :class="{
      'is-stack': stack,
      'is-switch': variant === 'switch',
      'art-settings-panel__mobile-hide': mobileHide
    }"
  >
    <div class="pref-row__main">
      <span class="pref-row__label">{{ label }}</span>
      <span v-if="desc" class="pref-row__desc">{{ desc }}</span>
    </div>
    <div v-if="$slots.default" class="pref-row__ctrl">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    label?: string
    desc?: string
    stack?: boolean
    variant?: 'default' | 'switch'
    mobileHide?: boolean
  }>()
</script>
