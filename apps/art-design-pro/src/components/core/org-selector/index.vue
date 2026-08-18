<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="880px"
    top="5vh"
    align-center
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
    @open="handleOpen"
    @close="handleClose"
  >
    <div class="org-selector">
      <!-- ===== 搜索栏 ===== -->
      <div class="mb-4">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索部门或人员姓名"
          clearable
          :prefix-icon="Search"
          @input="handleSearchInput"
          @clear="handleSearchClear"
        />
      </div>

      <!-- ===== 搜索结果视图 ===== -->
      <template v-if="isSearching">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-gray-500">
            搜索 <em class="text-gray-700 not-italic font-medium">{{ searchKeyword }}</em> 结果（{{ searchResults.length }}）
          </span>
          <el-button text size="small" @click="exitSearch">
            返回组织架构
          </el-button>
        </div>

        <div class="search-results-list max-h-[420px] overflow-y-auto -mx-2">
          <div
            v-for="item in searchResults"
            :key="`${item.type}_${item.id}`"
            class="flex items-center gap-2 px-3 py-2 mx-2 rounded-md cursor-pointer transition-colors hover:bg-gray-50"
            :class="{ 'bg-blue-50': item.type === 'employee' && isEmployeeSelected(item.id) }"
            @click="handleSearchResultClick(item)"
          >
            <el-checkbox
              v-if="item.type === 'employee'"
              :model-value="isEmployeeSelected(item.id)"
              :disabled="isEmployeeExcluded(item.id) || (hasReachedMax && !isEmployeeSelected(item.id))"
              size="small"
              @click.stop
              @change="(val: boolean) => handleSearchEmployeeCheck(val, item)"
            />
            <div class="flex items-center gap-1.5 min-w-0 flex-1">
              <component :is="item.type === 'dept' ? Building2 : User" class="size-4 shrink-0" :class="item.type === 'dept' ? 'text-primary' : 'text-green-500'" />
              <span class="text-sm truncate">{{ item.name }}</span>
              <span v-if="item.deptName" class="text-xs text-gray-400 truncate">{{ item.deptName }}</span>
            </div>
            <span
              class="shrink-0 text-xs px-1.5 py-0.5 rounded"
              :class="item.type === 'dept' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'"
            >
              {{ item.type === 'dept' ? '部门' : '人员' }}
            </span>
          </div>

          <div v-if="searchResults.length === 0" class="text-center text-gray-400 py-12 text-sm">
            未找到匹配结果
          </div>
        </div>
      </template>

      <!-- ===== 组织架构视图 ===== -->
      <template v-else>
        <div class="flex gap-4 max-h-[480px]">
          <!-- 左侧：部门+人员列表 -->
          <div class="flex-1 flex flex-col min-w-0">
            <!-- 面包屑 -->
            <el-breadcrumb class="mb-3 shrink-0" separator="/">
              <el-breadcrumb-item
                v-for="(item, index) in breadcrumb"
                :key="item.id ?? '__root__'"
              >
                <span
                  class="cursor-pointer transition-colors text-sm"
                  :class="index === breadcrumb.length - 1 ? 'text-gray-900 font-medium' : 'text-primary hover:text-primary-400'"
                  @click="navigateToDept(item.id)"
                >
                  {{ item.name }}
                </span>
              </el-breadcrumb-item>
            </el-breadcrumb>

            <!-- 加载状态 -->
            <div v-if="loadingDept" class="flex items-center justify-center py-12 text-gray-400">
              <el-icon class="is-loading mr-2"><Loader2 /></el-icon>
              加载中...
            </div>

            <!-- 列表内容 -->
            <div v-else class="flex-1 overflow-y-auto -mx-1">
              <!-- 子部门区域 -->
              <div v-if="currentDepts.length > 0" class="mb-2">
                <div class="flex items-center text-xs text-gray-400 px-2 py-1">
                  <Building2 class="size-3.5 mr-1" />
                  部门（{{ currentDepts.length }}）
                </div>
                <div
                  v-for="dept in currentDepts"
                  :key="`dept_${dept.id}`"
                  class="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors hover:bg-gray-50"
                  :class="{
                    'bg-blue-50': isDeptSelected(dept.id),
                    'opacity-50 cursor-not-allowed': isDeptExcluded(dept.id),
                  }"
                >
                  <el-checkbox
                    :model-value="isDeptSelected(dept.id)"
                    :indeterminate="isDeptIndeterminate(dept.id)"
                    :disabled="isDeptExcluded(dept.id) || (hasReachedMax && !isDeptSelected(dept.id))"
                    size="small"
                    @change="(val: boolean) => handleDeptCheck(val, dept)"
                  />
                  <div
                    class="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
                    @click="navigateToDept(dept.id)"
                  >
                    <Building2 class="size-4 shrink-0 text-primary" />
                    <span class="text-sm truncate">{{ dept.deptName }}</span>
                    <span v-if="dept.employeeCount != null" class="ml-auto text-xs text-gray-400 shrink-0">
                      {{ dept.employeeCount }}人
                    </span>
                    <ChevronRight v-if="dept.hasChildren" class="size-4 shrink-0 text-gray-300" />
                  </div>
                </div>
              </div>

              <!-- 人员区域 -->
              <div v-if="currentEmployees.length > 0">
                <div class="flex items-center text-xs text-gray-400 px-2 py-1 border-t border-gray-100">
                  <User class="size-3.5 mr-1" />
                  人员（{{ currentEmployees.length }}）
                </div>
                <div
                  v-for="emp in currentEmployees"
                  :key="`emp_${emp.id}`"
                  class="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors hover:bg-gray-50"
                  :class="{
                    'bg-blue-50': isEmployeeSelected(emp.id),
                    'opacity-50 cursor-not-allowed': isEmployeeExcluded(emp.id),
                  }"
                >
                  <el-checkbox
                    :model-value="isEmployeeSelected(emp.id)"
                    :disabled="isEmployeeExcluded(emp.id) || (hasReachedMax && !isEmployeeSelected(emp.id))"
                    size="small"
                    @change="(val: boolean) => handleEmployeeCheck(val, emp)"
                  />
                  <div class="flex items-center gap-1.5 min-w-0 flex-1">
                    <div class="size-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <User class="size-3.5 text-gray-500" />
                    </div>
                    <span class="text-sm truncate">{{ emp.name }}</span>
                    <span v-if="emp.title" class="text-xs text-gray-400 truncate ml-auto">{{ emp.title }}</span>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div
                v-if="currentDepts.length === 0 && currentEmployees.length === 0 && !loadingDept"
                class="text-center text-gray-400 py-12 text-sm"
              >
                暂无部门和人员
              </div>
            </div>
          </div>

          <!-- ===== 右侧：已选面板 ===== -->
          <div class="w-72 shrink-0 border-l border-gray-200 pl-4 flex flex-col">
            <div class="flex items-center justify-between mb-3 shrink-0">
              <span class="text-sm font-medium text-gray-900">已选（{{ selectedCount }}）</span>
              <el-button v-if="selectedCount > 0" text size="small" @click="handleClearAll">
                清空
              </el-button>
            </div>

            <div class="flex-1 overflow-y-auto -mr-2 pr-2">
              <!-- 已选部门标签 -->
              <div v-if="selectedDeptTags.length > 0" class="mb-3">
                <div class="text-xs text-gray-400 mb-1.5">部门</div>
                <div class="flex flex-wrap gap-1.5">
                  <el-tag
                    v-for="tag in selectedDeptTags"
                    :key="`dept_tag_${tag.id}`"
                    closable
                    size="small"
                    type="warning"
                    :disable-transitions="true"
                    @close="handleRemoveDeptTag(tag.id)"
                  >
                    {{ tag.name }}
                  </el-tag>
                </div>
              </div>

              <!-- 已选人员列表 -->
              <div v-if="selectedEmpTags.length > 0">
                <div class="text-xs text-gray-400 mb-1.5">人员</div>
                <div class="flex flex-col gap-1">
                  <div
                    v-for="tag in selectedEmpTags"
                    :key="`emp_tag_${tag.id}`"
                    class="flex items-center gap-2 px-2 py-1.5 rounded bg-blue-50 group"
                  >
                    <span class="text-sm flex-1 truncate">{{ tag.name }}</span>
                    <span class="text-xs text-gray-400 truncate max-w-[100px]">{{ tag.deptName }}</span>
                    <button
                      class="size-4 shrink-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-200"
                      @click="handleRemoveEmployeeTag(tag.id)"
                    >
                      <X class="size-3 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="selectedCount === 0" class="text-center text-gray-300 py-12 text-sm">
                请在左侧选择
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-500">
          {{ mode === 'single' ? '单选' : '多选' }}
          <template v-if="maxCount"> · 最多 {{ maxCount }} 人</template>
          · 已选 {{ selectedCount }} 人
          <template v-if="selectedDeptCount > 0"> · {{ selectedDeptCount }} 个部门</template>
        </span>
        <div class="flex gap-2">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" :disabled="!canConfirm" @click="handleConfirm">
            确定
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, ChevronRight, Building2, User, Loader2, X } from 'lucide-vue-next'
import type { SelectedEmployee, BreadcrumbItem } from '@/types/component/org-selector'
import { useOrgSelector } from '@/hooks/core/useOrgSelector'
import { fetchGetDeptChildren, fetchGetDeptEmployees, fetchGetEmployeesByIds, fetchSearchOrg } from '@/api/org-selector'
import { ElMessage } from 'element-plus'

