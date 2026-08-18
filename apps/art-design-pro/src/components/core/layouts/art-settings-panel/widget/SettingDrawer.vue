<template>
  <Teleport to="body">
    <div class="art-settings-panel" :class="{ 'is-open': modelValue }">
      <div class="art-settings-panel__overlay" @click="handleClose" />
      <aside class="art-settings-panel__drawer" role="dialog" aria-modal="true">
        <slot name="header" />
        <div class="art-settings-panel__body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="art-settings-panel__foot">
          <slot name="footer" />
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  interface Props {
    modelValue: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'open'): void
    (e: 'close'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  watch(
    () => props.modelValue,
    (open, prev) => {
      if (open && !prev) emit('open')
      if (!open && prev) emit('close')
    }
  )

  const handleClose = () => {
    emit('update:modelValue', false)
  }
</script>
