/**
 * 组织架构选人组件类型定义
 *
 * 提供 OrgSelector 组件所需的所有类型定义
 *
 * @module types/component/org-selector
 */

/** 已选人员 */
export interface SelectedEmployee {
  id: string | number
  name: string
  avatar?: string
  deptId: string | number
  deptName: string
  title?: string
}

/** 选择模式 */
export type OrgSelectorMode = 'single' | 'multiple'

/** 组件 Props */
export interface OrgSelectorProps {
  /** 是否可见 */
  modelValue: boolean
  /** 选择模式 */
  mode?: OrgSelectorMode
  /** 已选 ID 列表（v-model） */
  selectedIds?: (string | number)[]
  /** 排除的 ID 列表（不可选、不可见） */
  excludeIds?: (string | number)[]
  /** 最大可选人数 */
  maxCount?: number
  /** 对话框标题 */
  title?: string
}

/** 树节点数据 */
export interface OrgTreeNodeData {
  /** 唯一标识，格式：`dept_${id}` 或 `emp_${id}` */
  nodeKey: string
  /** 节点标签 */
  label: string
  /** 节点类型 */
  nodeType: 'dept' | 'employee'
  /** 原始数据 */
  raw: Api.OrgSelector.DeptNode | Api.OrgSelector.OrgEmployee
  /** 所属部门 ID */
  deptId: string | number
  /** 是否为叶子节点（人员或空部门） */
  isLeaf: boolean
  /** 子节点 */
  children?: OrgTreeNodeData[]
}

/** 面包屑项 */
export interface BreadcrumbItem {
  id: string | number | null
  name: string
}

/** 组件确认事件负载 */
export interface ConfirmPayload {
  selected: SelectedEmployee[]
}
