<!-- 菜单管理页面 -->
<template>
  <div class="menu-page  art-full-height">
    <div class="menu-page__layout">
      <!-- 左侧菜单树 -->
      <aside class="menu-tree-panel">
        <div class="menu-panel-header">
          <div class="menu-panel-title">
            菜单树
            <span class="menu-panel-count">{{ menuStats.total }}</span>
          </div>
          <div class="menu-panel-actions">
            <ElButton size="small"  @click="toggleExpand" v-ripple>
              <ArtSvgIcon icon="ri:arrow-down-s-line" :size="12" class="mr-1" />
              {{ isExpanded ? '收起' : '展开' }}
            </ElButton>
            <ElButton size="small" type="primary"  @click="handleAddMenu" v-ripple>
              <ArtSvgIcon icon="ri:add-line" :size="12" class="mr-1" />
              新增
            </ElButton>
          </div>
        </div>

        <div class="menu-tree-search">
          <div class="menu-search-wrap">
            <ArtSvgIcon icon="ri:search-line" :size="14" class="menu-search-icon" />
            <ElInput v-model="searchKeyword" placeholder="搜索菜单名称..." clearable />
          </div>
        </div>

        <div v-loading="loading" class="menu-tree-body">
          <MenuTreeNode
            v-for="node in filteredTableData"
            :key="node.path"
            :node="node"
            :selected-path="selectedPath"
            :expanded-paths="expandedPaths"
            :search-keyword="searchKeyword"
            @select="handleSelectNode"
            @toggle="handleToggleNode"
            @add-child="handleAddChild"
            @delete="handleDeleteNode"
          />
        </div>
      </aside>

      <!-- 右侧详情面板 -->
      <section class="menu-detail-panel" v-loading="detailLoading">
        <div v-if="!panelVisible" class="menu-detail-empty">
          <ArtSvgIcon icon="ri:menu-line" :size="56" class="menu-detail-empty-icon" />
          <p>请从左侧选择一个菜单项查看详情</p>
        </div>

        <MenuDetailPanel
          v-else
          :panel-state="panelState"
          :edit-data="editData"
          :type="dialogType"
          :lock-type="lockMenuType"
          :parent-name="parentName"
          @submit="handleSubmit"
          @delete="handleDeleteCurrent"
          @edit="handleEditPanel"
          @cancel="handleCancelEdit"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { formatMenuTitle } from '@/utils/router'
  import type { AppRouteRecord } from '@/types/router'
  import { fetchGetMenuTree, fetchGetMenuDetail, fetchCreateMenu, fetchUpdateMenu, fetchDeleteMenu } from '@/api/menu'
  import { transformBackendMenuToRoute } from '@/utils/menu/transformMenu'
  import { ElMessageBox } from 'element-plus'
  import MenuTreeNode from './modules/menu-tree-node.vue'
  import MenuDetailPanel from './modules/menu-detail-panel.vue'
  import type { MenuSubmitData } from './modules/menu-detail-panel.vue'

  defineOptions({ name: 'Menus' })

  const loading = ref(false)
  const isExpanded = ref(false)
  const searchKeyword = ref('')
  const selectedPath = ref<string | null>(null)
  const expandedPaths = reactive(new Set<string>())

  const panelState = ref<'view' | 'add' | 'edit'>('view')
  const panelVisible = ref(false)
  const dialogType = ref<'menu' | 'button'>('menu')
  const editData = ref<AppRouteRecord | null>(null)
  const lockMenuType = ref(false)
  const parentMenuId = ref(0)
  const parentName = ref('根目录')
  const detailLoading = ref(false)

  const tableData = ref<AppRouteRecord[]>([])

  onMounted(() => {
    getMenuList()
  })

  const getMenuList = async (): Promise<void> => {
    loading.value = true

    try {
      const list = await fetchGetMenuTree()
      tableData.value = list.map(transformBackendMenuToRoute)
    } catch (error) {
      throw error instanceof Error ? error : new Error('获取菜单失败')
    } finally {
      loading.value = false
    }
  }

  /** 在菜单树中查找指定路径节点的父节点 */
  const findParentInTree = (path: string, list: AppRouteRecord[]): AppRouteRecord | null => {
    for (const item of list) {
      if (item.children?.some((child) => child.path === path)) return item
      if (item.children?.length) {
        const found = findParentInTree(path, item.children)
        if (found) return found
      }
    }
    return null
  }

  const flattenMenus = (list: AppRouteRecord[]): AppRouteRecord[] => {
    return list.flatMap((item) => [item, ...flattenMenus(item.children || [])])
  }

  const menuStats = computed(() => {
    const rows = flattenMenus(tableData.value)
    return {
      total: rows.length,
      routes: rows.filter((item) => !item.meta?.isAuthButton && item.path).length,
      auth: rows.reduce((count, item) => count + (item.meta?.authList?.length || 0), 0),
      iframe: rows.filter((item) => item.meta?.isIframe).length
    }
  })

  const deepClone = <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj) as T
    if (Array.isArray(obj)) return obj.map((item) => deepClone(item)) as T

    const cloned = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }

  const convertAuthListToChildren = (items: AppRouteRecord[]): AppRouteRecord[] => {
    return items.map((item) => {
      const clonedItem = deepClone(item)

      if (clonedItem.children?.length) {
        clonedItem.children = convertAuthListToChildren(clonedItem.children)
      }

      if (item.meta?.authList?.length) {
        const authChildren: AppRouteRecord[] = item.meta.authList.map(
          (auth: { title: string; authMark: string }) => ({
            path: `${item.path}_auth_${auth.authMark}`,
            name: `${String(item.name)}_auth_${auth.authMark}`,
            meta: {
              title: auth.title,
              authMark: auth.authMark,
              isAuthButton: true,
              parentPath: item.path
            }
          })
        )

        clonedItem.children = clonedItem.children?.length
          ? [...clonedItem.children, ...authChildren]
          : authChildren
      }

      return clonedItem
    })
  }

  const filteredTableData = computed(() => convertAuthListToChildren(tableData.value))

  const collectExpandablePaths = (items: AppRouteRecord[]): string[] => {
    return items.flatMap((item) => {
      const paths = item.children?.length ? [item.path, ...collectExpandablePaths(item.children)] : []
      return paths
    })
  }

  const findNodeByPath = (
    path: string,
    items: AppRouteRecord[] = filteredTableData.value
  ): AppRouteRecord | null => {
    for (const item of items) {
      if (item.path === path) return item
      if (item.children?.length) {
        const found = findNodeByPath(path, item.children)
        if (found) return found
      }
    }
    return null
  }

  const openPanel = (
    state: 'view' | 'add' | 'edit',
    data: AppRouteRecord | null,
    type: 'menu' | 'button'
  ) => {
    panelState.value = state
    editData.value = data
    dialogType.value = type
    panelVisible.value = true
  }

  const handleSelectNode = async (node: AppRouteRecord): Promise<void> => {
    selectedPath.value = node.path
    lockMenuType.value = !node.meta?.isAuthButton
    const parent = findParentInTree(node.path, filteredTableData.value)
    parentMenuId.value = parent?.id || 0
    parentName.value = parent ? formatMenuTitle(parent.meta?.title) : '根目录'

    const type = node.meta?.isAuthButton ? 'button' : 'menu'
    panelState.value = 'view'
    dialogType.value = type as 'menu' | 'button'
    editData.value = node
    panelVisible.value = true

    if (!node.id) return

    detailLoading.value = true
    try {
      const detail = await fetchGetMenuDetail(node.id)
      editData.value = transformBackendMenuToRoute(detail)
    } catch {
      // 获取失败则使用树节点数据
    } finally {
      detailLoading.value = false
    }
  }

  const handleToggleNode = (path: string): void => {
    if (expandedPaths.has(path)) {
      expandedPaths.delete(path)
    } else {
      expandedPaths.add(path)
    }
  }

  const handleAddMenu = (): void => {
    selectedPath.value = null
    lockMenuType.value = true
    parentMenuId.value = 0
    parentName.value = '根目录'
    openPanel('add', null, 'menu')
  }

  const handleAddChild = (node: AppRouteRecord): void => {
    selectedPath.value = node.path
    expandedPaths.add(node.path)
    lockMenuType.value = false
    parentMenuId.value = node.id || 0
    parentName.value = formatMenuTitle(node.meta?.title)
    openPanel('add', node, 'menu')
  }

  const handleEditPanel = (): void => {
    if (!editData.value) return
    panelState.value = 'edit'
  }

  const handleCancelEdit = (): void => {
    if (selectedPath.value && editData.value) {
      panelState.value = 'view'
      return
    }
    panelVisible.value = false
    editData.value = null
  }

  const toggleExpand = (): void => {
    isExpanded.value = !isExpanded.value
    expandedPaths.clear()
    if (isExpanded.value) {
      collectExpandablePaths(filteredTableData.value).forEach((path) => expandedPaths.add(path))
    }
  }

  const buildMenuFormParams = (formData: MenuSubmitData): Api.Menu.MenuFormParams => {
    const isMenu = dialogType.value === 'menu'
    return {
      parentId: parentMenuId.value,
      name: isMenu ? formData.name : formData.authName,
      menuType: isMenu ? 1 : 2,
      sortOrder: isMenu ? formData.sort : formData.authSort,
      path: formData.path || undefined,
      component: formData.component || undefined,
      icon: formData.icon || undefined,
      isKeepAlive: isMenu ? (formData.keepAlive ? '1' : '0') : undefined,
      isHide: isMenu ? (formData.isHide ? '1' : '0') : undefined,
      isIframe: isMenu ? (formData.isIframe ? '1' : '0') : undefined,
      permission: isMenu ? (formData.label || undefined) : (formData.authLabel || undefined),
      buttons: formData.authList?.length
        ? formData.authList.map((btn) => ({
            name: btn.title,
            permission: btn.authMark,
            sortOrder: btn.sort
          }))
        : undefined
    }
  }

  const handleSubmit = async (formData: MenuSubmitData): Promise<void> => {
    const params = buildMenuFormParams(formData)

    try {
      if (panelState.value === 'edit') {
        await fetchUpdateMenu({ ...params, id: formData.id })
        ElMessage.success('编辑成功')
      } else {
        await fetchCreateMenu(params)
        ElMessage.success('新增成功')
      }
      await getMenuList()
      if (selectedPath.value) {
        panelState.value = 'view'
      } else {
        panelVisible.value = false
        editData.value = null
      }
    } catch {
      // 错误已由 http 工具统一处理
    }
  }

  const confirmDelete = async (message: string): Promise<boolean> => {
    try {
      await ElMessageBox.confirm(message, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      return true
    } catch {
      return false
    }
  }

  const handleDeleteCurrent = async (): Promise<void> => {
    if (!editData.value?.id) return
    const title = formatMenuTitle(editData.value.meta?.title)
    const confirmed = await confirmDelete(`确定要删除「${title}」吗？删除后无法恢复`)
    if (!confirmed) return

    try {
      await fetchDeleteMenu(editData.value.id)
      ElMessage.success('删除成功')
      selectedPath.value = null
      panelVisible.value = false
      editData.value = null
      await getMenuList()
    } catch {
      // 错误已由 http 工具统一处理
    }
  }

  const handleDeleteNode = async (node: AppRouteRecord): Promise<void> => {
    if (!node.id) return
    const title = formatMenuTitle(node.meta?.title)
    const confirmed = await confirmDelete(`确定要删除「${title}」吗？删除后无法恢复`)
    if (!confirmed) return

    try {
      await fetchDeleteMenu(node.id)
      ElMessage.success('删除成功')
      if (selectedPath.value === node.path) {
        selectedPath.value = null
        panelVisible.value = false
        editData.value = null
      }
      await getMenuList()
    } catch {
      // 错误已由 http 工具统一处理
    }
  }
</script>

<style lang="scss" src="./index.scss"></style>
