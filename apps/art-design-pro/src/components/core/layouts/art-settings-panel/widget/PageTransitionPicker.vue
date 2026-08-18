<template>
  <div class="art-settings-panel__trans-grid">
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      class="art-settings-panel__trans-card"
      :class="[{ 'is-active': modelValue === option.value }, `is-${option.type}`]"
      @click="handleSelect(option.value)"
    >
      <div class="art-settings-panel__trans-preview">
        <div class="art-settings-panel__trans-chrome"> <span /><span /><span /> </div>
        <div
          class="art-settings-panel__trans-page"
          :class="{ 'is-demo': demoValue === option.value }"
        >
          <i /><i /><i />
        </div>
      </div>
      <div class="art-settings-panel__trans-meta">
        <ArtSvgIcon :icon="option.icon" class="art-settings-panel__trans-icon" />
        <div class="art-settings-panel__trans-text">
          <span class="art-settings-panel__trans-label">{{ option.label }}</span>
          <small v-if="option.description">{{ option.description }}</small>
        </div>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
  export interface PageTransitionOption {
    value: string
    label: string
    description?: string
    icon: string
    type: 'none' | 'fade' | 'slide-left' | 'slide-bottom' | 'slide-top'
  }

  defineProps<{
    modelValue: string
    options: PageTransitionOption[]
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: string]
  }>()

  const demoValue = ref<string | null>(null)
  let demoTimer: ReturnType<typeof setTimeout> | null = null

  const handleSelect = (value: string) => {
    emit('update:modelValue', value)
    replayDemo(value)
  }

  const replayDemo = (value: string) => {
    if (demoTimer) clearTimeout(demoTimer)
    demoValue.value = null

    requestAnimationFrame(() => {
      demoValue.value = value
      demoTimer = setTimeout(() => {
        demoValue.value = null
        demoTimer = null
      }, 650)
    })
  }

  onUnmounted(() => {
    if (demoTimer) clearTimeout(demoTimer)
  })
</script>
