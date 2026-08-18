<template>
  <ElPopover
    :visible="visible"
    placement="bottom-start"
    :width="360"
    trigger="click"
    @show="handleOpen"
    @hide="visible = false"
  >
    <template #reference>
      <div class="menu-icon-picker-trigger" @click="visible = !visible">
        <span v-if="currentIconComp" class="menu-icon-picker-preview">
          <component :is="currentIconComp" :size="18" />
        </span>
        <span v-else class="menu-icon-picker-placeholder">
          <component :is="icons.Circle" :size="18" />
        </span>
        <span class="menu-icon-picker-text">
          {{ iconNameDisplay || '选择图标' }}
        </span>
        <span class="menu-icon-picker-arrow">
          <component :is="icons.ChevronDown" :size="14" />
        </span>
      </div>
    </template>

    <div class="menu-icon-picker-popover">
      <div class="menu-icon-picker-search">
        <ElInput
          ref="searchInputRef"
          v-model="searchQuery"
          placeholder="搜索图标名称..."
          size="small"
          clearable
        >
          <template #prefix>
            <component :is="icons.Search" :size="14" />
          </template>
        </ElInput>
      </div>

      <div v-if="filteredIcons.length === 0" class="menu-icon-picker-empty">
        未找到匹配的图标
      </div>

      <div v-else class="menu-icon-picker-grid">
        <button
          v-for="iconName in filteredIcons"
          :key="iconName"
          type="button"
          class="menu-icon-picker-item"
          :class="{ 'is-selected': modelValue === `lucide:${iconName}` }"
          :title="iconName"
          @click="handleSelect(iconName)"
        >
          <component :is="getIconComp(iconName)" :size="20" />
        </button>
      </div>
    </div>
  </ElPopover>
</template>

<script setup lang="ts">
import { icons } from 'lucide-vue-next'
import { LUCIDE_ICONS, LUCIDE_DEFAULT_ICONS } from '@/utils/ui/lucide-icons'
import { normalizeIcon } from '@/utils/ui/normalizeIcon'

defineOptions({ name: 'MenuIconPicker' })

interface Props {
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const visible = ref(false)
const searchQuery = ref('')
const searchInputRef = ref()

const normalizedIcon = computed(() => normalizeIcon(props.modelValue))

const iconNameDisplay = computed(() => {
  if (!normalizedIcon.value) return ''
  const parts = normalizedIcon.value.split(':')
  return parts.length > 1 ? parts[1] : parts[0]
})

/** kebab-case 转 PascalCase，用于查找 lucide-vue-next 图标组件 */
function kebabToPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/** 根据 kebab-case 名称获取图标组件 */
function getIconComp(kebabName: string) {
  const pascalName = kebabToPascalCase(kebabName) as keyof typeof icons
  return icons[pascalName] || null
}

/** 当前选中的图标组件 */
const currentIconComp = computed(() => {
  if (!iconNameDisplay.value) return null
  return getIconComp(iconNameDisplay.value)
})

const filteredIcons = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  let source: readonly string[] = LUCIDE_DEFAULT_ICONS
  if (query) {
    source = LUCIDE_ICONS
  } else if (iconNameDisplay.value) {
    // 如果当前选中图标不在默认列表中，追加到列表开头
    const name = iconNameDisplay.value
    if (name && !LUCIDE_DEFAULT_ICONS.includes(name)) {
      source = [name, ...LUCIDE_DEFAULT_ICONS]
    }
  }

  if (!query) return [...source]
  return source.filter((name) => name.includes(query))
})

const handleOpen = () => {
  searchQuery.value = ''
  nextTick(() => {
    searchInputRef.value?.focus?.()
  })
}

const handleSelect = (iconName: string) => {
  emit('update:modelValue', `lucide:${iconName}`)
  visible.value = false
}
</script>

<style lang="scss">
.menu-icon-picker-trigger {
  display: inline-flex;
  align-items: center;
  width: 100%;
  min-height: 32px;
  padding: 4px 8px;
  cursor: pointer;
  background: var(--system-input, var(--default-box-color));
  border-radius: 6px;
  box-shadow: 0 0 0 1px var(--system-border-subtle, var(--default-border)) inset;
  gap: 8px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 0 0 1px var(--system-accent, var(--theme-color)) inset;
  }
}

.menu-icon-picker-preview,
.menu-icon-picker-placeholder {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--system-secondary, var(--art-gray-700));
}

.menu-icon-picker-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  color: var(--system-secondary, var(--art-gray-700));
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-icon-picker-arrow {
  flex-shrink: 0;
  color: var(--system-muted, var(--art-gray-600));
}

.menu-icon-picker-popover {
  display: flex;
  flex-direction: column;
  max-height: 360px;
}

.menu-icon-picker-search {
  flex-shrink: 0;
  padding-bottom: 8px;
}

.menu-icon-picker-empty {
  padding: 32px 0;
  font-size: 13px;
  color: var(--system-muted, var(--art-gray-600));
  text-align: center;
}

.menu-icon-picker-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  overflow-y: auto;
}

.menu-icon-picker-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  cursor: pointer;
  color: var(--system-secondary, var(--art-gray-700));
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  outline: none;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover {
    background: var(--system-elevated, var(--art-gray-200));
  }

  &.is-selected {
    color: var(--system-accent, var(--theme-color));
    background: var(--system-accent-soft, color-mix(in srgb, var(--theme-color) 12%, transparent));
    border-color: color-mix(in srgb, var(--system-accent, var(--theme-color)) 30%, transparent);
  }
}
</style>
