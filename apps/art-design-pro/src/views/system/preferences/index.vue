<!-- 偏好设置页面 -->
<template>
  <div class="pref-shell">
    <!-- 顶部 Tab 页签（固定不滚动） -->
    <div class="pref-shell__tabs">
      <button
        v-for="tab in pageTabs"
        :key="tab.id"
        type="button"
        class="pref-shell__tab"
        :class="{ 'is-active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <ArtSvgIcon :icon="tab.icon" class="pref-shell__tab-icon" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- 内容区：左侧导航固定，仅右侧内容滚动 -->
    <div class="pref-shell__body">
      <SettingsContent v-if="activeTab === 'preferences'" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import SettingsContent from '@/components/core/layouts/art-settings-panel/SettingsContent.vue'
  import { useSettingsHandlers } from '@/components/core/layouts/art-settings-panel/composables/useSettingsHandlers'

  defineOptions({ name: 'Preferences' })

  const { domOperations } = useSettingsHandlers()

  onMounted(() => {
    domOperations.setBodyClass('theme-change', true)
  })

  onUnmounted(() => {
    domOperations.setBodyClass('theme-change', false)
  })

  const activeTab = ref('preferences')

  const pageTabs = [
    { id: 'preferences', icon: 'ri:settings-3-line', label: '偏好设置' }
    // 未来可在此扩展更多 tab
  ]
</script>

<style lang="scss" scoped>
  .pref-shell {
    display: flex;
    flex-direction: column;
    // 关键：使用布局系统计算好的可视高度，保证内部 flex 高度链生效
    height: var(--art-full-height, calc(100vh - 60px));
    max-height: var(--art-full-height, calc(100vh - 60px));
    overflow: hidden;
    background: var(--default-box-color);
    border-radius: calc(var(--custom-radius) / 2 + 2px);

    &__tabs {
      position: sticky;
      top: 0;
      z-index: 5;
      display: flex;
      flex-shrink: 0;
      gap: 2px;
      align-items: center;
      padding: 0 24px;
      background: var(--default-box-color);
      border-bottom: 1px solid var(--default-border);
    }

    &__tab {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 14px 4px 12px;
      margin-right: 20px;
      font-size: 13px;
      font-weight: 500;
      color: var(--art-gray-500);
      white-space: nowrap;
      cursor: pointer;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      transition:
        color 0.16s ease,
        border-color 0.16s ease;

      &:hover {
        color: var(--art-gray-700);
      }

      &.is-active {
        font-weight: 600;
        color: var(--theme-color, #6366f1);
        border-bottom-color: var(--theme-color, #6366f1);
      }
    }

    &__tab-icon {
      font-size: 15px;
    }

    &__body {
      flex: 1;
      min-height: 0;
      padding: 24px;
      overflow: hidden;
    }
  }
</style>