// =========================================
// Props
// =========================================
const props = withDefaults(defineProps<{
  modelValue: boolean
  mode?: 'single' | 'multiple'
  selectedIds?: (string | number)[]
  excludeIds?: (string | number)[]
  maxCount?: number
  title?: string
}>(), {
  mode: 'multiple',
  title: '选择人员',
})

// =========================================
// Emits
// =========================================
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [payload: { selected: SelectedEmployee[] }]
  cancel: []
}>()

// =========================================
// 选择状态管理（Composable）
// =========================================
const sel = useOrgSelector({
  mode: props.mode,
  maxCount: props.maxCount,
  excludeIds: props.excludeIds,
})

const {
  selectedList,
  selectedDeptList,
  selectedCount,
  canConfirm,
  hasReachedMax,
  isDeptSelected,
  isEmployeeSelected,
  isDeptExcluded,
  isEmployeeExcluded,
  toggleDept,
  toggleEmployee,
  removeSelected,
  clearAll,
  initSelected,
} = sel

// =========================================
// 导航状态
// =========================================
const breadcrumb = ref<BreadcrumbItem[]>([{ id: null, name: '全部部门' }])

function navigateToDept(deptId: string | number | null) {
  const idx = breadcrumb.value.findIndex(b => b.id === deptId)
  if (idx === -1) {
    const dept = currentDepts.value.find(d => d.id === deptId)
    breadcrumb.value.push({ id: deptId, name: dept?.deptName ?? '' })
  } else {
    breadcrumb.value = breadcrumb.value.slice(0, idx + 1)
  }
  loadDept(deptId)
}

