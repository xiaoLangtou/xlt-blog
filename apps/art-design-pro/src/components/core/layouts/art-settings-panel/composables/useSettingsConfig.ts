import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ContainerWidthEnum, MenuThemeEnum } from '@/enums/appEnum'
import AppConfig from '@/config'
import { headerBarConfig } from '@/config/modules/headerBar'

/**
 * 设置项配置选项管理
 */
export function useSettingsConfig() {
  const { t } = useI18n()

  // 标签页风格选项
  const tabStyleOptions = computed(() => [
    {
      value: 'tab-default',
      label: t('setting.tabStyle.default')
    },
    {
      value: 'tab-card',
      label: t('setting.tabStyle.card')
    },
    {
      value: 'tab-google',
      label: t('setting.tabStyle.google')
    }
  ])

  // 页面切换动画选项
  const pageTransitionOptions = computed(() => [
    {
      value: '',
      type: 'none' as const,
      icon: 'ri:prohibited-line',
      label: t('setting.transition.list.none'),
      description: t('setting.transition.desc.none')
    },
    {
      value: 'fade',
      type: 'fade' as const,
      icon: 'ri:contrast-2-line',
      label: t('setting.transition.list.fade'),
      description: t('setting.transition.desc.fade')
    },
    {
      value: 'slide-left',
      type: 'slide-left' as const,
      icon: 'ri:arrow-left-line',
      label: t('setting.transition.list.slideLeft'),
      description: t('setting.transition.desc.slideLeft')
    },
    {
      value: 'slide-bottom',
      type: 'slide-bottom' as const,
      icon: 'ri:arrow-down-line',
      label: t('setting.transition.list.slideBottom'),
      description: t('setting.transition.desc.slideBottom')
    },
    {
      value: 'slide-top',
      type: 'slide-top' as const,
      icon: 'ri:arrow-up-line',
      label: t('setting.transition.list.slideTop'),
      description: t('setting.transition.desc.slideTop')
    }
  ])

  // 圆角大小选项
  const customRadiusOptions = [
    { value: '0', label: '0' },
    { value: '0.25', label: '0.25' },
    { value: '0.5', label: '0.5' },
    { value: '0.75', label: '0.75' },
    { value: '1', label: '1' }
  ]

  // 容器宽度选项
  const containerWidthOptions = computed(() => [
    {
      value: ContainerWidthEnum.FULL,
      label: t('setting.container.list[0]'),
      icon: 'icon-park-outline:auto-width'
    },
    {
      value: ContainerWidthEnum.BOXED,
      label: t('setting.container.list[1]'),
      icon: 'ix:width'
    }
  ])

  // 盒子样式选项
  const boxStyleOptions = computed(() => [
    {
      value: 'border-mode',
      label: t('setting.box.list[0]'),
      type: 'border-mode' as const
    },
    {
      value: 'shadow-mode',
      label: t('setting.box.list[1]'),
      type: 'shadow-mode' as const
    }
  ])

  // 从配置文件获取的选项
  const configOptions = {
    // 主题色彩选项
    mainColors: AppConfig.systemMainColor,

    // 主题风格选项
    themeList: AppConfig.settingThemeList,

    // 菜单布局选项
    menuLayoutList: AppConfig.menuLayoutList
  }

  // 菜单风格选项
  const menuStyleOptions = computed(() => [
    {
      theme: MenuThemeEnum.DESIGN,
      icon: 'ri:layout-left-line',
      label: t('setting.menu.styles.design')
    },
    {
      theme: MenuThemeEnum.DARK,
      icon: 'ri:layout-left-2-line',
      label: t('setting.menu.styles.dark')
    },
    {
      theme: MenuThemeEnum.LIGHT,
      icon: 'ri:palette-line',
      label: t('setting.menu.styles.light')
    }
  ])

  // 功能开关配置
  const toggleSettingsConfig = computed(() => {
    const allSettings = [
      {
        key: 'showWorkTab',
        label: t('setting.basics.list.multiTab'),
        description: t('setting.descriptions.multiTab'),
        icon: 'ri:layout-top-line',
        handler: 'workTab',
        headerBarKey: null
      },
      {
        key: 'uniqueOpened',
        label: t('setting.basics.list.accordion'),
        description: t('setting.descriptions.accordion'),
        icon: 'ri:node-tree',
        handler: 'uniqueOpened',
        headerBarKey: null
      },
      {
        key: 'showMenuButton',
        label: t('setting.basics.list.collapseSidebar'),
        description: t('setting.descriptions.collapseSidebar'),
        icon: 'ri:layout-left-2-line',
        handler: 'menuButton',
        headerBarKey: 'menuButton' as const
      },
      {
        key: 'showFastEnter',
        label: t('setting.basics.list.fastEnter'),
        description: t('setting.descriptions.fastEnter'),
        icon: 'ri:flashlight-line',
        handler: 'fastEnter',
        headerBarKey: 'fastEnter' as const
      },
      {
        key: 'showRefreshButton',
        label: t('setting.basics.list.reloadPage'),
        description: t('setting.descriptions.reloadPage'),
        icon: 'ri:refresh-line',
        handler: 'refreshButton',
        headerBarKey: 'refreshButton' as const
      },
      {
        key: 'showCrumbs',
        label: t('setting.basics.list.breadcrumb'),
        description: t('setting.descriptions.breadcrumb'),
        icon: 'ri:road-map-line',
        handler: 'crumbs',
        mobileHide: true,
        headerBarKey: 'breadcrumb' as const
      },
      {
        key: 'showLanguage',
        label: t('setting.basics.list.language'),
        description: t('setting.descriptions.language'),
        icon: 'ri:translate-2',
        handler: 'language',
        headerBarKey: 'language' as const
      },
      {
        key: 'showNprogress',
        label: t('setting.basics.list.progressBar'),
        description: t('setting.descriptions.progressBar'),
        icon: 'ri:loader-4-line',
        handler: 'nprogress',
        headerBarKey: null
      },
      {
        key: 'colorWeak',
        label: t('setting.basics.list.weakMode'),
        description: t('setting.descriptions.weakMode'),
        icon: 'ri:contrast-drop-line',
        handler: 'colorWeak',
        headerBarKey: null
      },
      {
        key: 'watermarkVisible',
        label: t('setting.basics.list.watermark'),
        description: t('setting.descriptions.watermark'),
        icon: 'ri:drop-line',
        handler: 'watermark',
        headerBarKey: null
      }
    ]

    return allSettings
      .filter((setting) => {
        if (setting.headerBarKey === null) return true
        const headerBarFeature = headerBarConfig[setting.headerBarKey]
        return headerBarFeature?.enabled !== false
      })
      .map(({ headerBarKey: _headerBarKey, ...setting }) => setting)
  })

  const toggleGroups = computed(() => {
    const allSettings = toggleSettingsConfig.value
    const pick = (keys: string[]) => allSettings.filter((setting) => keys.includes(setting.key))

    return [
      {
        key: 'nav',
        icon: 'ri:layout-top-line',
        tone: 'green' as const,
        title: t('setting.cards.navLayout.title'),
        desc: t('setting.cards.navLayout.desc'),
        items: pick(['showWorkTab', 'uniqueOpened', 'showMenuButton', 'showCrumbs'])
      },
      {
        key: 'toolbar',
        icon: 'ri:tools-line',
        tone: 'green' as const,
        title: t('setting.cards.toolbar.title'),
        desc: t('setting.cards.toolbar.desc'),
        items: pick(['showFastEnter', 'showRefreshButton', 'showNprogress'])
      },
      {
        key: 'display',
        icon: 'ri:eye-line',
        tone: 'green' as const,
        title: t('setting.cards.display.title'),
        desc: t('setting.cards.display.desc'),
        items: pick(['showLanguage', 'colorWeak', 'watermarkVisible'])
      }
    ].filter((group) => group.items.length > 0)
  })

  // 基础设置项配置
  const basicSettingsConfig = computed(() => {
    // 定义所有基础设置项
    const allSettings = [
      {
        key: 'showWorkTab',
        label: t('setting.basics.list.multiTab'),
        type: 'switch' as const,
        handler: 'workTab',
        headerBarKey: null // 不依赖headerBar配置
      },
      {
        key: 'uniqueOpened',
        label: t('setting.basics.list.accordion'),
        type: 'switch' as const,
        handler: 'uniqueOpened',
        headerBarKey: null // 不依赖headerBar配置
      },
      {
        key: 'showMenuButton',
        label: t('setting.basics.list.collapseSidebar'),
        type: 'switch' as const,
        handler: 'menuButton',
        headerBarKey: 'menuButton' as const
      },
      {
        key: 'showFastEnter',
        label: t('setting.basics.list.fastEnter'),
        type: 'switch' as const,
        handler: 'fastEnter',
        headerBarKey: 'fastEnter' as const
      },
      {
        key: 'showRefreshButton',
        label: t('setting.basics.list.reloadPage'),
        type: 'switch' as const,
        handler: 'refreshButton',
        headerBarKey: 'refreshButton' as const
      },
      {
        key: 'showCrumbs',
        label: t('setting.basics.list.breadcrumb'),
        type: 'switch' as const,
        handler: 'crumbs',
        mobileHide: true,
        headerBarKey: 'breadcrumb' as const
      },
      {
        key: 'showLanguage',
        label: t('setting.basics.list.language'),
        type: 'switch' as const,
        handler: 'language',
        headerBarKey: 'language' as const
      },
      {
        key: 'showNprogress',
        label: t('setting.basics.list.progressBar'),
        type: 'switch' as const,
        handler: 'nprogress',
        headerBarKey: null // 不依赖headerBar配置
      },
      {
        key: 'colorWeak',
        label: t('setting.basics.list.weakMode'),
        type: 'switch' as const,
        handler: 'colorWeak',
        headerBarKey: null // 不依赖headerBar配置
      },
      {
        key: 'watermarkVisible',
        label: t('setting.basics.list.watermark'),
        type: 'switch' as const,
        handler: 'watermark',
        headerBarKey: null // 不依赖headerBar配置
      },
      {
        key: 'menuOpenWidth',
        label: t('setting.basics.list.menuWidth'),
        type: 'input-number' as const,
        handler: 'menuOpenWidth',
        min: 180,
        max: 320,
        step: 10,
        style: { width: '120px' },
        controlsPosition: 'right' as const,
        headerBarKey: null // 不依赖headerBar配置
      },
      {
        key: 'tabStyle',
        label: t('setting.basics.list.tabStyle'),
        type: 'select' as const,
        handler: 'tabStyle',
        options: tabStyleOptions.value,
        style: { width: '120px' },
        headerBarKey: null // 不依赖headerBar配置
      },
      {
        key: 'pageTransition',
        label: t('setting.basics.list.pageTransition'),
        type: 'select' as const,
        handler: 'pageTransition',
        options: pageTransitionOptions.value,
        style: { width: '120px' },
        headerBarKey: null // 不依赖headerBar配置
      },
      {
        key: 'customRadius',
        label: t('setting.basics.list.borderRadius'),
        type: 'select' as const,
        handler: 'customRadius',
        options: customRadiusOptions,
        style: { width: '120px' },
        headerBarKey: null // 不依赖headerBar配置
      }
    ]

    // 根据 headerBarConfig 过滤设置项
    return (
      allSettings
        .filter((setting) => {
          // 如果设置项不依赖headerBar配置，则始终显示
          if (setting.headerBarKey === null) {
            return true
          }

          // 如果依赖headerBar配置，检查对应的功能是否启用
          const headerBarFeature = headerBarConfig[setting.headerBarKey]
          return headerBarFeature?.enabled !== false
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(({ headerBarKey: _headerBarKey, ...setting }) => setting)
    )
  })

  return {
    // 选项配置
    tabStyleOptions,
    pageTransitionOptions,
    customRadiusOptions,
    containerWidthOptions,
    boxStyleOptions,
    configOptions,
    menuStyleOptions,
    toggleSettingsConfig,
    toggleGroups,

    // 设置项配置
    basicSettingsConfig
  }
}
