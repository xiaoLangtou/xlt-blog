import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export type SettingsTabId = 'appearance' | 'menu' | 'interface' | 'features'

export function useSettingsTabs() {
  const { t } = useI18n()
  const activeTab = ref<SettingsTabId>('appearance')

  const tabs = computed(() => [
    {
      id: 'appearance' as const,
      icon: 'ri:palette-line',
      label: t('setting.sections.appearance')
    },
    {
      id: 'menu' as const,
      icon: 'ri:layout-left-line',
      label: t('setting.sections.menuNav')
    },
    {
      id: 'interface' as const,
      icon: 'ri:window-line',
      label: t('setting.sections.interface')
    },
    {
      id: 'features' as const,
      icon: 'ri:toggle-line',
      label: t('setting.sections.features')
    }
  ])

  return {
    activeTab,
    tabs
  }
}
