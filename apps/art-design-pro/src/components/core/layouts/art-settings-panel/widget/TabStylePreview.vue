<template>
  <div class="tsp">
    <div
      v-for="i in 3"
      :key="i"
      class="tsp__tab"
      :class="{ 'tsp__tab--active': i === 2, [`tsp__tab--${type}`]: true }"
    />
  </div>
</template>

<script setup lang="ts">
  defineProps<{ type: string }>()
</script>
