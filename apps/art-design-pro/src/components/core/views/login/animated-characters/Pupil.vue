<!-- 动画角色瞳孔：跟随鼠标移动 -->
<template>
  <div :data-max-distance="maxDistance" class="pupil" :style="pupilStyle" />
</template>

<script setup lang="ts">
  interface Props {
    size?: string
    maxDistance?: number
    pupilColor?: string
  }

  const { size, maxDistance, pupilColor } = withDefaults(defineProps<Props>(), {
    size: '12px',
    maxDistance: 5,
    pupilColor: 'black'
  })

  const pupilStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundColor: pupilColor,
    willChange: 'transform'
  }
</script>
