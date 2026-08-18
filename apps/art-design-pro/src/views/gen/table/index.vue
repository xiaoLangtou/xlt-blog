<!-- TanStack Table headless data grid -->
<template>
  <div class="tanstack-grid-page art-full-height">
    <ElCard class="art-table-card">
      <template #header>
        <div class="grid-header">
          <div>
            <h2>用户数据网格</h2>
            <p
              >{{ selectedRows.length }} selected /
              {{ table.getFilteredRowModel().rows.length }} matched</p
            >
          </div>
          <div class="grid-header__actions" aria-label="Table actions">
            <ElInput
              :model-value="globalFilter"
              clearable
              placeholder="Search all columns"
              aria-label="Search all columns"
              @update:model-value="setGlobalFilter"
            />
            <ElDropdown trigger="click">
              <ElButton>Columns</ElButton>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem
                    v-for="column in table.getAllLeafColumns()"
                    :key="column.id"
                    :disabled="!column.getCanHide()"
                  >
                    <label class="column-toggle">
                      <input
                        type="checkbox"
                        :checked="column.getIsVisible()"
                        :disabled="!column.getCanHide()"
                        @change="toggleColumn(column.id, $event)"
                      />
                      <span>{{ getColumnLabel(column.id) }}</span>
                    </label>
                  </ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
            <ElButton @click="resetGrid">Reset</ElButton>
          </div>
        </div>
      </template>

      <div class="grid-toolbar" aria-label="Column filters">
        <ElInput
          :model-value="getColumnFilter('name')"
          clearable
          placeholder="Filter name"
          aria-label="Filter name"
          @update:model-value="(value) => setColumnFilter('name', value)"
        />
        <ElSelect
          :model-value="getColumnFilter('role')"
          clearable
          placeholder="Role"
          aria-label="Filter role"
          @update:model-value="(value) => setColumnFilter('role', value)"
        >
          <ElOption label="Admin" value="Admin" />
          <ElOption label="Editor" value="Editor" />
          <ElOption label="Analyst" value="Analyst" />
          <ElOption label="Operator" value="Operator" />
        </ElSelect>
        <ElSelect
          :model-value="getColumnFilter('status')"
          clearable
          placeholder="Status"
          aria-label="Filter status"
          @update:model-value="(value) => setColumnFilter('status', value)"
        >
          <ElOption label="Active" value="Active" />
          <ElOption label="Invited" value="Invited" />
          <ElOption label="Suspended" value="Suspended" />
        </ElSelect>
      </div>

      <div class="grid-shell">
        <table class="grid-table" aria-label="Users data grid">
          <thead>
            <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                :colspan="header.colSpan"
                :aria-sort="getAriaSort(header.column.getIsSorted())"
                scope="col"
              >
                <div v-if="!header.isPlaceholder" class="grid-th">
                  <button
                    v-if="header.column.getCanSort()"
                    type="button"
                    class="grid-sort"
                    @click="header.column.toggleSorting()"
                  >
                    <FlexRender
                      :render="header.column.columnDef.header"
                      :props="header.getContext()"
                    />
                    <span aria-hidden="true">{{ getSortGlyph(header.column.getIsSorted()) }}</span>
                  </button>
                  <FlexRender
                    v-else
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :class="{ 'is-selected': row.getIsSelected() }"
            >
              <td v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </td>
            </tr>
            <tr v-if="table.getRowModel().rows.length === 0">
              <td :colspan="table.getVisibleLeafColumns().length">
                <div class="grid-empty" role="status">No results</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="grid-footer">
        <div class="grid-footer__meta">
          Page {{ pagination.pageIndex + 1 }} of {{ table.getPageCount() || 1 }}
        </div>
        <div class="grid-footer__controls" aria-label="Pagination">
          <ElButton :disabled="!table.getCanPreviousPage()" @click="table.setPageIndex(0)">
            First
          </ElButton>
          <ElButton :disabled="!table.getCanPreviousPage()" @click="table.previousPage()">
            Previous
          </ElButton>
          <ElButton :disabled="!table.getCanNextPage()" @click="table.nextPage()">Next</ElButton>
          <ElButton
            :disabled="!table.getCanNextPage()"
            @click="table.setPageIndex(table.getPageCount() - 1)"
          >
            Last
          </ElButton>
          <ElSelect
            :model-value="pagination.pageSize"
            aria-label="Rows per page"
            @update:model-value="setPageSize"
          >
            <ElOption
              v-for="size in pageSizes"
              :key="size"
              :label="`${size} / page`"
              :value="size"
            />
          </ElSelect>
        </div>
      </div>
    </ElCard>

    <ElCard class="grid-state-card">
      <template #header>
        <div class="grid-state-card__header">
          <span>State contract</span>
          <ElButton size="small" @click="applyRouteState">Apply query state</ElButton>
        </div>
      </template>
      <div class="state-grid">
        <section>
          <h3>Product-owned state</h3>
          <pre>{{ productState }}</pre>
        </section>
        <section>
          <h3>URL / server payload</h3>
          <pre>{{ routeAndServerState }}</pre>
        </section>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import {
    FlexRender,
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useVueTable,
    type ColumnDef,
    type ColumnFiltersState,
    type PaginationState,
    type RowSelectionState,
    type SortingState,
    type Updater,
    type VisibilityState
  } from '@tanstack/vue-table'
  import type { Ref } from 'vue'

  defineOptions({ name: 'GenTable' })

  type UserRow = {
    id: string
    name: string
    email: string
    role: 'Admin' | 'Editor' | 'Analyst' | 'Operator'
    status: 'Active' | 'Invited' | 'Suspended'
    lastSeen: string
    spend: number
  }

  type GridSortDirection = false | 'asc' | 'desc'

  const pageSizes = [5, 10, 20, 50]
  const columnHelper = createColumnHelper<UserRow>()

  const rows = ref<UserRow[]>([
    {
      id: 'usr_001',
      name: 'Ava Chen',
      email: 'ava.chen@example.com',
      role: 'Admin',
      status: 'Active',
      lastSeen: '2026-06-09 09:24',
      spend: 12840
    },
    {
      id: 'usr_002',
      name: 'Noah Smith',
      email: 'noah.smith@example.com',
      role: 'Editor',
      status: 'Invited',
      lastSeen: '2026-06-08 17:42',
      spend: 3420
    },
    {
      id: 'usr_003',
      name: 'Mia Garcia',
      email: 'mia.garcia@example.com',
      role: 'Analyst',
      status: 'Active',
      lastSeen: '2026-06-09 08:12',
      spend: 9210
    },
    {
      id: 'usr_004',
      name: 'Liam Wilson',
      email: 'liam.wilson@example.com',
      role: 'Operator',
      status: 'Suspended',
      lastSeen: '2026-06-02 13:05',
      spend: 860
    },
    {
      id: 'usr_005',
      name: 'Sophia Brown',
      email: 'sophia.brown@example.com',
      role: 'Admin',
      status: 'Active',
      lastSeen: '2026-06-09 10:51',
      spend: 15430
    },
    {
      id: 'usr_006',
      name: 'Ethan Davis',
      email: 'ethan.davis@example.com',
      role: 'Editor',
      status: 'Active',
      lastSeen: '2026-06-07 19:20',
      spend: 6110
    },
    {
      id: 'usr_007',
      name: 'Isabella Lee',
      email: 'isabella.lee@example.com',
      role: 'Analyst',
      status: 'Invited',
      lastSeen: '2026-06-05 11:18',
      spend: 2780
    },
    {
      id: 'usr_008',
      name: 'Lucas Martin',
      email: 'lucas.martin@example.com',
      role: 'Operator',
      status: 'Active',
      lastSeen: '2026-06-09 07:48',
      spend: 4970
    }
  ])

  const sorting = ref<SortingState>([{ id: 'lastSeen', desc: true }])
  const columnFilters = ref<ColumnFiltersState>([])
  const globalFilter = ref('')
  const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 5 })
  const rowSelection = ref<RowSelectionState>({})
  const columnVisibility = ref<VisibilityState>({
    id: false
  })

  const updateRef = <T>(target: Ref<T>, updater: Updater<T>) => {
    target.value =
      typeof updater === 'function' ? (updater as (oldValue: T) => T)(target.value) : updater
  }

  const columns: ColumnDef<UserRow, any>[] = [
    columnHelper.display({
      id: 'select',
      header: ({ table }) =>
        h('input', {
          type: 'checkbox',
          checked: table.getIsAllPageRowsSelected(),
          indeterminate: table.getIsSomePageRowsSelected(),
          'aria-label': 'Select all rows on page',
          onChange: (event: Event) =>
            table.toggleAllPageRowsSelected((event.target as HTMLInputElement).checked)
        }),
      cell: ({ row }) =>
        h('input', {
          type: 'checkbox',
          checked: row.getIsSelected(),
          disabled: !row.getCanSelect(),
          'aria-label': `Select ${row.original.name}`,
          onChange: (event: Event) => row.toggleSelected((event.target as HTMLInputElement).checked)
        }),
      enableSorting: false,
      enableHiding: false
    }),
    columnHelper.accessor('id', {
      header: 'ID',
      cell: (info) => h('code', info.getValue())
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) =>
        h('div', { class: 'user-cell' }, [
          h('strong', info.getValue()),
          h('span', info.row.original.email)
        ])
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      filterFn: 'equalsString',
      cell: (info) => h('span', { class: 'role-chip' }, info.getValue())
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      filterFn: 'equalsString',
      cell: (info) =>
        h('span', { class: ['status-chip', info.getValue().toLowerCase()] }, info.getValue())
    }),
    columnHelper.accessor('lastSeen', {
      header: 'Last seen'
    }),
    columnHelper.accessor('spend', {
      header: 'Spend',
      cell: (info) => formatCurrency(info.getValue())
    })
  ]

  const table = useVueTable({
    data: rows,
    columns,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    state: {
      get sorting() {
        return sorting.value
      },
      get columnFilters() {
        return columnFilters.value
      },
      get globalFilter() {
        return globalFilter.value
      },
      get pagination() {
        return pagination.value
      },
      get rowSelection() {
        return rowSelection.value
      },
      get columnVisibility() {
        return columnVisibility.value
      }
    },
    onSortingChange: (updater) => updateRef(sorting, updater),
    onColumnFiltersChange: (updater) => updateRef(columnFilters, updater),
    onGlobalFilterChange: (updater) => updateRef(globalFilter, updater),
    onPaginationChange: (updater) => updateRef(pagination, updater),
    onRowSelectionChange: (updater) => updateRef(rowSelection, updater),
    onColumnVisibilityChange: (updater) => updateRef(columnVisibility, updater),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const selectedRows = computed(() => table.getSelectedRowModel().rows.map((row) => row.original))

  const productState = computed(() => ({
    sorting: sorting.value,
    columnFilters: columnFilters.value,
    globalFilter: globalFilter.value,
    pagination: pagination.value,
    rowSelection: rowSelection.value,
    columnVisibility: columnVisibility.value
  }))

  const routeAndServerState = computed(() => ({
    query: {
      sort: sorting.value.map((item) => `${item.desc ? '-' : ''}${item.id}`).join(',') || undefined,
      q: globalFilter.value || undefined,
      filters: columnFilters.value.reduce<Record<string, unknown>>((accumulator, filter) => {
        accumulator[filter.id] = filter.value
        return accumulator
      }, {}),
      page: pagination.value.pageIndex + 1,
      pageSize: pagination.value.pageSize,
      visible: Object.entries(columnVisibility.value)
        .filter(([, isVisible]) => isVisible !== false)
        .map(([id]) => id)
    },
    serverRequest: {
      offset: pagination.value.pageIndex * pagination.value.pageSize,
      limit: pagination.value.pageSize,
      sort: sorting.value,
      filters: columnFilters.value,
      search: globalFilter.value || null
    }
  }))

  const setGlobalFilter = (value: string | number | undefined) => {
    globalFilter.value = String(value || '')
    pagination.value = { ...pagination.value, pageIndex: 0 }
  }

  const getColumnFilter = (columnId: string) => {
    return (table.getColumn(columnId)?.getFilterValue() as string | undefined) || ''
  }

  const setColumnFilter = (columnId: string, value: string | number | undefined) => {
    table.getColumn(columnId)?.setFilterValue(value || undefined)
    table.setPageIndex(0)
  }

  const setPageSize = (value: number) => {
    table.setPageSize(value)
  }

  const toggleColumn = (columnId: string, event: Event) => {
    table.getColumn(columnId)?.toggleVisibility((event.target as HTMLInputElement).checked)
  }

  const resetGrid = () => {
    sorting.value = [{ id: 'lastSeen', desc: true }]
    columnFilters.value = []
    globalFilter.value = ''
    pagination.value = { pageIndex: 0, pageSize: 5 }
    rowSelection.value = {}
    columnVisibility.value = { id: false }
  }

  const applyRouteState = () => {
    sorting.value = [{ id: 'spend', desc: true }]
    columnFilters.value = [{ id: 'status', value: 'Active' }]
    globalFilter.value = ''
    pagination.value = { pageIndex: 0, pageSize: 10 }
  }

  const getColumnLabel = (columnId: string) => {
    const labels: Record<string, string> = {
      id: 'ID',
      name: 'Name',
      role: 'Role',
      status: 'Status',
      lastSeen: 'Last seen',
      spend: 'Spend',
      select: 'Select'
    }
    return labels[columnId] || columnId
  }

  const getSortGlyph = (direction: GridSortDirection) => {
    if (direction === 'asc') return '↑'
    if (direction === 'desc') return '↓'
    return '↕'
  }

  const getAriaSort = (direction: GridSortDirection) => {
    if (direction === 'asc') return 'ascending'
    if (direction === 'desc') return 'descending'
    return 'none'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value)
  }
</script>

<style scoped lang="scss">
  .tanstack-grid-page {
    gap: 12px;
  }

  .grid-header,
  .grid-footer,
  .grid-state-card__header {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }

  .grid-header h2 {
    margin: 0;
    font-size: 16px;
    color: var(--art-gray-900);
  }

  .grid-header p {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .grid-header__actions,
  .grid-toolbar,
  .grid-footer__controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .grid-header__actions {
    min-width: 420px;
  }

  .grid-toolbar {
    padding-bottom: 12px;
  }

  .grid-toolbar > * {
    max-width: 220px;
  }

  .grid-shell {
    overflow: auto;
    border: 1px solid var(--art-card-border);
    border-radius: 8px;
  }

  .grid-table {
    width: 100%;
    border-spacing: 0;
    border-collapse: collapse;
  }

  .grid-table th,
  .grid-table td {
    padding: 11px 14px;
    text-align: left;
    border-bottom: 1px solid var(--art-card-border);
  }

  .grid-table th {
    font-size: 12px;
    font-weight: 650;
    color: var(--art-gray-700);
    background: var(--art-gray-200);
  }

  .grid-table tr:hover td {
    background: color-mix(in srgb, var(--theme-color) 6%, transparent);
  }

  .grid-table tr.is-selected td {
    background: color-mix(in srgb, var(--theme-color) 10%, transparent);
  }

  .grid-th,
  .grid-sort {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }

  .grid-sort {
    padding: 0;
    color: inherit;
    cursor: pointer;
    background: transparent;
    border: 0;
  }

  .user-cell {
    display: flex;
    flex-direction: column;
  }

  .user-cell strong {
    color: var(--art-gray-900);
  }

  .user-cell span {
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .role-chip,
  .status-chip {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 8px;
    font-size: 12px;
    border-radius: 999px;
  }

  .role-chip {
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 10%, transparent);
  }

  .status-chip.active {
    color: var(--art-success);
    background: color-mix(in srgb, var(--art-success) 12%, transparent);
  }

  .status-chip.invited {
    color: var(--art-info);
    background: color-mix(in srgb, var(--art-info) 12%, transparent);
  }

  .status-chip.suspended {
    color: var(--art-danger);
    background: color-mix(in srgb, var(--art-danger) 12%, transparent);
  }

  .grid-empty {
    padding: 32px;
    text-align: center;
    color: var(--art-gray-600);
  }

  .grid-footer {
    padding-top: 12px;
  }

  .grid-footer__meta {
    font-size: 13px;
    color: var(--art-gray-600);
  }

  .column-toggle {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .grid-state-card {
    flex: 0 0 auto;
  }

  .state-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .state-grid h3 {
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--art-gray-800);
  }

  .state-grid pre {
    min-height: 160px;
    padding: 12px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.6;
    color: var(--art-gray-800);
    background: var(--art-gray-200);
    border-radius: 8px;
  }

  @media (max-width: 960px) {
    .grid-header,
    .grid-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .grid-header__actions,
    .grid-toolbar,
    .grid-footer__controls {
      flex-wrap: wrap;
      min-width: 0;
    }

    .state-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
