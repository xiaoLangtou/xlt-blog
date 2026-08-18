<template>
  <div class="pref-panel">
    <PrefGroup
      v-if="width > 1000"
      :title="$t('setting.menuType.title')"
      :desc="$t('setting.rows.layoutMode.desc')"
      flush
    >
      <div class="pref-layout-grid">
        <LayoutPreviewCard
          v-for="(item, index) in configOptions.menuLayoutList"
          :key="item.value"
          :type="item.value"
          :label="$t(`setting.menuType.list[${index}]`)"
          :active="item.value === menuType"
          @select="switchMenuLayouts(item.value)"
        />
      </div>
    </PrefGroup>

    <PrefGroup
      :title="$t('setting.menu.title')"
      :desc="$t('setting.rows.menuAppearance.desc')"
      flush
    >
      <div class="pref-menu-grid">
        <div
          v-for="item in menuStyleOptions"
          :key="item.theme"
          class="pref-menu-card"
          :class="{
            'is-active': item.theme === menuThemeType,
            'is-disabled': disabled
          }"
          @click="switchMenuStyles(item.theme)"
        >
          <ArtSvgIcon :icon="item.icon" />
          <span>{{ item.label }}</span>
        </div>
      </div>
    </PrefGroup>

    <PrefGroup
      :title="$t('setting.cards.menuWidth.title')"
      :desc="$t('setting.rows.menuOpenWidth.desc')"
      list
    >
      <PrefRow :label="$t('setting.rows.menuOpenWidth.label')">
        <div class="pref-slider">
          <input
            class="pref-slider__input"
            type="range"
            min="180"
            max="320"
            step="10"
            :value="menuOpenWidth"
            @input="handleWidthChange"
          />
          <span class="pref-slider__val">{{ menuOpenWidth }}px</span>
        </div>
      </PrefRow>
    </PrefGroup>
  </div>
</template>

<script setup lang="ts">
  import PrefGroup from './PrefGroup.vue'
  import PrefRow from './PrefRow.vue'
  import LayoutPreviewCard from './LayoutPreviewCard.vue'
  import { MenuThemeEnum, MenuTypeEnum } from '@/enums/appEnum'
  import { useSettingStore } from '@/store/modules/setting'
  import { useSettingsConfig } from '../composables/useSettingsConfig'
  import { useSettingsState } from '../composables/useSettingsState'
  import { useSettingsHandlers } from '../composables/useSettingsHandlers'

  const { width } = useWindowSize()
  const settingStore = useSettingStore()
  const { menuType, menuThemeType, menuOpenWidth, isDark } = storeToRefs(settingStore)
  const { configOptions, menuStyleOptions } = useSettingsConfig()
  const { switchMenuLayouts } = useSettingsState()
  const { basicHandlers } = useSettingsHandlers()

  const isTopMenu = computed(() => menuType.value === MenuTypeEnum.TOP)
  const isDualMenu = computed(() => menuType.value === MenuTypeEnum.DUAL_MENU)
  const disabled = computed(() => isTopMenu.value || isDualMenu.value || isDark.value)

  const switchMenuStyles = (theme: MenuThemeEnum) => {
    if (disabled.value) return
    settingStore.switchMenuStyles(theme)
  }

  const handleWidthChange = (event: Event) => {
    const value = Number((event.target as HTMLInputElement).value)
    basicHandlers.menuOpenWidth(value)
  }
</script>
