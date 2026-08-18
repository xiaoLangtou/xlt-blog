<template>
  <button type="button" class="lp-card" :class="{ 'is-active': active }" @click="$emit('select')">
    <div class="lp-card__thumb">
      <!-- 垂直 left -->
      <template v-if="type === 'left'">
        <div class="lp-thumb lp-thumb--left">
          <div class="lp-thumb__sb" />
          <div class="lp-thumb__main">
            <div class="lp-thumb__tb" />
            <div class="lp-thumb__rows">
              <div class="lp-thumb__row lp-thumb__row--70" />
              <div class="lp-thumb__row lp-thumb__row--50" />
              <div class="lp-thumb__row lp-thumb__row--60" />
            </div>
          </div>
        </div>
      </template>
      <!-- 水平 top -->
      <template v-else-if="type === 'top'">
        <div class="lp-thumb lp-thumb--top">
          <div class="lp-thumb__tb" />
          <div class="lp-thumb__rows">
            <div class="lp-thumb__row lp-thumb__row--70" />
            <div class="lp-thumb__row lp-thumb__row--50" />
            <div class="lp-thumb__row lp-thumb__row--60" />
          </div>
        </div>
      </template>
      <!-- 混合 top-left -->
      <template v-else-if="type === 'top-left'">
        <div class="lp-thumb lp-thumb--mix">
          <div class="lp-thumb__tb" />
          <div class="lp-thumb__lower">
            <div class="lp-thumb__sb lp-thumb__sb--sm" />
            <div class="lp-thumb__rows">
              <div class="lp-thumb__row lp-thumb__row--70" />
              <div class="lp-thumb__row lp-thumb__row--50" />
            </div>
          </div>
        </div>
      </template>
      <!-- 双列 dual -->
      <template v-else>
        <div class="lp-thumb lp-thumb--dual">
          <div class="lp-thumb__sb lp-thumb__sb--dark" />
          <div class="lp-thumb__sb lp-thumb__sb--mid" />
          <div class="lp-thumb__rows">
            <div class="lp-thumb__row lp-thumb__row--70" />
            <div class="lp-thumb__row lp-thumb__row--50" />
            <div class="lp-thumb__row lp-thumb__row--60" />
          </div>
        </div>
      </template>

      <div v-if="active" class="lp-card__check">
        <ArtSvgIcon icon="ri:check-line" />
      </div>
    </div>
    <span class="lp-card__label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
  import type { MenuTypeEnum } from '@/enums/appEnum'

  defineProps<{
    type: MenuTypeEnum
    label: string
    active: boolean
  }>()

  defineEmits<{
    select: []
  }>()
</script>
