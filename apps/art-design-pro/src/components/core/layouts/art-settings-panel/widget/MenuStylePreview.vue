<template>
  <div class="ms-thumb" :class="`ms-thumb--${theme}`">
    <div class="ms-thumb__sb">
      <div class="ms-thumb__logo" />
      <div class="ms-thumb__items">
        <div class="ms-thumb__item ms-thumb__item--active" />
        <div class="ms-thumb__item" />
        <div class="ms-thumb__item" />
        <div class="ms-thumb__item" />
      </div>
    </div>
    <div class="ms-thumb__main">
      <div class="ms-thumb__topbar" />
      <div class="ms-thumb__content">
        <div class="ms-thumb__block" />
        <div class="ms-thumb__block ms-thumb__block--sm" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { MenuThemeEnum } from '@/enums/appEnum'

  defineProps<{ theme: MenuThemeEnum }>()
</script>
