<template>
  <div class="pref-panel">
    <PrefGroup :title="$t('setting.theme.title')" :desc="$t('setting.rows.displayMode.desc')" flush>
      <ThemeModePicker
        :model-value="systemThemeMode"
        :options="themeOptions"
        @update:model-value="switchThemeStyles"
      />
    </PrefGroup>

    <PrefGroup :title="$t('setting.color.title')" :desc="$t('setting.rows.pickColor.desc')" flush>
      <div class="pref-swatches">
        <button
          v-for="color in configOptions.mainColors"
          :key="color"
          type="button"
          class="pref-swatch"
          :class="{ 'is-active': color === systemThemeColor }"
          :style="{ '--swatch-color': color }"
          :title="color"
          @click="colorHandlers.selectColor(color)"
        >
          <ArtSvgIcon v-if="color === systemThemeColor" icon="ri:check-line" />
        </button>
      </div>
    </PrefGroup>

    <PrefGroup
      :title="$t('setting.cards.borderRadius.title')"
      :desc="$t('setting.rows.radiusFactor.desc')"
      flush
    >
      <div class="pref-radius-grid">
        <button
          v-for="option in radiusOptions"
          :key="option.value"
          type="button"
          class="pref-radius-item"
          :class="{ 'is-active': option.value === customRadius }"
          :style="{ borderRadius: option.preview }"
          @click="basicHandlers.customRadius(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </PrefGroup>
  </div>
</template>

<script setup lang="ts">
  import PrefGroup from './PrefGroup.vue'
  import ThemeModePicker from './ThemeModePicker.vue'
  import { SystemThemeEnum } from '@/enums/appEnum'
  import { useSettingStore } from '@/store/modules/setting'
  import { useSettingsConfig } from '../composables/useSettingsConfig'
  import { useSettingsHandlers } from '../composables/useSettingsHandlers'
  import { useTheme } from '@/hooks/core/useTheme'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
  const settingStore = useSettingStore()
  const { systemThemeMode, systemThemeColor, customRadius } = storeToRefs(settingStore)
  const { configOptions } = useSettingsConfig()
  const { colorHandlers, basicHandlers } = useSettingsHandlers()
  const { switchThemeStyles } = useTheme()

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

  const radiusOptions = computed(() => [
    { value: '0', label: t('setting.radius.sharp'), preview: '0' },
    { value: '0.25', label: '0.25', preview: '4px' },
    { value: '0.5', label: '0.5', preview: '8px' },
    { value: '0.75', label: '0.75', preview: '12px' },
    { value: '1', label: t('setting.radius.rounded'), preview: '16px' }
  ])
</script>
