import { ORG_DATA, deptChildrenMap, deptEmployeeMap, deptMap } from '@/mock/temp/org-data'
import type { MockDept, MockEmployee } from '@/mock/temp/org-data'

// ─── 模拟异步延迟 ───────────────────────
function delay<T>(data: T, ms = 150): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), ms))
}

// ─── 工具 ───────────────────────────────

/** 收集某部门及其所有子孙部门的 ID */
function collectDescendantDeptIds(deptId: number | null): number[] {
  const ids: number[] = []
  const walk = (pid: number) => {
    const children = deptChildrenMap.get(pid) ?? []
    for (const d of children) {
      ids.push(d.id)
      if (d.hasChildren) walk(d.id)
    }
  }
  walk(deptId ?? 0)
  return ids
}

/** 收集某部门及其所有子孙部门的全部人员 */
function collectDescendantEmployees(deptId: number | null): MockEmployee[] {
  const deptIds = collectDescendantDeptIds(deptId)
  const all: MockEmployee[] = []
  for (const id of deptIds) {
    const emps = deptEmployeeMap.get(id) ?? []
    all.push(...emps)
  }
  return all
}

// ─── API Mock 实现 ──────────────────────

/** 获取子部门列表 */
export function fetchGetDeptChildren(params: { parentId: number | string | null }) {
  const pid = params.parentId ? Number(params.parentId) : null
  const children: MockDept[] = deptChildrenMap.get(pid) ?? []
  return delay<MockDept[]>(children.map(c => ({ ...c })))
}

/** 获取部门下的人员（分页） */
export function fetchGetDeptEmployees(params: { deptId: number | string; page: number; size: number; keyword?: string }) {
  const id = Number(params.deptId)
  const all = deptEmployeeMap.get(id) ?? []
  const filtered = params.keyword
    ? all.filter(e => e.name.includes(params.keyword!))
    : all
  return delay({
    records: filtered.slice((params.page - 1) * params.size, params.page * params.size),
    pager: { current: params.page, pageSize: params.size, total: filtered.length }
  })
}

/** 全局搜索组织架构 */
export function fetchSearchOrg(params: { keyword: string }) {
  const kw = params.keyword.toLowerCase()

  const matchedDepts = ORG_DATA.DEPARTMENTS
    .filter(d => d.deptName.includes(kw))
    .map(d => ({ ...d }))

  const matchedEmployees = ORG_DATA.EMPLOYEES
    .filter(e => e.name.includes(kw))
    .map(e => ({ ...e }))

  return delay({ departments: matchedDepts, employees: matchedEmployees })
}

/** 批量获取人员信息（用于 selectedIds 回填） */
export function fetchGetEmployeesByIds(ids: (string | number)[]) {
  const idSet = new Set(ids.map(Number))
  const result = ORG_DATA.EMPLOYEES.filter(e => idSet.has(e.id))
  return delay<MockEmployee[]>(result.map(e => ({ ...e })))
}

/** 获取部门详情 */
export function fetchGetDeptDetail(id: number | string) {
  const dept = deptMap.get(Number(id))
  return delay(dept ? { ...dept } : null)
}
