<template>
  <div class="menu-tree-node">
    <div
      class="menu-tree-node__row"
      :class="{
        'is-selected': isSelected,
        'is-dimmed': isDimmed
      }"
      @click="handleSelect"
    >
      <span
        class="menu-node-toggle"
        
        :class="{
          'is-expanded': isExpanded,
          'is-hidden': !hasChildren
        }"
        @click.stop="handleToggle"
      >
        <ArtSvgIcon icon="ri:arrow-right-s-line" :size="14" />
      </span>

      <span class="menu-node-icon">
        <ArtSvgIcon :icon="nodeIcon" :size="16" />
      </span>

  
      <ElTag size="small" >{{ tagText }}</ElTag>

      <span class="menu-node-label" :title="nodeLabel">{{ nodeLabel }}</span>

      <div class="menu-node-meta">
        <span v-if="isDisabled" class="menu-node-tag is-hidden">停用</span>

        <span class="menu-node-actions">
          <button
            v-if="!node.meta?.isAuthButton"
            type="button"
            class="menu-node-action-btn"
            title="新增子级"  
            @click.stop="emit('add-child', node)"
          >
            <ArtSvgIcon icon="ri:add-line" :size="12" />
          </button>
          <button
            type="button"
            class="menu-node-action-btn is-danger"
            title="移除"
            @click.stop="emit('delete', node)"
          >
            <ArtSvgIcon icon="ri:close-line" :size="12" />
          </button>
        </span>
      </div>
    </div>

    <div v-if="hasChildren && isExpanded" class="menu-tree-children">
      <MenuTreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :selected-path="selectedPath"
        :expanded-paths="expandedPaths"
        :search-keyword="searchKeyword"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
        @add-child="emit('add-child', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { formatMenuTitle } from '@/utils/router'
  import type { AppRouteRecord } from '@/types/router'

  defineOptions({ name: 'MenuTreeNode' })

  interface Props {
    node: AppRouteRecord
    depth?: number
    selectedPath?: string | null
    expandedPaths: Set<string>
    searchKeyword?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    depth: 0,
    selectedPath: null,
    searchKeyword: ''
  })

  const emit = defineEmits<{
    select: [node: AppRouteRecord]
    toggle: [path: string]
    'add-child': [node: AppRouteRecord]
    delete: [node: AppRouteRecord]
  }>()

  const nodeLabel = computed(() => formatMenuTitle(props.node.meta?.title))

  const nodeIcon = computed(() => {
    if (props.node.meta?.isAuthButton) return 'ri:key-2-line'
    return props.node.meta?.icon || 'ri:menu-line'
  })

  const hasChildren = computed(() => Boolean(props.node.children?.length))

  const isExpanded = computed(() => props.expandedPaths.has(props.node.path))

  const isSelected = computed(() => props.selectedPath === props.node.path)

  const isDimmed = computed(() => {
    const keyword = props.searchKeyword.trim().toLowerCase()
    if (!keyword) return false
    const title = nodeLabel.value.toLowerCase()
    const path = (props.node.path || '').toLowerCase()
    return !title.includes(keyword) && !path.includes(keyword)
  })

  const tagInfo = computed(() => {
    const row = props.node
    if (row.meta?.isAuthButton) return { class: 'is-btn', text: '按钮' }
    if (row.children?.length) return { class: 'is-dir', text: '目录' }
    if (row.meta?.link && row.meta?.isIframe) return { class: 'is-menu', text: '内嵌' }
    if (row.path) return { class: 'is-menu', text: '菜单' }
    if (row.meta?.link) return { class: 'is-menu', text: '外链' }
    return { class: 'is-dir', text: '未知' }
  })

  const tagClass = computed(() => tagInfo.value.class)
  const tagText = computed(() => tagInfo.value.text)

  const isDisabled = computed(() => props.node.meta?.isEnable === false)

  const handleSelect = () => emit('select', props.node)

  const handleToggle = () => emit('toggle', props.node.path)
</script>

<style lang="scss" src="./menu-tree-node.scss"></style>
