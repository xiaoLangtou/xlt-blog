<template>
  <section class="pref-group">
    <header v-if="title || desc" class="pref-group__head">
      <h4 v-if="title">{{ title }}</h4>
      <p v-if="desc">{{ desc }}</p>
    </header>
    <div class="pref-group__body" :class="{ 'is-list': list, 'is-flush': flush }">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
  defineProps<{
    title?: string
    desc?: string
    list?: boolean
    flush?: boolean
  }>()
</script>