// =========================================
// 数据加载
// =========================================
const currentDepts = ref<Api.OrgSelector.DeptNode[]>([])
const currentEmployees = ref<Api.OrgSelector.OrgEmployee[]>([])
const loadingDept = ref(false)
const deptCache = ref<Map<string | number | null, {
  departments: Api.OrgSelector.DeptNode[]
  employees: Api.OrgSelector.OrgEmployee[]
}>>(new Map())

async function loadDept(deptId: string | number | null) {
  loadingDept.value = true
  try {
    const cached = deptCache.value.get(deptId)
    if (cached) {
      currentDepts.value = cached.departments
      currentEmployees.value = cached.employees
      return
    }

    const [deptRes, empRes] = await Promise.all([
      fetchGetDeptChildren({ parentId: deptId }),
      fetchGetDeptEmployees({ deptId: deptId ?? '', page: 1, size: 999 }),
    ])

    const departments = Array.isArray(deptRes) ? deptRes : []
    const employees = empRes?.records ?? []

    deptCache.value.set(deptId, { departments, employees })
    currentDepts.value = departments
    currentEmployees.value = employees
  } catch {
    ElMessage.error('加载组织架构失败')
    currentDepts.value = []
    currentEmployees.value = []
  } finally {
    loadingDept.value = false
  }
}

// =========================================
// 选择逻辑
// =========================================
function handleDeptCheck(checked: boolean, dept: Api.OrgSelector.DeptNode) {
  const children = currentEmployees.value
    .filter(e => String(e.deptId) === String(dept.id))
    .map(e => ({
      id: e.id,
      name: e.name,
      avatar: e.avatar,
      deptId: e.deptId,
      deptName: dept.deptName,
      title: e.title,
    }))

  toggleDept(dept.id, children)
}

