<!-- 部门管理 -->
<template>
  <div class="dept-page system-manage-page art-full-height">
    <div class="system-stats-bar">
      <div class="system-stat-card">
        <div class="system-stat-icon">
          <ArtSvgIcon icon="ri:organization-chart" />
        </div>
        <div>
          <div class="system-stat-label">组织节点</div>
          <div class="system-stat-value">{{ deptStats.total }}</div>
        </div>
      </div>
      <div class="system-stat-card">
        <div class="system-stat-icon is-green">
          <ArtSvgIcon icon="ri:checkbox-circle-line" />
        </div>
        <div>
          <div class="system-stat-label">启用部门</div>
          <div class="system-stat-value">{{ deptStats.enabled }}</div>
        </div>
      </div>
      <div class="system-stat-card">
        <div class="system-stat-icon is-blue">
          <ArtSvgIcon icon="ri:building-line" />
        </div>
        <div>
          <div class="system-stat-label">公司/部门</div>
          <div class="system-stat-value">{{ deptStats.depts }}</div>
        </div>
      </div>
      <div class="system-stat-card">
        <div class="system-stat-icon is-purple">
          <ArtSvgIcon icon="ri:team-line" />
        </div>
        <div>
          <div class="system-stat-label">小组</div>
          <div class="system-stat-value">{{ deptStats.groups }}</div>
        </div>
      </div>
    </div>

    <ElCard class="art-table-card">
      <template #header>
        <div class="system-manage-card-header">
          <div class="system-manage-title-stack">
            <h2 class="system-manage-title">部门管理</h2>
          </div>
          <div class="system-manage-actions">
            <ElButton @click="toggleExpand" v-ripple>
              {{ isExpanded ? '收起全部' : '展开全部' }}
            </ElButton>
            <ElButton type="primary" @click="showDialog('add')" v-ripple> 新增部门 </ElButton>
          </div>
        </div>
      </template>

      <ArtTable
        ref="tableRef"
        rowKey="id"
        :loading="treeQuery.isLoading.value"
        :columns="columns"
        :data="deptTreeData"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        border
      />
    </ElCard>

    <!-- 部门弹窗 -->
    <DeptDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :dept-data="currentDeptData"
      :dept-tree="deptTreeData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElTag, ElMessageBox } from 'element-plus'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import {
    useDeptTreeQuery,
    useAddDeptMutation,
    useEditDeptMutation,
    useRemoveDeptMutation,
    useChangeDeptStatusMutation
  } from '@/hooks/queries/useDeptQuery'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import DeptDialog from './modules/dept-dialog.vue'

  defineOptions({ name: 'DeptManage' })

  type IDept = Api.Dept.IDept

  // 展开/收起
  const isExpanded = ref(false)
  const tableRef = ref()

  // 弹窗
  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const currentDeptData = ref<IDept | undefined>()

  // 数据查询
  const treeQuery = useDeptTreeQuery()
  const deptTreeData = computed(() => treeQuery.data.value ?? [])

  const flattenDept = (list: IDept[]): IDept[] => {
    return list.flatMap((item) => [item, ...flattenDept(item.children || [])])
  }

  const deptStats = computed(() => {
    const rows = flattenDept(deptTreeData.value)
    return {
      total: rows.length,
      enabled: rows.filter((item) => item.status === 1).length,
      depts: rows.filter((item) => item.deptType === 'COMPANY' || item.deptType === 'DEPT').length,
      groups: rows.filter((item) => item.deptType === 'GROUP').length
    }
  })

  // Mutations
  const addDept = useAddDeptMutation()
  const editDept = useEditDeptMutation()
  const removeDept = useRemoveDeptMutation()
  const changeStatus = useChangeDeptStatusMutation()

  // 部门类型标签
  function getDeptTypeTag(type: string | undefined) {
    const map: Record<string, { type: string; text: string }> = {
      COMPANY: { type: 'primary', text: '公司' },
      DEPT: { type: 'success', text: '部门' },
      GROUP: { type: 'warning', text: '小组' }
    }
    return map[type ?? ''] ?? { type: 'info', text: type ?? '未知' }
  }

  // 表格列
  const { columns } = useTableColumns<IDept>(() => [
    {
      prop: 'deptName',
      label: '部门名称',
      minWidth: 180,
      formatter: (row: IDept) =>
        h(
          'span',
          { class: 'system-entity__title', title: row.fullName || row.deptCode },
          row.deptName || '-'
        )
    },
    {
      prop: 'deptCode',
      label: '部门编码',
      width: 150,
      formatter: (row: IDept) => h('span', { class: 'system-code-pill' }, row.deptCode || '-')
    },
    {
      prop: 'deptType',
      label: '部门类型',
      width: 100,
      formatter: (row: IDept) => {
        const tag = getDeptTypeTag(row.deptType)
        return h(ElTag, { type: tag.type as any, class: 'system-tag' }, () => tag.text)
      }
    },
    { prop: 'fullName', label: '部门全称', minWidth: 200, showOverflowTooltip: true },
    { prop: 'orderNum', label: '排序', width: 70 },
    { prop: 'leader', label: '负责人', width: 100 },
    { prop: 'phone', label: '联系电话', width: 130 },
    {
      prop: 'status',
      label: '状态',
      width: 80,
      formatter: (row: IDept) =>
        h(ElTag, { type: row.status === 1 ? 'success' : 'danger', class: 'system-tag' }, () =>
          row.status === 1 ? '启用' : '禁用'
        )
    },
    {
      prop: 'operation',
      label: '操作',
      width: 200,
      fixed: 'right',
      formatter: (row: IDept) =>
        h('div', { class: 'system-row-actions' }, [
          h(ArtButtonTable, {
            type: 'add',
            onClick: () => showDialog('add', row),
            title: '新增子级'
          }),
          h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) }),
          h(ArtButtonTable, {
            type: row.status === 1 ? 'view' : 'view',
            title: row.status === 1 ? '禁用' : '启用',
            onClick: () => toggleStatus(row)
          }),
          h(ArtButtonTable, { type: 'delete', onClick: () => deleteDept(row) })
        ])
    }
  ])

  // 展开/收起
  function toggleExpand() {
    isExpanded.value = !isExpanded.value
    nextTick(() => {
      if (tableRef.value?.elTableRef) {
        const processRows = (rows: IDept[]) => {
          rows.forEach((row) => {
            if (row.children?.length) {
              tableRef.value.elTableRef.toggleRowExpansion(row, isExpanded.value)
              processRows(row.children)
            }
          })
        }
        processRows(deptTreeData.value)
      }
    })
  }

  // 弹窗
  function showDialog(type: 'add' | 'edit', row?: IDept) {
    dialogType.value = type
    currentDeptData.value = row
    dialogVisible.value = true
  }

  function handleDialogSuccess() {
    dialogVisible.value = false
    treeQuery.refetch()
  }

  // 切换状态
  async function toggleStatus(row: IDept) {
    const newStatus = row.status === 1 ? 0 : 1
    changeStatus.mutate(
      { id: row.id!, status: newStatus },
      {
        onSuccess: () => {
          ElMessage.success('状态修改成功')
          treeQuery.refetch()
        }
      }
    )
  }

  // 删除
  async function deleteDept(row: IDept) {
    await ElMessageBox.confirm(
      `确定删除部门"${row.deptName}"吗？若存在子部门将一并删除！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    removeDept.mutate(row.id!, {
      onSuccess: () => {
        ElMessage.success('删除成功')
        treeQuery.refetch()
      }
    })
  }
</script>
