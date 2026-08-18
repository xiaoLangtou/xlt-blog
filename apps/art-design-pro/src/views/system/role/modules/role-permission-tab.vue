<template>
  <div class="perm-tree-toolbar">
    <ElButton size="small" @click="toggleExpandAll">
      {{ isExpandAll ? '全部收起' : '全部展开' }}
    </ElButton>
    <ElButton size="small" @click="toggleSelectAll">
      {{ isSelectAll ? '取消全选' : '全选' }}
    </ElButton>
  </div>

  <div v-loading="loading" class="perm-tree-body">
    <ElTree
      ref="treeRef"
      :data="processedMenuList"
      show-checkbox
      check-strictly
      node-key="id"
      :default-expand-all="isExpandAll"
      :expand-on-click-node="false"
      :props="treeProps"
      @check="handleTreeCheck"
    >
      <template #default="{ data }">
        <span class="perm-tree-node" :class="{ 'is-auth-node': data.isAuth }">
          <template v-if="data.isAuth">
            <span class="perm-btn-tag">按钮</span>
            <span class="perm-btn-name">{{ data.label }}</span>
            <span class="perm-btn-mark">{{ data.authMark }}</span>
          </template>
          <template v-else>
            <span class="perm-menu-name">{{ treeProps.label(data) }}</span>
            <span class="perm-menu-path">{{ data.path }}</span>
          </template>
        </span>
      </template>
    </ElTree>
  </div>
</template>

<script setup lang="ts">
import { fetchGetMenuTree } from '@/api/menu'
import { fetchChangeRoleMenu } from '@/api/role'
import { formatMenuTitle } from '@/utils/router'
import { normalizeMenuResponse } from '@/utils/menu/transformMenu'

interface Props {
  roleId: number
  roleCode: string
  assignedMenuIds?: number[]
  assignedButtonIds?: number[]
}

