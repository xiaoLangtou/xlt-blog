<template>
  <div class="pref-panel">
    <PrefGroup
      v-for="group in toggleGroups"
      :key="group.key"
      :title="group.title"
      :desc="group.desc"
      list
    >
      <PrefRow
        v-for="config in group.items"
        :key="config.key"
        :label="config.label"
        :desc="config.description"
        variant="switch"
        :mobile-hide="config.mobileHide"
      >
        <SettingToggle
          :model-value="getSettingValue(config.key)"
          @update:model-value="handleToggleChange(config.handler)"
        />
      </PrefRow>
    </PrefGroup>
  </div>
</template>

<script setup lang="ts">
  import PrefGroup from './PrefGroup.vue'
  import PrefRow from './PrefRow.vue'
  import SettingToggle from './SettingToggle.vue'
  import { useSettingStore } from '@/store/modules/setting'
  import { useSettingsConfig } from '../composables/useSettingsConfig'
  import { useSettingsHandlers } from '../composables/useSettingsHandlers'

  const settingStore = useSettingStore()
  const { toggleGroups } = useSettingsConfig()
  const { basicHandlers } = useSettingsHandlers()

  const {
    uniqueOpened,
    showMenuButton,
    showFastEnter,
    showRefreshButton,
    showCrumbs,
    showWorkTab,
    showLanguage,
    showNprogress,
    colorWeak,
    watermarkVisible
  } = storeToRefs(settingStore)

  const settingValueMap = {
    uniqueOpened,
    showMenuButton,
    showFastEnter,
    showRefreshButton,
    showCrumbs,
    showWorkTab,
    showLanguage,
    showNprogress,
    colorWeak,
    watermarkVisible
  }

  const getSettingValue = (key: string) => {
    const settingRef = settingValueMap[key as keyof typeof settingValueMap]
    return Boolean(settingRef?.value)
  }

  const handleToggleChange = (handlerName: string) => {
    const handler = (basicHandlers as Record<string, (...args: unknown[]) => void>)[handlerName]
    handler?.()
  }
</script>
