<template>
  <div class="sp-page art-settings-panel art-settings-panel--page">
    <div class="sp-page__body">
      <!-- 左侧固定导航 -->
      <nav class="sp-nav">
        <div v-for="group in navGroups" :key="group.key" class="sp-nav__group">
          <div class="sp-nav__group-title">{{ group.title }}</div>
          <a
            v-for="item in group.items"
            :key="item.id"
            class="sp-nav__link"
            :class="{ 'is-active': activeSection === item.id }"
            href="javascript:void(0)"
            @click="scrollToSection(item.id)"
          >
            <ArtSvgIcon :icon="item.icon" class="sp-nav__link-icon" />
            <span>{{ item.label }}</span>
          </a>
        </div>
      </nav>

      <!-- 右侧滚动内容区 -->
      <div ref="scrollEl" class="sp-page__content">
        <!-- 主题风格 -->
        <section data-section="theme" class="sp-section">
          <div class="sp-card">
            <div class="sp-card__head">
              <div class="sp-card__icon sp-card__icon--orange">
                <ArtSvgIcon icon="ri:sun-line" />
              </div>
              <span class="sp-card__title">{{ $t('setting.theme.title') }}</span>
            </div>
            <div class="sp-card__body">
              <div class="sp-form-row sp-form-row--top">
                <div class="sp-form-row__info">
                  <span class="sp-form-row__label">{{ $t('setting.rows.displayMode.label') }}</span>
                  <span class="sp-form-row__desc">{{ $t('setting.rows.displayMode.desc') }}</span>
                </div>
                <div class="sp-pill-grid">
                  <button
                    v-for="(opt, index) in themeOptions"
                    :key="String(opt.value)"
                    type="button"
                    class="sp-pill"
                    :class="{ 'is-active': systemThemeMode === opt.value }"
                    @click="switchThemeStyles(opt.value)"
                  >
                    <div class="sp-pill__preview sp-pill__preview--thumb">
                      <div
                        class="sp-theme-prev"
                        :class="`sp-theme-prev--${['light', 'dark', 'auto'][index]}`"
                      >
                        <div class="sp-theme-prev__sb" />
                        <div class="sp-theme-prev__main">
                          <div class="sp-theme-prev__tb" />
                          <div class="sp-theme-prev__ct" />
                        </div>
                      </div>
                    </div>
                    <span class="sp-pill__label">{{ opt.label }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 菜单布局 -->
        <section v-if="width > 1000" data-section="layout" class="sp-section">
          <div class="sp-card">
            <div class="sp-card__head">
              <div class="sp-card__icon sp-card__icon--blue">
                <ArtSvgIcon icon="ri:layout-left-line" />
              </div>
              <span class="sp-card__title">{{ $t('setting.menuType.title') }}</span>
            </div>
            <div class="sp-card__body">
              <div class="sp-form-row sp-form-row--top">
                <div class="sp-form-row__info">
                  <span class="sp-form-row__label">{{ $t('setting.rows.layoutMode.label') }}</span>
                  <span class="sp-form-row__desc">{{ $t('setting.rows.layoutMode.desc') }}</span>
                </div>
                <div class="sp-pill-grid">
                  <button
                    v-for="(item, index) in configOptions.menuLayoutList"
                    :key="item.value"
                    type="button"
                    class="sp-pill"
                    :class="{ 'is-active': item.value === menuType }"
                    @click="switchMenuLayouts(item.value)"
                  >
                    <div class="sp-pill__preview sp-pill__preview--thumb">
                      <div
                        class="sp-layout-prev"
                        :class="`sp-layout-prev--${['left', 'top', 'mix', 'dual'][index]}`"
                      >
                        <template v-if="index === 0">
                          <div class="sp-lp__sb" />
                          <div class="sp-lp__main"><div class="sp-lp__tb" /></div>
                        </template>
                        <template v-else-if="index === 1">
                          <div class="sp-lp__tb sp-lp__tb--full" />
                          <div class="sp-lp__ct" />
                        </template>
                        <template v-else-if="index === 2">
                          <div class="sp-lp__tb sp-lp__tb--full" />
                          <div class="sp-lp__lower">
                            <div class="sp-lp__sb sp-lp__sb--sm" />
                            <div class="sp-lp__ct" />
                          </div>
                        </template>
                        <template v-else>
                          <div class="sp-lp__sb sp-lp__sb--dark" />
                          <div class="sp-lp__sb sp-lp__sb--mid" />
                          <div class="sp-lp__ct" />
                        </template>
                      </div>
                    </div>
                    <span class="sp-pill__label">{{ $t(`setting.menuType.list[${index}]`) }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 菜单风格 -->
        <section data-section="menu" class="sp-section">
          <div class="sp-card">
            <div class="sp-card__head">
              <div class="sp-card__icon sp-card__icon--green">
                <ArtSvgIcon icon="ri:menu-line" />
              </div>
              <span class="sp-card__title">{{ $t('setting.menu.title') }}</span>
            </div>
            <div class="sp-card__body">
              <div class="sp-form-row sp-form-row--top">
                <div class="sp-form-row__info">
                  <span class="sp-form-row__label">{{
                    $t('setting.rows.menuAppearance.label')
                  }}</span>
                  <span class="sp-form-row__desc">{{
                    $t('setting.rows.menuAppearance.desc')
                  }}</span>
                </div>
                <div class="sp-pill-grid">
                  <button
                    v-for="(item, index) in menuStyleOptions"
                    :key="item.theme"
                    type="button"
                    class="sp-pill"
                    :class="{
                      'is-active': item.theme === menuThemeType,
                      'is-disabled': disabled
                    }"
                    @click="switchMenuStyle(item.theme)"
                  >
                    <div class="sp-pill__preview sp-pill__preview--thumb">
                      <div
                        class="sp-menu-prev"
                        :class="`sp-menu-prev--${['dark', 'light', 'theme'][index]}`"
                      >
                        <div class="sp-mp__sb">
                          <div class="sp-mp__dot sp-mp__dot--active" />
                          <div class="sp-mp__dot" />
                          <div class="sp-mp__dot" />
                        </div>
                        <div class="sp-mp__main"><div class="sp-mp__tb" /></div>
                      </div>
                    </div>
                    <span class="sp-pill__label">{{ item.label }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 系统主题色 -->
        <section data-section="color" class="sp-section">
          <div class="sp-card">
            <div class="sp-card__head">
              <div class="sp-card__icon sp-card__icon--purple">
                <ArtSvgIcon icon="ri:drop-line" />
              </div>
              <span class="sp-card__title">{{ $t('setting.color.title') }}</span>
            </div>
            <div class="sp-card__body">
              <div class="sp-swatches">
                <button
                  v-for="color in configOptions.mainColors"
                  :key="color"
                  type="button"
                  class="sp-swatch"
                  :class="{ 'is-active': color === systemThemeColor }"
                  :style="{ '--sp-sw-color': color }"
                  :title="color"
                  @click="colorHandlers.selectColor(color)"
                >
                  <ArtSvgIcon v-if="color === systemThemeColor" icon="ri:check-line" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 盒子样式与容器宽度 -->
        <section data-section="box" class="sp-section">
          <div class="sp-card">
            <div class="sp-card__head">
              <div class="sp-card__icon sp-card__icon--teal">
                <ArtSvgIcon icon="ri:layout-3-line" />
              </div>
              <span class="sp-card__title"
                >{{ $t('setting.box.title') }} · {{ $t('setting.container.title') }}</span
              >
            </div>
            <div class="sp-card__body">
              <div class="sp-form-row">
                <div class="sp-form-row__info">
                  <span class="sp-form-row__label">{{ $t('setting.box.title') }}</span>
                  <span class="sp-form-row__desc">{{ $t('setting.cards.boxStyle.desc') }}</span>
                </div>
                <div class="sp-pill-grid">
                  <button
                    v-for="opt in boxStyleOptions"
                    :key="opt.value"
                    type="button"
                    class="sp-pill"
                    :class="{ 'is-active': boxMode === opt.value }"
                    @click="handleBoxModeChange(opt.value as 'border-mode' | 'shadow-mode')"
                  >
                    <div class="sp-pill__preview">
                      <div :class="opt.value === 'border-mode' ? 'sp-pill__bd' : 'sp-pill__sh'" />
                    </div>
                    <span class="sp-pill__label">{{ opt.label }}</span>
                  </button>
                </div>
              </div>
              <div class="sp-divider" />
              <div class="sp-form-row">
                <div class="sp-form-row__info">
                  <span class="sp-form-row__label">{{ $t('setting.container.title') }}</span>
                  <span class="sp-form-row__desc">{{
                    $t('setting.cards.containerWidth.desc')
                  }}</span>
                </div>
                <div class="sp-pill-grid">
                  <button
                    v-for="opt in containerWidthOptions"
                    :key="opt.value"
                    type="button"
                    class="sp-pill"
                    :class="{ 'is-active': containerWidth === opt.value }"
                    @click="containerHandlers.setWidth(opt.value)"
                  >
                    <div class="sp-pill__preview">
                      <div :class="opt.value === '100%' ? 'sp-pill__wf' : 'sp-pill__wf2'" />
                    </div>
                    <span class="sp-pill__label">{{ opt.label }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 基础配置 -->
        <section data-section="basic" class="sp-section">
          <div class="sp-card">
            <div class="sp-card__head">
              <div class="sp-card__icon sp-card__icon--orange">
                <ArtSvgIcon icon="ri:settings-3-line" />
              </div>
              <span class="sp-card__title">{{ $t('basics.title', '基础配置') }}</span>
            </div>
            <div class="sp-card__body sp-card__body--rows">
              <div
                v-for="item in basicGroup"
                :key="item.key"
                class="sp-toggle-row"
                :class="{ 'sp-mobile-hide': item.mobileHide }"
              >
                <div class="sp-toggle-row__info">
                  <span class="sp-toggle-row__label">{{ item.label }}</span>
                  <span v-if="item.description" class="sp-toggle-row__desc">{{
                    item.description
                  }}</span>
                </div>
                <SettingToggle
                  :model-value="getSettingValue(item.key)"
                  @update:model-value="handleToggle(item.handler)"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- 功能开关 -->
        <section data-section="features" class="sp-section">
          <div class="sp-card">
            <div class="sp-card__head">
              <div class="sp-card__icon sp-card__icon--pink">
                <ArtSvgIcon icon="ri:toggle-line" />
              </div>
              <span class="sp-card__title">{{ $t('features.title', '功能开关') }}</span>
            </div>
            <div class="sp-card__body sp-card__body--rows">
              <div v-for="item in featureGroup" :key="item.key" class="sp-toggle-row">
                <div class="sp-toggle-row__info">
                  <span class="sp-toggle-row__label">{{ item.label }}</span>
                  <span v-if="item.description" class="sp-toggle-row__desc">{{
                    item.description
                  }}</span>
                </div>
                <SettingToggle
                  :model-value="getSettingValue(item.key)"
                  @update:model-value="handleToggle(item.handler)"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- 标签页 · 动画 · 菜单宽度 -->
        <section data-section="tabs" class="sp-section">
          <div class="sp-card">
            <div class="sp-card__head">
              <div class="sp-card__icon sp-card__icon--blue">
                <ArtSvgIcon icon="ri:window-line" />
              </div>
              <span class="sp-card__title"
                >{{ $t('setting.cards.tabStyle.title') }} ·
                {{ $t('setting.cards.pageTransition.title') }} ·
                {{ $t('setting.cards.menuWidth.title') }}</span
              >
            </div>
            <div class="sp-card__body">
              <!-- 菜单宽度 -->
              <div class="sp-form-row">
                <div class="sp-form-row__info">
                  <span class="sp-form-row__label">{{ $t('setting.cards.menuWidth.title') }}</span>
                  <span class="sp-form-row__desc">{{ $t('setting.rows.menuOpenWidth.desc') }}</span>
                </div>
                <div class="sp-range-row">
                  <input
                    class="sp-range"
                    type="range"
                    min="180"
                    max="320"
                    step="10"
                    :value="menuOpenWidth"
                    @input="handleWidthChange"
                  />
                  <div class="sp-range-val">{{ menuOpenWidth }}px</div>
                </div>
              </div>
              <div class="sp-divider" />
              <!-- 标签页风格 -->
              <div class="sp-form-row sp-form-row--top">
                <div class="sp-form-row__info">
                  <span class="sp-form-row__label">{{ $t('setting.cards.tabStyle.title') }}</span>
                  <span class="sp-form-row__desc">{{ $t('setting.rows.tabAppearance.desc') }}</span>
                </div>
                <div class="sp-tab-grid">
                  <button
                    v-for="opt in tabStyleOptions"
                    :key="opt.value"
                    type="button"
                    class="sp-tab-card"
                    :class="{ 'is-active': tabStyle === opt.value }"
                    @click="basicHandlers.tabStyle(opt.value)"
                  >
                    <div class="sp-tab-card__preview">
                      <TabStylePreview :type="opt.value" />
                    </div>
                    <span class="sp-tab-card__label">{{ opt.label }}</span>
                  </button>
                </div>
              </div>
              <div class="sp-divider" />
              <!-- 页面切换动画 -->
              <div class="sp-form-row sp-form-row--top">
                <div class="sp-form-row__info">
                  <span class="sp-form-row__label">{{
                    $t('setting.cards.pageTransition.title')
                  }}</span>
                  <span class="sp-form-row__desc">{{ $t('setting.rows.animationType.desc') }}</span>
                </div>
                <div class="sp-anim-grid">
                  <button
                    v-for="opt in pageTransitionOptions"
                    :key="opt.value"
                    type="button"
                    class="sp-anim-card"
                    :class="[{ 'is-active': pageTransition === opt.value }, `is-${opt.type}`]"
                    @click="basicHandlers.pageTransition(opt.value)"
                  >
                    <div class="sp-anim-card__preview">
                      <div class="sp-anim-card__chrome"> <span /><span /><span /> </div>
                      <div class="sp-anim-card__page"> <i /><i /><i /> </div>
                    </div>
                    <div class="sp-anim-card__meta">
                      <ArtSvgIcon :icon="opt.icon" class="sp-anim-card__icon" />
                      <span class="sp-anim-card__label">{{ opt.label }}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 自定义圆角 -->
        <section data-section="radius" class="sp-section">
          <div class="sp-card">
            <div class="sp-card__head">
              <div class="sp-card__icon sp-card__icon--purple">
                <ArtSvgIcon icon="ri:rounded-corner" />
              </div>
              <span class="sp-card__title">{{ $t('setting.cards.borderRadius.title') }}</span>
            </div>
            <div class="sp-card__body">
              <div class="sp-form-row sp-form-row--top">
                <div class="sp-form-row__info">
                  <span class="sp-form-row__label">{{
                    $t('setting.cards.borderRadius.title')
                  }}</span>
                  <span class="sp-form-row__desc">{{ $t('setting.rows.radiusFactor.desc') }}</span>
                </div>
                <div class="sp-pill-grid sp-pill-grid--radius">
                  <button
                    v-for="opt in radiusOptions"
                    :key="opt.value"
                    type="button"
                    class="sp-pill"
                    :class="{ 'is-active': customRadius === opt.value }"
                    @click="basicHandlers.customRadius(opt.value)"
                  >
                    <div class="sp-pill__preview">
                      <div class="sp-radius-shape" :style="{ borderRadius: opt.preview }" />
                    </div>
                    <span class="sp-pill__label">{{ opt.label }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- 操作按钮（固定在面板底部，不随内容滚动） -->
    <footer class="sp-page__footer">
      <SettingActions />
    </footer>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useI18n } from 'vue-i18n'
  import SettingActions from './widget/SettingActions.vue'
  import SettingToggle from './widget/SettingToggle.vue'
  import TabStylePreview from './widget/TabStylePreview.vue'
  import { useSettingsConfig } from './composables/useSettingsConfig'
  import { useSettingsHandlers } from './composables/useSettingsHandlers'
  import { useSettingsState } from './composables/useSettingsState'
  import { useSettingsScrollSpy } from './composables/useSettingsScrollSpy'
  import { useSettingStore } from '@/store/modules/setting'
  import { SystemThemeEnum, MenuThemeEnum, MenuTypeEnum } from '@/enums/appEnum'
  import { useTheme } from '@/hooks/core/useTheme'

  defineOptions({ name: 'SettingsContent' })

  const { t } = useI18n()
  const { width } = useWindowSize()
  const settingStore = useSettingStore()
  const {
    systemThemeMode,
    systemThemeColor,
    customRadius,
    menuType,
    menuThemeType,
    menuOpenWidth,
    isDark,
    boxBorderMode,
    containerWidth,
    tabStyle,
    pageTransition,
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

  const { switchThemeStyles } = useTheme()
  const {
    configOptions,
    menuStyleOptions,
    boxStyleOptions,
    containerWidthOptions,
    tabStyleOptions,
    pageTransitionOptions,
    toggleSettingsConfig
  } = useSettingsConfig()
  const { basicHandlers, boxStyleHandlers, colorHandlers, containerHandlers } =
    useSettingsHandlers()
  const { switchMenuLayouts } = useSettingsState()

  // ─── 主题选项 ───────────────────────────────────────────────────────────────
  const themeIcons: Record<SystemThemeEnum, string> = {
    [SystemThemeEnum.LIGHT]: 'ri:sun-line',
    [SystemThemeEnum.DARK]: 'ri:moon-line',
    [SystemThemeEnum.AUTO]: 'ri:contrast-2-line'
  }

  const themeOptions = computed(() =>
    configOptions.themeList.map((item, index) => ({
      value: item.theme,
      label: t(`setting.theme.list[${index}]`),
      icon: themeIcons[item.theme as SystemThemeEnum] || 'ri:sun-line'
    }))
  )

  // ─── 菜单风格 ───────────────────────────────────────────────────────────────
  const isTopMenu = computed(() => menuType.value === MenuTypeEnum.TOP)
  const isDualMenu = computed(() => menuType.value === MenuTypeEnum.DUAL_MENU)
  const disabled = computed(() => isTopMenu.value || isDualMenu.value || isDark.value)

  const switchMenuStyle = (theme: MenuThemeEnum) => {
    if (disabled.value) return
    settingStore.switchMenuStyles(theme)
  }

  // ─── 盒子样式 ───────────────────────────────────────────────────────────────
  const boxMode = computed(() => (boxBorderMode.value ? 'border-mode' : 'shadow-mode'))
  const handleBoxModeChange = (value: 'border-mode' | 'shadow-mode') => {
    boxStyleHandlers.setBoxMode(value)
  }

  // ─── 圆角选项 ───────────────────────────────────────────────────────────────
  const radiusOptions = computed(() => [
    { value: '0', label: '0', preview: '0px' },
    { value: '0.25', label: '0.25', preview: '4px' },
    { value: '0.5', label: '0.5', preview: '8px' },
    { value: '0.75', label: '0.75', preview: '14px' },
    { value: '1', label: '1', preview: '22px' }
  ])

  // ─── 功能开关 ───────────────────────────────────────────────────────────────
  const basicKeys = [
    'showWorkTab',
    'uniqueOpened',
    'showMenuButton',
    'showFastEnter',
    'showRefreshButton',
    'showCrumbs'
  ]
  const featureKeys = ['showLanguage', 'showNprogress', 'colorWeak', 'watermarkVisible']

  const basicGroup = computed(() =>
    toggleSettingsConfig.value.filter((s) => basicKeys.includes(s.key))
  )
  const featureGroup = computed(() =>
    toggleSettingsConfig.value.filter((s) => featureKeys.includes(s.key))
  )

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
    const ref = settingValueMap[key as keyof typeof settingValueMap]
    return Boolean(ref?.value)
  }

  const handleToggle = (handlerName: string) => {
    const handler = (basicHandlers as Record<string, (...args: unknown[]) => void>)[handlerName]
    handler?.()
  }

  // ─── 导航 ────────────────────────────────────────────────────────────────────
  const navGroups = computed(() => [
    {
      key: 'appearance',
      title: t('setting.sections.appearance'),
      items: [
        { id: 'theme', icon: 'ri:sun-line', label: t('setting.theme.title') },
        ...(width.value > 1000
          ? [{ id: 'layout', icon: 'ri:layout-left-line', label: t('setting.menuType.title') }]
          : []),
        { id: 'menu', icon: 'ri:menu-line', label: t('setting.menu.title') },
        { id: 'color', icon: 'ri:drop-line', label: t('setting.color.title') },
        {
          id: 'box',
          icon: 'ri:layout-3-line',
          label: `${t('setting.box.title')} · ${t('setting.container.title')}`
        }
      ]
    },
    {
      key: 'function',
      title: t('setting.sections.features'),
      items: [
        { id: 'basic', icon: 'ri:settings-3-line', label: t('setting.basics.title', '基础配置') },
        { id: 'features', icon: 'ri:toggle-line', label: t('setting.sections.features') },
        { id: 'tabs', icon: 'ri:window-line', label: t('setting.cards.tabStyle.title') },
        { id: 'radius', icon: 'ri:rounded-corner', label: t('setting.cards.borderRadius.title') }
      ]
    }
  ])

  // ─── Scrollspy ────────────────────────────────────────────────────────────────
  const scrollEl = ref<HTMLElement | null>(null)
  const { activeSection, scrollToSection } = useSettingsScrollSpy(scrollEl)

  // ─── 滑块进度填充 ────────────────────────────────────────────────────────────
  const rangeEl = ref<HTMLInputElement | null>(null)

  const updateRangePct = (val: number) => {
    const pct = ((val - 180) / (320 - 180)) * 100
    rangeEl.value?.style.setProperty('--sp-range-pct', `${pct}%`)
  }

  const handleWidthChange = (event: Event) => {
    const value = Number((event.target as HTMLInputElement).value)
    basicHandlers.menuOpenWidth(value)
    updateRangePct(value)
  }

  onMounted(() => {
    updateRangePct(menuOpenWidth.value)
  })
</script>

<style lang="scss">
  @use './style';
  @use './preferences';
</style>
