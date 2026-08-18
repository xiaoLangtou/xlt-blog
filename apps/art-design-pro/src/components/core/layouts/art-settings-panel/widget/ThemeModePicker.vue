<template>
  <div class="tm-picker">
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      class="tm-card"
      :class="[`tm-card--${option.value}`, { 'is-active': modelValue === option.value }]"
      @click="$emit('update:modelValue', option.value)"
    >
      <!-- 缩略图 -->
      <div class="tm-card__thumb">
        <!-- 浅色 -->
        <template v-if="option.value === 'light'">
          <div class="tm-thumb tm-thumb--light">
            <div class="tm-thumb__sidebar" />
            <div class="tm-thumb__main">
              <div class="tm-thumb__topbar" />
              <div class="tm-thumb__content">
                <div class="tm-thumb__line tm-thumb__line--60" />
                <div class="tm-thumb__line tm-thumb__line--80" />
                <div class="tm-thumb__line tm-thumb__line--40" />
              </div>
            </div>
          </div>
        </template>
        <!-- 深色 -->
        <template v-else-if="option.value === 'dark'">
          <div class="tm-thumb tm-thumb--dark">
            <div class="tm-thumb__sidebar" />
            <div class="tm-thumb__main">
              <div class="tm-thumb__topbar" />
              <div class="tm-thumb__content">
                <div class="tm-thumb__line tm-thumb__line--60" />
                <div class="tm-thumb__line tm-thumb__line--80" />
                <div class="tm-thumb__line tm-thumb__line--40" />
              </div>
            </div>
          </div>
        </template>
        <!-- 跟随系统 -->
        <template v-else>
          <div class="tm-thumb tm-thumb--auto">
            <div class="tm-thumb__half tm-thumb__half--l">
              <div class="tm-thumb__sidebar" />
              <div class="tm-thumb__main">
                <div class="tm-thumb__topbar" />
              </div>
            </div>
            <div class="tm-thumb__half tm-thumb__half--r">
              <div class="tm-thumb__sidebar" />
              <div class="tm-thumb__main">
                <div class="tm-thumb__topbar" />
              </div>
            </div>
          </div>
        </template>

        <!-- 选中角标 -->
        <div v-if="modelValue === option.value" class="tm-card__check">
          <ArtSvgIcon icon="ri:check-line" />
        </div>
      </div>

      <!-- 底部标签 -->
      <div class="tm-card__footer">
        <ArtSvgIcon :icon="option.icon" class="tm-card__icon" />
        <span class="tm-card__label">{{ option.label }}</span>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
  defineProps<{
    modelValue: T
    options: Array<{ label: string; value: T; icon: string }>
  }>()

  defineEmits<{
    'update:modelValue': [value: T]
  }>()
</script>
