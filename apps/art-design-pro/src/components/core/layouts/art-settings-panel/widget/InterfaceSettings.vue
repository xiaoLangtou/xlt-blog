<template>
  <div class="pref-panel">
    <PrefGroup list>
      <PrefRow :label="$t('setting.box.title')" :desc="$t('setting.rows.boxDivider.desc')">
        <SegmentedControl
          :model-value="boxMode"
          :options="boxSegmentOptions"
          @update:model-value="handleBoxModeChange"
        />
      </PrefRow>

      <PrefRow :label="$t('setting.container.title')" :desc="$t('setting.rows.widthMode.desc')">
        <SegmentedControl
          :model-value="containerWidth"
          :options="containerSegmentOptions"
          @update:model-value="containerHandlers.setWidth"
        />
      </PrefRow>

      <PrefRow
        :label="$t('setting.cards.tabStyle.title')"
        :desc="$t('setting.rows.tabAppearance.desc')"
      >
        <SegmentedControl
          :model-value="tabStyle"
          :options="tabSegmentOptions"
          @update:model-value="basicHandlers.tabStyle"
        />
      </PrefRow>
    </PrefGroup>

    <PrefGroup
      :title="$t('setting.cards.pageTransition.title')"
      :desc="$t('setting.rows.animationType.desc')"
      flush
    >
      <PageTransitionPicker
        :model-value="pageTransition"
        :options="pageTransitionOptions"
        @update:model-value="basicHandlers.pageTransition"
      />
    </PrefGroup>
  </div>
</template>

<script setup lang="ts">
  import PrefGroup from './PrefGroup.vue'
  import PrefRow from './PrefRow.vue'
  import SegmentedControl from './SegmentedControl.vue'
  import PageTransitionPicker from './PageTransitionPicker.vue'
  import { useSettingStore } from '@/store/modules/setting'
  import { useSettingsConfig } from '../composables/useSettingsConfig'
  import { useSettingsHandlers } from '../composables/useSettingsHandlers'

  const settingStore = useSettingStore()
  const { boxBorderMode, containerWidth, tabStyle, pageTransition } = storeToRefs(settingStore)
  const { boxStyleOptions, containerWidthOptions, tabStyleOptions, pageTransitionOptions } =
    useSettingsConfig()
  const { boxStyleHandlers, containerHandlers, basicHandlers } = useSettingsHandlers()

  const boxMode = computed(() => (boxBorderMode.value ? 'border-mode' : 'shadow-mode'))

  const boxSegmentOptions = computed(() =>
    boxStyleOptions.value.map((item) => ({
      value: item.type,
      label: item.label
    }))
  )

  const containerSegmentOptions = computed(() =>
    containerWidthOptions.value.map((item) => ({
      value: item.value,
      label: item.label
    }))
  )

  const tabSegmentOptions = computed(() =>
    tabStyleOptions.value.map((item) => ({
      value: item.value,
      label: item.label
    }))
  )

  const handleBoxModeChange = (value: 'border-mode' | 'shadow-mode') => {
    boxStyleHandlers.setBoxMode(value)
  }
</script>
