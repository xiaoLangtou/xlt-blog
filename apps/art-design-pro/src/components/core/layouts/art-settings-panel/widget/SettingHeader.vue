<template>
  <header class="art-settings-panel__head">
    <div class="art-settings-panel__head-left">
      <ArtSvgIcon icon="ri:settings-3-line" class="art-settings-panel__head-icon" />
      <strong class="art-settings-panel__head-title">{{ $t('setting.panel.title') }}</strong>
      <span class="art-settings-panel__head-sub">· {{ $t('setting.panel.subtitle') }}</span>
    </div>
    <button
      type="button"
      class="art-settings-panel__close"
      :aria-label="$t('setting.panel.close')"
      @click="$emit('close')"
    >
      <ArtSvgIcon icon="ri:close-line" />
    </button>
  </header>
</template>

<script setup lang="ts">
  defineEmits<{
    close: []
  }>()
</script>
