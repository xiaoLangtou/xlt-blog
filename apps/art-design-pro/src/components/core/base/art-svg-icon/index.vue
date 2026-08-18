<!-- 图标组件 -->
<template>
  <Icon
    v-if="normalizedIcon"
    :icon="normalizedIcon"
    v-bind="bindAttrs"
    class="art-svg-icon inline"
  />
</template>

<script setup lang="ts">
  import { Icon } from '@iconify/vue'
  import { normalizeIcon } from '@/utils/ui/normalizeIcon'

  defineOptions({ name: 'ArtSvgIcon', inheritAttrs: false })

  interface Props {
    /** Iconify icon name，或后端 Lucide 格式如 Lucide-Gauge */
    icon?: string
  }

  const props = defineProps<Props>()

  const normalizedIcon = computed(() => normalizeIcon(props.icon))

  const attrs = useAttrs()

  const bindAttrs = computed<{ class: string; style: string }>(() => ({
    class: (attrs.class as string) || '',
    style: (attrs.style as string) || ''
  }))
</script>
