<!-- 设置操作按钮 -->
<template>
  <div class="pref-actions">
    <ElButton v-ripple @click="handleResetConfig">
      {{ $t('setting.actions.resetConfig') }}
    </ElButton>
    <ElButton v-ripple type="primary" @click="handleSaveConfig">
      {{ $t('setting.actions.saveConfig') }}
    </ElButton>
  </div>
</template>

<script setup lang="ts">
  import { nextTick } from 'vue'
  import { useSettingStore } from '@/store/modules/setting'
  import { SETTING_DEFAULT_CONFIG } from '@/config/setting'
  import { useI18n } from 'vue-i18n'
  import { MenuThemeEnum } from '@/enums/appEnum'
  import { useTheme } from '@/hooks/core/useTheme'

  defineOptions({ name: 'SettingActions' })

  const emit = defineEmits<{
    save: []
  }>()

  const { t } = useI18n()
  const settingStore = useSettingStore()
  const { switchThemeStyles } = useTheme()

  const toggleIfDifferent = (
    currentValue: boolean,
    defaultValue: boolean,
    toggleFn: () => void
  ) => {
    if (currentValue !== defaultValue) {
      toggleFn()
    }
  }

  const handleSaveConfig = () => {
    ElMessage.success({
      message: t('setting.actions.saveSuccess'),
      duration: 2000
    })
    emit('save')
  }

  const handleResetConfig = async () => {
    try {
      const config = SETTING_DEFAULT_CONFIG

      settingStore.switchMenuLayouts(config.menuType)
      settingStore.setMenuOpenWidth(config.menuOpenWidth)
      settingStore.setMenuOpen(config.menuOpen)
      settingStore.setDualMenuShowText(config.dualMenuShowText)

      switchThemeStyles(config.systemThemeMode)

      await nextTick()
      const menuTheme = settingStore.isDark ? MenuThemeEnum.DARK : config.menuThemeType
      settingStore.switchMenuStyles(menuTheme)

      settingStore.setElementTheme(config.systemThemeColor)

      toggleIfDifferent(settingStore.showMenuButton, config.showMenuButton, () =>
        settingStore.setButton()
      )
      toggleIfDifferent(settingStore.showFastEnter, config.showFastEnter, () =>
        settingStore.setFastEnter()
      )
      toggleIfDifferent(settingStore.showRefreshButton, config.showRefreshButton, () =>
        settingStore.setShowRefreshButton()
      )
      toggleIfDifferent(settingStore.showCrumbs, config.showCrumbs, () => settingStore.setCrumbs())
      toggleIfDifferent(settingStore.showLanguage, config.showLanguage, () =>
        settingStore.setLanguage()
      )
      toggleIfDifferent(settingStore.showNprogress, config.showNprogress, () =>
        settingStore.setNprogress()
      )

      settingStore.setWorkTab(config.showWorkTab)
      settingStore.setShowFestivalText(config.showFestivalText)
      settingStore.setWatermarkVisible(config.watermarkVisible)

      toggleIfDifferent(settingStore.autoClose, config.autoClose, () => settingStore.setAutoClose())
      toggleIfDifferent(settingStore.uniqueOpened, config.uniqueOpened, () =>
        settingStore.setUniqueOpened()
      )
      toggleIfDifferent(settingStore.colorWeak, config.colorWeak, () => settingStore.setColorWeak())

      toggleIfDifferent(settingStore.boxBorderMode, config.boxBorderMode, () =>
        settingStore.setBorderMode()
      )
      settingStore.setPageTransition(config.pageTransition)
      settingStore.setTabStyle(config.tabStyle)
      settingStore.setCustomRadius(config.customRadius)
      settingStore.setContainerWidth(config.containerWidth)

      settingStore.setFestivalDate(config.festivalDate)
      settingStore.setholidayFireworksLoaded(config.holidayFireworksLoaded)

      location.reload()
    } catch (error) {
      console.error('重置配置失败:', error)
      ElMessage.error(t('setting.actions.resetFailed'))
    }
  }
</script>
