<template>
  <div class="org-demo-page p-6">
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-base font-medium">组织架构选人 Demo</span>
          <div class="flex items-center gap-4 text-sm text-gray-500">
            <span>模式：<el-tag size="small">{{ mode === 'single' ? '单选' : '多选' }}</el-tag></span>
            <el-radio-group v-model="mode" size="small">
              <el-radio-button value="multiple">多选</el-radio-button>
              <el-radio-button value="single">单选</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-alert
        title="每行可以点击「选择人员」按钮打开组织架构选人弹窗，选中的人员会以标签形式显示在该行中。已选标签可以单独删除。"
        type="info"
        :closable="false"
        show-icon
        class="mb-4"
      />

      <el-table :data="rows" border stripe>
        <el-table-column type="index" label="#" width="60" align="center" />

        <el-table-column prop="project" label="项目" min-width="160">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <div
                class="size-8 rounded-lg flex items-center justify-center text-white text-xs font-medium shrink-0"
                :style="{ backgroundColor: row.color }"
              >
                {{ row.project.charAt(0) }}
              </div>
              <div>
                <div class="text-sm font-medium">{{ row.project }}</div>
                <div class="text-xs text-gray-400">{{ row.leader }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="department" label="所属部门" width="160" />

        <el-table-column label="已选人员" min-width="320">
          <template #default="{ row }">
            <div class="flex flex-wrap items-center gap-1.5 min-h-[32px]">
              <el-tag
                v-for="emp in row.selectedEmployees"
                :key="emp.id"
                closable
                size="small"
                :type="getTagType(emp.id)"
                :disable-transitions="true"
                @close="removeEmployee(row, emp.id)"
              >
                {{ emp.name }}
              </el-tag>
              <el-button
                size="small"
                type="primary"
                plain
                @click="openSelector(row)"
              >
                + 选择
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.selectedEmployees.length > 0"
              text
              size="small"
              type="danger"
              @click="clearRow(row)"
            >
              清空
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div>
          共 {{ rows.length }} 个项目，
          <template v-for="r in rows" :key="r.key">
            <span v-if="r.selectedEmployees.length > 0" class="mr-3">
              {{ r.project }}：<strong class="text-primary">{{ r.selectedEmployees.length }}</strong> 人
            </span>
          </template>
        </div>
        <div>
          总计已选：<strong class="text-primary text-base">{{ totalSelected }}</strong> 人次
        </div>
      </div>
    </el-card>

    <OrgSelector
      v-model="selectorVisible"
      :mode="mode"
      :selected-ids="currentSelectedIds"
      :max-count="10"
      @confirm="handleConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import OrgSelector from '@/components/core/org-selector/index.vue'
import type { SelectedEmployee } from '@/types/component/org-selector'

defineOptions({ name: 'GenDesign' })

const mode = ref<'single' | 'multiple'>('multiple')

interface RowData {
  key: string
  project: string
  department: string
  leader: string
  color: string
  selectedEmployees: SelectedEmployee[]
}

const rows = ref<RowData[]>([
  {
    key: 'proj-alpha',
    project: '智能客服平台',
    department: '技术研发部-前端组',
    leader: '项目负责人：王工',
    color: '#6366f1',
    selectedEmployees: [],
  },
  {
    key: 'proj-beta',
    project: '数据中台 V3',
    department: '技术研发部-后端组',
    leader: '项目负责人：李工',
    color: '#ec4899',
    selectedEmployees: [],
  },
  {
    key: 'proj-gamma',
    project: '移动端重构',
    department: '移动开发部',
    leader: '项目负责人：张工',
    color: '#14b8a6',
    selectedEmployees: [
      { id: 'emp-mock-1', name: '赵六', deptId: 'dept-mobile', deptName: '移动开发部', title: 'iOS工程师' },
    ],
  },
  {
    key: 'proj-delta',
    project: '设计系统升级',
    department: 'UED 设计部',
    leader: '项目负责人：陈工',
    color: '#f59e0b',
    selectedEmployees: [],
  },
  {
    key: 'proj-epsilon',
    project: '运维监控平台',
    department: '基础设施部',
    leader: '项目负责人：刘工',
    color: '#8b5cf6',
    selectedEmployees: [],
  },
])

const selectorVisible = ref(false)
const currentRow = ref<RowData | null>(null)

const currentSelectedIds = computed<(string | number)[]>(() => {
  return currentRow.value?.selectedEmployees.map(e => e.id) ?? []
})

function openSelector(row: RowData) {
  currentRow.value = row
  selectorVisible.value = true
}

function handleConfirm(payload: { selected: SelectedEmployee[] }) {
  if (currentRow.value) {
    currentRow.value.selectedEmployees = payload.selected
  }
  selectorVisible.value = false
  currentRow.value = null
}

function removeEmployee(row: RowData, empId: string | number) {
  const idx = row.selectedEmployees.findIndex(e => e.id === empId)
  if (idx > -1) row.selectedEmployees.splice(idx, 1)
}

function clearRow(row: RowData) {
  row.selectedEmployees = []
}

const totalSelected = computed(() => {
  return rows.value.reduce((sum, r) => sum + r.selectedEmployees.length, 0)
})

const TAG_COLORS = ['', 'success', 'warning', 'info', 'danger'] as const
function getTagType(id: string | number): (typeof TAG_COLORS)[number] {
  const hash = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return TAG_COLORS[hash % TAG_COLORS.length]
}
</script>