interface Emits {
  (e: 'countChange', count: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

interface MenuNode {
  id?: string | number
  name?: string
  label?: string
  meta?: {
    title?: string
    authList?: Array<{
      authMark: string
      title: string
      checked?: boolean
    }>
  }
  children?: MenuNode[]
  [key: string]: any
}

const treeRef = ref()
const loading = ref(false)
const saving = ref(false)
const isExpandAll = ref(true)
const isSelectAll = ref(false)
const menuList = ref<MenuNode[]>([])

const customNodeClass = (data: any) => (data.isPenultimate ? 'is-penultimate' : '')

const treeProps = {
  children: 'children',
  label: (data: any) => formatMenuTitle(data.meta?.title) || data.label || '',
  class: customNodeClass
}

const processedMenuList = computed(() => {
  const processNode = (node: MenuNode): MenuNode => {
    const processed = { ...node }

    if (node.meta?.authList?.length) {
      processed.isPenultimate = true
      const authNodes = node.meta.authList.map((auth) => ({
        id: `${node.id}_${auth.authMark}`,
        name: `${node.name}_${auth.authMark}`,
        label: auth.title,
        authMark: auth.authMark,
        isAuth: true,
        checked: auth.checked || false
      }))

      processed.children = processed.children ? [...processed.children, ...authNodes] : authNodes
    }

    if (processed.children) {
      processed.children = processed.children.map(processNode)
    }

    return processed
  }

  return menuList.value.map(processNode)
})

const getAllNodeKeys = (nodes: MenuNode[]): string[] => {
  const keys: string[] = []
  const traverse = (nodeList: MenuNode[]): void => {
    nodeList.forEach((node) => {
      if (node.id) keys.push(node.id as string)
      if (node.children?.length) traverse(node.children)
    })
  }
  traverse(nodes)
  return keys
}

const handleTreeCheck = () => {
  const tree = treeRef.value
  if (!tree) return
  const checkedKeys = tree.getCheckedKeys()
  const allKeys = getAllNodeKeys(processedMenuList.value)
  isSelectAll.value = checkedKeys.length === allKeys.length && allKeys.length > 0
  emit('countChange', checkedKeys.length)
}

const toggleExpandAll = () => {
  const tree = treeRef.value
  if (!tree) return
  const nodes = tree.store.nodesMap
  Object.values(nodes).forEach((node: any) => {
    node.expanded = !isExpandAll.value
  })
  isExpandAll.value = !isExpandAll.value
}

const toggleSelectAll = () => {
  const tree = treeRef.value
  if (!tree) return
  if (isSelectAll.value) {
    tree.setCheckedKeys([])
    isSelectAll.value = false
    emit('countChange', 0)
  } else {
    const allKeys = getAllNodeKeys(processedMenuList.value)
    tree.setCheckedKeys(allKeys)
    isSelectAll.value = true
    emit('countChange', allKeys.length)
  }
}

const applyCheckedKeys = (menuIds: number[]) => {
  const tree = treeRef.value
  if (!tree) return
  const allKeys = getAllNodeKeys(processedMenuList.value)
  const keysToCheck = allKeys.filter((key) => {
    // auth nodes have id like "1_user:add"
    const menuId = parseInt(String(key).split('_')[0], 10)
    return menuIds.includes(menuId)
  })
  tree.setCheckedKeys(keysToCheck)
  isSelectAll.value = keysToCheck.length === allKeys.length && allKeys.length > 0
  emit('countChange', keysToCheck.length)
}

const loadPermTree = async () => {
  loading.value = true
  try {
    const menus = await fetchGetMenuTree()
    menuList.value = (normalizeMenuResponse(menus) as MenuNode[]) || []
    await nextTick()
    applyCheckedKeys(props.assignedMenuIds || [])
  } finally {
    loading.value = false
  }
}

const resetPerms = () => {
  applyCheckedKeys(props.assignedMenuIds || [])
  ElMessage.info('已重置')
}

const savePerms = async () => {
  saving.value = true
  try {
    const checkedKeys = treeRef.value?.getCheckedKeys() || []
    const menuIds: number[] = []
    checkedKeys.forEach((key: string) => {
      const keyStr = String(key)
      if (keyStr.includes('_')) {
        // auth button node: the menu part is the menuId
        const menuId = parseInt(keyStr.split('_')[0], 10)
        if (!menuIds.includes(menuId)) menuIds.push(menuId)
      } else {
        menuIds.push(Number(keyStr))
      }
    })

    await fetchChangeRoleMenu({ id: props.roleId, menus: menuIds })
    ElMessage.success('功能权限保存成功')
  } catch {
    // 错误已由 http 工具统一处理
  } finally {
    saving.value = false
  }
}

watch(() => props.assignedMenuIds, (ids) => {
  if (menuList.value.length) {
    applyCheckedKeys(ids || [])
  }
})

defineExpose({ savePerms, resetPerms, saving })

onMounted(() => {
  loadPermTree()
})
</script>

<style lang="scss" scoped>
.perm-tree-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.perm-tree-node {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;

  &.is-auth-node {
    display: inline-flex;
  }
}

.perm-menu-name {
  color: var(--system-text, var(--art-gray-900));
}

.perm-menu-path {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  color: var(--system-muted, var(--art-gray-600));
}

.perm-btn-tag {
  flex-shrink: 0;
  padding: 0 5px;
  font-size: 10px;
  line-height: 17px;
  color: var(--system-accent, var(--theme-color));
  background: var(--system-accent-soft, color-mix(in srgb, var(--theme-color) 12%, transparent));
  border: 1px solid color-mix(in srgb, var(--theme-color) 18%, transparent);
  border-radius: 3px;
}

.perm-btn-name {
  font-size: 12px;
  color: var(--system-text, var(--art-gray-900));
}

.perm-btn-mark {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  color: var(--system-muted, var(--art-gray-600));
}
</style>
