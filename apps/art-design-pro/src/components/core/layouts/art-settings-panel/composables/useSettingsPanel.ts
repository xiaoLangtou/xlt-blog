import { ref, computed, watch } from 'vue'
import { useSettingStore } from '@/store/modules/setting'
import { storeToRefs } from 'pinia'
import { useBreakpoints } from '@vueuse/core'
import AppConfig from '@/config'
import { SystemThemeEnum, MenuTypeEnum } from '@/enums/appEnum'
import { mittBus } from '@/utils/sys'
import { StorageConfig } from '@/utils'
import { useTheme } from '@/hooks/core/useTheme'
import { useCeremony } from '@/hooks/core/useCeremony'
import { useSettingsState } from './useSettingsState'
import { useSettingsHandlers } from './useSettingsHandlers'
import { router } from '@/router'

/**
 * 设置面板核心逻辑管理
 */
export function useSettingsPanel() {
  const settingStore = useSettingStore()
  const { systemThemeType, systemThemeMode, menuType } = storeToRefs(settingStore)

  const { openFestival, cleanup } = useCeremony()
  const { setSystemTheme, setSystemAutoTheme } = useTheme()
  const { initColorWeak } = useSettingsState()
  const { domOperations } = useSettingsHandlers()

  const breakpoints = useBreakpoints({ tablet: 1000 })
  const isMobile = breakpoints.smaller('tablet')

  const getStoredDesktopMenuType = (): MenuTypeEnum | undefined => {
    const storedMenuType = localStorage.getItem(StorageConfig.RESPONSIVE_MENU_TYPE_KEY)
    return Object.values(MenuTypeEnum).includes(storedMenuType as MenuTypeEnum)
      ? (storedMenuType as MenuTypeEnum)
      : undefined
  }

  const setStoredDesktopMenuType = (type: MenuTypeEnum) => {
    localStorage.setItem(StorageConfig.RESPONSIVE_MENU_TYPE_KEY, type)
  }

  const clearStoredDesktopMenuType = () => {
    localStorage.removeItem(StorageConfig.RESPONSIVE_MENU_TYPE_KEY)
  }

  const storedDesktopMenuType = getStoredDesktopMenuType()
  const beforeMenuType = ref<MenuTypeEnum | undefined>(storedDesktopMenuType)
  const hasChangedMenu = ref(Boolean(storedDesktopMenuType))

  const systemThemeColor = computed(() => settingStore.systemThemeColor as string)

  const useThemeHandlers = () => {
    const initSystemColor = () => {
      if (!AppConfig.systemMainColor.includes(systemThemeColor.value)) {
        settingStore.setElementTheme(AppConfig.systemMainColor[0])
        settingStore.reload()
      }
    }

    const initSystemTheme = () => {
      if (systemThemeMode.value === SystemThemeEnum.AUTO) {
        setSystemAutoTheme()
      } else {
        setSystemTheme(systemThemeType.value)
      }
    }

    const listenerSystemTheme = () => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', initSystemTheme)
      return () => {
        mediaQuery.removeEventListener('change', initSystemTheme)
      }
    }

    return {
      initSystemColor,
      initSystemTheme,
      listenerSystemTheme
    }
  }

  const useResponsiveLayout = () => {
    const stopWatch = watch(
      isMobile,
      (mobile: boolean) => {
        if (mobile) {
          if (!hasChangedMenu.value) {
            beforeMenuType.value = menuType.value
            if (menuType.value !== MenuTypeEnum.LEFT) {
              setStoredDesktopMenuType(menuType.value)
              useSettingsState().switchMenuLayouts(MenuTypeEnum.LEFT)
              hasChangedMenu.value = true
            }
          }

          settingStore.setMenuOpen(false)
        } else {
          if (hasChangedMenu.value && beforeMenuType.value) {
            if (menuType.value === MenuTypeEnum.LEFT) {
              useSettingsState().switchMenuLayouts(beforeMenuType.value)
            }

            clearStoredDesktopMenuType()
            hasChangedMenu.value = false
          }

          settingStore.setMenuOpen(true)
        }
      },
      { immediate: true }
    )

    return { stopWatch }
  }

  const openPreferencesPage = () => {
    router.push({ name: 'Preferences' })
  }

  const useSettingsInitializer = () => {
    const themeHandlers = useThemeHandlers()
    const { stopWatch } = useResponsiveLayout()
    let themeCleanup: (() => void) | null = null

    const initializeSettings = () => {
      mittBus.on('openSetting', openPreferencesPage)
      themeHandlers.initSystemColor()
      themeCleanup = themeHandlers.listenerSystemTheme()
      initColorWeak()

      const boxMode = settingStore.boxBorderMode ? 'border-mode' : 'shadow-mode'
      domOperations.setRootAttribute('data-box-mode', boxMode)

      themeHandlers.initSystemTheme()
      openFestival()
    }

    const cleanupSettings = () => {
      mittBus.off('openSetting', openPreferencesPage)
      stopWatch()
      themeCleanup?.()
      cleanup()
    }

    return {
      initializeSettings,
      cleanupSettings
    }
  }

  return {
    useThemeHandlers,
    useResponsiveLayout,
    useSettingsInitializer,
    openPreferencesPage
  }
}