function handleEmployeeCheck(checked: boolean, emp: Api.OrgSelector.OrgEmployee) {
  toggleEmployee({
    id: emp.id,
    name: emp.name,
    avatar: emp.avatar,
    deptId: emp.deptId,
    deptName: emp.deptName ?? currentDepts.value.find(d => String(d.id) === String(emp.deptId))?.deptName ?? '',
    title: emp.title,
  })
}

function isDeptIndeterminate(deptId: string | number): boolean {
  const deptEmployees = currentEmployees.value.filter(e => String(e.deptId) === String(deptId))
  if (deptEmployees.length === 0) return false
  const checkedCount = deptEmployees.filter(e => isEmployeeSelected(e.id)).length
  return checkedCount > 0 && checkedCount < deptEmployees.length
}

// =========================================
// 已选标签
// =========================================
const selectedDeptTags = computed(() => selectedDeptList.value)
const selectedEmpTags = computed(() =>
  selectedList.value.map(emp => ({
    id: emp.id,
    name: emp.name,
    deptName: emp.deptName,
  }))
)
const selectedDeptCount = computed(() => selectedDeptList.value.length)

function handleRemoveDeptTag(deptId: string | number) {
  removeSelected(deptId, 'dept')
}

function handleRemoveEmployeeTag(id: string | number) {
  removeSelected(id, 'employee')
}

function handleClearAll() {
  clearAll()
}

// =========================================
// 搜索逻辑
// =========================================
interface SearchResultItem {
  id: string | number
  name: string
  deptName?: string
  deptId?: string | number
  type: 'dept' | 'employee'
  title?: string
  avatar?: string
  hasChildren?: boolean
  employeeCount?: number
}

const searchKeyword = ref('')
const searchResults = ref<SearchResultItem[]>([])
const isSearching = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

async function handleSearchInput(value: string) {
  if (searchTimer) clearTimeout(searchTimer)

  if (!value.trim()) {
    exitSearch()
    return
  }

  searchTimer = setTimeout(async () => {
    isSearching.value = true
    try {
      const res = await fetchSearchOrg({ keyword: value.trim() })
      searchResults.value = [
        ...(res.departments ?? []).map(d => ({ ...d, name: d.deptName, type: 'dept' as const })),
        ...(res.employees ?? []).map(e => ({ ...e, type: 'employee' as const })),
      ]
    } catch {
      searchResults.value = []
    }
  }, 300)
}

function handleSearchClear() {
  exitSearch()
}

function exitSearch() {
  searchKeyword.value = ''
  isSearching.value = false
  searchResults.value = []
}

function handleSearchEmployeeCheck(checked: boolean, item: SearchResultItem) {
  if (isEmployeeExcluded(item.id)) return
  handleEmployeeCheck(checked, {
    id: item.id,
    name: item.name,
    avatar: item.avatar,
    deptId: item.deptId!,
    deptName: item.deptName,
    title: item.title,
  })
}

function handleSearchResultClick(item: SearchResultItem) {
  if (item.type === 'dept') {
    exitSearch()
    navigateToDept(item.id)
  } else if (item.type === 'employee' && !isEmployeeExcluded(item.id)) {
    handleSearchEmployeeCheck(!isEmployeeSelected(item.id), item)
  }
}

// =========================================
// Dialog lifecycle
// =========================================
async function handleOpen() {
  await loadDept(null)

  // 回填已选人员
  if (props.selectedIds?.length) {
    await loadSelectedEmployees()
  }
}

async function loadSelectedEmployees() {
  try {
    const employees = await fetchGetEmployeesByIds(props.selectedIds!)
    const mapped: SelectedEmployee[] = employees.map(e => ({
      id: e.id,
      name: e.name,
      avatar: e.avatar,
      deptId: e.deptId,
      deptName: e.deptName ?? '',
      title: e.title,
    }))
    initSelected(mapped)
  } catch {
    // 回填失败不影响核心功能
  }
}

function handleClose() {
  clearAll()
  breadcrumb.value = [{ id: null, name: '全部部门' }]
  currentDepts.value = []
  currentEmployees.value = []
  exitSearch()
  deptCache.value.clear()
}

function handleCancel() {
  emit('cancel')
  emit('update:modelValue', false)
}

function handleConfirm() {
  emit('confirm', {
    selected: selectedList.value,
  })
  emit('update:modelValue', false)
}

defineOptions({ name: 'OrgSelector' })
</script>


