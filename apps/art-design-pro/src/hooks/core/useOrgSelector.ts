/**
 * useOrgSelector - 组织架构选人多选状态管理
 *
 * 管理选人弹窗的**选择状态**：已选人员、已选部门（递归全选）、排除列表。
 * 导航、搜索等组件 UI 状态由调用方自行管理。
 *
 * ## 核心设计
 *
 * - `selectedEmployees`：单个勾选的人员 Map<id, SelectedEmployee>
 * - `selectedDeptIds`：递归全选的部门 Set<id>
 * - 两者组合得到完整的已选集合。取消部门全选时，自动移除该部门下所有已选人员。
 *
 * @module useOrgSelector
 */

import { computed, readonly, ref, type ComputedRef } from 'vue'
import type { OrgSelectorMode, SelectedEmployee } from '@/types/component/org-selector'
import { ElMessage } from 'element-plus'

interface ExcludeSet {
  departmentIds: Set<string | number>
  employeeIds: Set<string | number>
}

export interface OrgSelectorOptions {
  mode: OrgSelectorMode
  maxCount?: number
  excludeIds?: (string | number)[]
}

export function useOrgSelector(options: OrgSelectorOptions) {
  // =========================================
  // State
  // =========================================

  /** 逐个勾选的人员 */
  const selectedEmployees = ref<Map<string | number, SelectedEmployee>>(new Map())

  /** 递归全选的部门 ID 集合 */
  const selectedDeptIds = ref<Set<string | number>>(new Set())

  /** 排除集合 */
  const excludeSet = ref<ExcludeSet>(buildExcludeSet(options.excludeIds))

  // =========================================
  // Computed
  // =========================================

  /** 已选人员总数 */
  const selectedCount: ComputedRef<number> = computed(() => selectedEmployees.value.size)

  /** 已选人员列表 */
  const selectedList: ComputedRef<SelectedEmployee[]> = computed(() =>
    Array.from(selectedEmployees.value.values())
  )

  /** 已选部门列表 */
  const selectedDeptList: ComputedRef<{ id: string | number; name: string }[]> = computed(() => {
    const names = new Map<string | number, string>()
    selectedEmployees.value.forEach(emp => {
      if (selectedDeptIds.value.has(emp.deptId)) {
        names.set(emp.deptId, emp.deptName)
      }
    })
    return Array.from(names.entries()).map(([id, name]) => ({ id, name }))
  })

  /** 是否达到上限 */
  const hasReachedMax: ComputedRef<boolean> = computed(() => {
    if (!options.maxCount || options.maxCount === Infinity) return false
    return selectedCount.value >= options.maxCount
  })

  /** 是否可以确认 */
  const canConfirm: ComputedRef<boolean> = computed(() => selectedCount.value > 0)

  // =========================================
  // Actions — 人员勾选
  // =========================================

  /** 切换单个人员的选中状态 */
  function toggleEmployee(emp: SelectedEmployee): void {
    const id = emp.id

    if (excludeSet.value.employeeIds.has(id) || excludeSet.value.departmentIds.has(emp.deptId)) {
      ElMessage.warning('该人员不可选')
      return
    }

    const map = selectedEmployees.value

    if (options.mode === 'single') {
      if (map.has(id) && map.size === 1) {
        map.delete(id)
        return
      }
      map.clear()
      selectedDeptIds.value.clear()
      map.set(id, emp)
      return
    }

    if (map.has(id)) {
      map.delete(id)
    } else {
      if (hasReachedMax.value) {
        ElMessage.warning(`最多选择 ${options.maxCount} 人`)
        return
      }
      map.set(id, emp)
    }
  }

  /** 批量添加人员 */
  function batchAddEmployees(employees: SelectedEmployee[]): void {
    if (!employees.length) return

    const map = selectedEmployees.value
    const filtered = employees.filter(
      emp =>
        !excludeSet.value.employeeIds.has(emp.id)
        && !excludeSet.value.departmentIds.has(emp.deptId)
        && !map.has(emp.id)
    )

    if (!filtered.length) return

    if (options.mode === 'single') {
      map.clear()
      selectedDeptIds.value.clear()
      map.set(filtered[0].id, filtered[0])
      return
    }

    const available = options.maxCount
      ? filtered.slice(0, options.maxCount - map.size)
      : filtered

    if (available.length !== filtered.length) {
      ElMessage.warning(`最多选择 ${options.maxCount} 人，已截取`)
    }

    available.forEach(emp => map.set(emp.id, emp))
  }

  /** 批量移除人员 */
  function batchRemoveEmployees(employeeIds: (string | number)[]): void {
    const map = selectedEmployees.value
    employeeIds.forEach(id => map.delete(id))
  }

  // =========================================
  // Actions — 部门全选
  // =========================================

  /** 切换部门全选状态 */
  function toggleDept(deptId: string | number, children: SelectedEmployee[]): void {
    if (excludeSet.value.departmentIds.has(deptId)) {
      ElMessage.warning('该部门不可选')
      return
    }

    const set = selectedDeptIds.value

    if (set.has(deptId)) {
      set.delete(deptId)
      batchRemoveEmployees(children.map(c => c.id))
    } else {
      if (options.mode === 'single') {
        selectedEmployees.value.clear()
        selectedDeptIds.value.clear()
      }
      set.add(deptId)
      batchAddEmployees(children)
    }
  }

  function isDeptSelected(deptId: string | number): boolean {
    return selectedDeptIds.value.has(deptId)
  }

  function isEmployeeSelected(id: string | number): boolean {
    return selectedEmployees.value.has(id)
  }

  function isDeptExcluded(deptId: string | number): boolean {
    return excludeSet.value.departmentIds.has(deptId)
  }

  function isEmployeeExcluded(id: string | number): boolean {
    return excludeSet.value.employeeIds.has(id)
  }

  // =========================================
  // Actions — 移除
  // =========================================

  function removeSelected(id: string | number, type?: 'dept' | 'employee'): void {
    if (type === 'dept') {
      selectedDeptIds.value.delete(id)
      const toRemove: (string | number)[] = []
      selectedEmployees.value.forEach((emp, empId) => {
        if (emp.deptId === id) toRemove.push(empId)
      })
      batchRemoveEmployees(toRemove)
    } else {
      selectedEmployees.value.delete(id)
    }
  }

  function clearAll(): void {
    selectedEmployees.value.clear()
    selectedDeptIds.value.clear()
  }

  // =========================================
  // Actions — 外部初始化
  // =========================================

  function initSelected(initialEmployees: SelectedEmployee[]): void {
    const map = new Map<string | number, SelectedEmployee>()
    initialEmployees.forEach(emp => {
      if (!excludeSet.value.employeeIds.has(emp.id)) {
        map.set(emp.id, emp)
      }
    })
    selectedEmployees.value = map
  }

  // =========================================
  // 工具函数
  // =========================================

  function buildExcludeSet(ids?: (string | number)[]): ExcludeSet {
    const set: ExcludeSet = { departmentIds: new Set(), employeeIds: new Set() }
    if (!ids?.length) return set
    ids.forEach(id => {
      if (typeof id === 'string' && id.startsWith('dept_')) {
        set.departmentIds.add(id.replace('dept_', ''))
      } else {
        set.employeeIds.add(id)
      }
    })
    return set
  }

  return {
    // 只读状态
    selectedEmployees: readonly(selectedEmployees),
    selectedDeptIds: readonly(selectedDeptIds),

    // 计算属性
    selectedList,
    selectedDeptList,
    selectedCount,
    canConfirm,
    hasReachedMax,

    // 查询方法
    isDeptSelected,
    isEmployeeSelected,
    isDeptExcluded,
    isEmployeeExcluded,

    // 操作方法
    toggleEmployee,
    toggleDept,
    batchAddEmployees,
    batchRemoveEmployees,
    removeSelected,
    clearAll,
    initSelected,
  }
}
