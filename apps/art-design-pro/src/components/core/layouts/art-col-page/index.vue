<template>
  <div
    ref="rootRef"
    class="ca-split-panel art-card"
    :class="{
      'is-vertical': vertical,
      'is-resizing': resizing,
      'is-collapse': isCollapse,
      'is-responsive': isResponsive,
      'is-mobile': isMobile
    }"
    :style="customStyle"
  >
    <div class="container" :style="sideStyle">
      <div ref="sideRef" class="ca-split-panel__side">
        <div class="ca-split-panel__content w-full">
          <slot name="left"></slot>
        </div>
      </div>
      <!-- 竖线和折叠按钮 -->
      <div class="divider-container">
        <div
          v-show="!isCollapse"
          class="divider"
          :class="{ 'is-draggable': !isMobile }"
          @mousedown="startResize"
        ></div>
        <div
          v-if="allowCollapse"
          class="ca-split-panel__collapse-trigger"
          :class="{
            'is-collapse': isCollapse,
            'is-mobile': isMobile
          }"
          @click="toggleCollapse"
        >
          <div class="ca-split-panel__collapse-trigger-icon">
            <LucideChevronRight v-if="isCollapse" :size="20" />
            <LucideChevronLeft v-else :size="20" />
          </div>
        </div>
      </div>
    </div>

    <div class="ca-split-panel__main h-full" :style="mainStyle">
      <div class="ca-split-panel__main-content w-full h-full">
        <slot name="main"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { LucideChevronLeft, LucideChevronRight } from 'lucide-vue-next'
  import type { CSSProperties } from 'vue'

  defineOptions({
    name: 'SplitPane'
  })

  /**
   * 组件属性定义
   */
  const props = withDefaults(
    defineProps<{
      size?: string | number
      minSize?: number
      maxSize?: number
      customStyle?: Record<string, string>
      bodyStyle?: Record<string, string>
      allowCollapse?: boolean
      collapse?: boolean
      vertical?: boolean
      reverse?: boolean
      responsive?: boolean
    }>(),
    {
      size: '20%',
      minSize: 200,
      maxSize: 800,
      customStyle: () => ({}),
      bodyStyle: () => ({}),
      allowCollapse: true,
      collapse: false,
      vertical: false,
      reverse: false,
      responsive: true
    }
  )

  const emit = defineEmits(['update:collapse'])

  // DOM 引用
  const rootRef = ref<HTMLElement | null>(null)

  // 状态管理
  const isCollapse = ref(props.collapse)
  const resizing = ref(false)
  const resizedSize = ref<string | null>(null)
  const isMobile = ref(false)

  // 将 size 属性转换为带单位的尺寸值
  const normalizedSize = computed(() => {
    if (typeof props.size === 'string') {
      if (props.size.includes('%') || props.size.includes('px')) {
        return props.size
      }
    }
    return `${props.size}px`
  })

  // 计算侧边栏样式
  const sideStyle = computed<CSSProperties>(() => ({
    [props.vertical ? 'height' : 'width']: isCollapse.value
      ? '0'
      : isMobile.value
        ? '100%'
        : resizedSize.value || normalizedSize.value,
    transition: resizing.value ? 'none' : 'all 0.5s ease',
    position: isMobile.value ? 'absolute' : 'relative',
    zIndex: isMobile.value ? 10 : 3
  }))

  // 计算主内容区域样式
  const mainStyle = computed(() => ({
    transition: resizing.value ? 'none' : 'padding 0.5s ease',
    flex: 1
  }))

  // 判断是否启用响应式布局
  const isResponsive = computed(() => {
    if (!props.responsive) return false
    return window.innerWidth < 768
  })

  // 切换折叠状态
  const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
    emit('update:collapse', isCollapse.value)
  }

  // 拖拽调整宽度
  const startResize = (e: MouseEvent) => {
    if (isMobile.value || isCollapse.value) return

    e.preventDefault()
    resizing.value = true

    const startX = e.clientX
    const startY = e.clientY
    const container = rootRef.value
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const currentSize = props.vertical ? containerRect.height : containerRect.width

    // 解析当前侧边栏尺寸为 px
    const currentVal = resizedSize.value || normalizedSize.value
    let startPx: number
    if (currentVal.includes('%')) {
      startPx = (parseFloat(currentVal) / 100) * currentSize
    } else {
      startPx = parseFloat(currentVal)
    }

    const onMouseMove = (me: MouseEvent) => {
      const delta = props.vertical ? me.clientY - startY : me.clientX - startX
      const newPx = Math.min(props.maxSize, Math.max(props.minSize, startPx + delta))
      resizedSize.value = `${newPx}px`
    }

    const onMouseUp = () => {
      resizing.value = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // 检查是否为移动端设备
  const checkMobile = useDebounceFn(() => {
    isMobile.value = window.innerWidth <= 768
  }, 300)

  // 组件挂载时初始化
  onMounted(() => {
    checkMobile() // 初次判断
    useResizeObserver(rootRef, () => {
      checkMobile()
    })
  })
</script>

<style lang="scss" scoped>
  .ca-split-panel {
    display: flex;
    overflow: hidden;
    width: 100%;
    height: 100%;
    position: relative;
    border-radius: var(--custom-radius);

    .container {
      display: flex;
      flex-shrink: 0;
      overflow: visible;
      z-index: 1;
    }

    .divider-container {
      position: relative;

      .divider {
        width: 2px;
        height: 100%;
        background: var(--default-border);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;

        &.is-draggable {
          cursor: col-resize;
          width: 2px;
          margin: 0 -2px;

          &:hover,
          &:active {
            background: var(--art-primary);
          }
        }
      }
    }

    &.is-vertical {
      flex-direction: column;
    }

    &__side {
      display: flex;
      flex-direction: row;
      width: 100%;
      height: 100%;
      background: var(--default-box-color);
      overflow: hidden;
    }

    &__main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--default-box-color);
      padding: 10px;
      z-index: 1;
    }

    .ca-split-panel__collapse-trigger-icon {
      border-radius: 50%;
      z-index: 2;
      width: 100%;
      height: 100%;
      background: var(--default-bg-color);
      display: flex;
      justify-content: center;
      align-items: center;
    }

    &__collapse-trigger {
      align-items: center;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 15px;
      justify-content: center;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 3;
    }

    &.is-collapse {
      .ca-split-panel__side {
        width: 0;
      }

      .ca-split-panel__collapse-trigger {
        transform: translateX(0%);
      }
    }

    &.is-mobile {
      .ca-split-panel__side {
        height: 100%;
        width: 100%;
        background: var(--default-box-color);
        z-index: 2;
      }

      .divider {
        width: 0;
        margin: 0;
        background: none;
      }

      .ca-split-panel__collapse-trigger {
        z-index: 12;
        transform: translateX(-100%);

        &.is-collapse {
          left: 10px;
          right: auto;
        }
      }

      &.is-collapse .ca-split-panel__collapse-trigger {
        transform: translateX(0%);
      }
    }
  }
</style>
