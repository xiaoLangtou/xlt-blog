/** 组织架构 Mock 数据 */

export interface MockDept {
  id: number
  deptName: string
  parentId: number | null
  hasChildren: boolean
  employeeCount: number
}

export interface MockEmployee {
  id: number
  name: string
  avatar?: string
  deptId: number
  deptName: string
  title?: string
}

// ─── 部门数据 ───────────────────────────

const DEPARTMENTS: MockDept[] = [
  // Level 1 — 根部门
  { id: 1, deptName: '技术研发部', parentId: null, hasChildren: true, employeeCount: 32 },
  { id: 2, deptName: '产品设计部', parentId: null, hasChildren: true, employeeCount: 14 },
  { id: 3, deptName: '市场运营部', parentId: null, hasChildren: true, employeeCount: 18 },
  { id: 4, deptName: '基础设施部', parentId: null, hasChildren: true, employeeCount: 12 },
  { id: 5, deptName: '人力资源部', parentId: null, hasChildren: true, employeeCount: 8 },
  { id: 6, deptName: '财务部', parentId: null, hasChildren: true, employeeCount: 6 },
  { id: 7, deptName: '行政管理部', parentId: null, hasChildren: true, employeeCount: 5 },

  // Level 2 — 技术研发部子部门
  { id: 101, deptName: '前端开发组', parentId: 1, hasChildren: false, employeeCount: 8 },
  { id: 102, deptName: '后端开发组', parentId: 1, hasChildren: false, employeeCount: 12 },
  { id: 103, deptName: '移动开发组', parentId: 1, hasChildren: false, employeeCount: 6 },
  { id: 104, deptName: '测试组', parentId: 1, hasChildren: false, employeeCount: 6 },

  // Level 2 — 产品设计部子部门
  { id: 201, deptName: '产品组', parentId: 2, hasChildren: false, employeeCount: 6 },
  { id: 202, deptName: 'UED 设计组', parentId: 2, hasChildren: false, employeeCount: 8 },

  // Level 2 — 市场运营部子部门
  { id: 301, deptName: '市场推广组', parentId: 3, hasChildren: false, employeeCount: 10 },
  { id: 302, deptName: '内容运营组', parentId: 3, hasChildren: false, employeeCount: 8 },

  // Level 2 — 基础设施部子部门
  { id: 401, deptName: '运维组', parentId: 4, hasChildren: false, employeeCount: 5 },
  { id: 402, deptName: '数据库管理组', parentId: 4, hasChildren: false, employeeCount: 4 },
  { id: 403, deptName: '安全组', parentId: 4, hasChildren: false, employeeCount: 3 },

  // Level 2 — 人力资源部子部门
  { id: 501, deptName: '招聘组', parentId: 5, hasChildren: false, employeeCount: 4 },
  { id: 502, deptName: '薪酬绩效组', parentId: 5, hasChildren: false, employeeCount: 4 },

  // Level 2 — 财务部子部门
  { id: 601, deptName: '会计组', parentId: 6, hasChildren: false, employeeCount: 3 },
  { id: 602, deptName: '资金管理组', parentId: 6, hasChildren: false, employeeCount: 3 },

  // Level 2 — 行政管理部子部门
  { id: 701, deptName: '后勤组', parentId: 7, hasChildren: false, employeeCount: 3 },
  { id: 702, deptName: '法务组', parentId: 7, hasChildren: false, employeeCount: 2 },
]

// ─── 人员数据 ───────────────────────────

const EMPLOYEES: MockEmployee[] = [
  // 技术研发部（直属）
  { id: 1001, name: '张伟', deptId: 1, deptName: '技术研发部', title: '技术总监' },
  { id: 1002, name: '陈明', deptId: 1, deptName: '技术研发部', title: '架构师' },
  { id: 1003, name: '赵岩', deptId: 1, deptName: '技术研发部', title: '技术经理' },
  { id: 1004, name: '刘洋', deptId: 1, deptName: '技术研发部', title: 'DevOps 工程师' },

  // 前端开发组
  { id: 1101, name: '王磊', deptId: 101, deptName: '前端开发组', title: '前端组长' },
  { id: 1102, name: '李婷', deptId: 101, deptName: '前端开发组', title: '高级前端工程师' },
  { id: 1103, name: '周杰', deptId: 101, deptName: '前端开发组', title: '前端工程师' },
  { id: 1104, name: '吴敏', deptId: 101, deptName: '前端开发组', title: '前端工程师' },
  { id: 1105, name: '郑浩', deptId: 101, deptName: '前端开发组', title: '实习生' },

  // 后端开发组
  { id: 1201, name: '孙鹏', deptId: 102, deptName: '后端开发组', title: '后端组长' },
  { id: 1202, name: '黄丽', deptId: 102, deptName: '后端开发组', title: '高级后端工程师' },
  { id: 1203, name: '许强', deptId: 102, deptName: '后端开发组', title: 'Java 工程师' },
  { id: 1204, name: '何静', deptId: 102, deptName: '后端开发组', title: 'Go 工程师' },
  { id: 1205, name: '林涛', deptId: 102, deptName: '后端开发组', title: 'Python 工程师' },

  // 移动开发组
  { id: 1301, name: '马超', deptId: 103, deptName: '移动开发组', title: '移动端组长' },
  { id: 1302, name: '高雪', deptId: 103, deptName: '移动开发组', title: 'iOS 工程师' },
  { id: 1303, name: '罗斌', deptId: 103, deptName: '移动开发组', title: 'Android 工程师' },

  // 测试组
  { id: 1401, name: '梁宇', deptId: 104, deptName: '测试组', title: '测试组长' },
  { id: 1402, name: '宋佳', deptId: 104, deptName: '测试组', title: '高级测试工程师' },
  { id: 1403, name: '唐飞', deptId: 104, deptName: '测试组', title: '自动化测试工程师' },

  // 产品设计部（直属）
  { id: 2001, name: '徐梦', deptId: 2, deptName: '产品设计部', title: '产品总监' },

  // 产品组
  { id: 2101, name: '韩冰', deptId: 201, deptName: '产品组', title: '高级产品经理' },
  { id: 2102, name: '曹阳', deptId: 201, deptName: '产品组', title: '产品经理' },
  { id: 2103, name: '邓婷', deptId: 201, deptName: '产品组', title: '产品助理' },

  // UED 设计组
  { id: 2201, name: '冯凯', deptId: 202, deptName: 'UED 设计组', title: '设计组长' },
  { id: 2202, name: '彭雪', deptId: 202, deptName: 'UED 设计组', title: 'UI 设计师' },
  { id: 2203, name: '蒋浩', deptId: 202, deptName: 'UED 设计组', title: 'UX 设计师' },
  { id: 2204, name: '余雯', deptId: 202, deptName: 'UED 设计组', title: '视觉设计师' },

  // 市场运营部（直属）
  { id: 3001, name: '潘建', deptId: 3, deptName: '市场运营部', title: '运营总监' },

  // 市场推广组
  { id: 3101, name: '姚远', deptId: 301, deptName: '市场推广组', title: '市场经理' },
  { id: 3102, name: '段鑫', deptId: 301, deptName: '市场推广组', title: '渠道运营' },
  { id: 3103, name: '邹蕾', deptId: 301, deptName: '市场推广组', title: '品牌专员' },

  // 内容运营组
  { id: 3201, name: '熊峰', deptId: 302, deptName: '内容运营组', title: '内容主编' },
  { id: 3202, name: '秦瑶', deptId: 302, deptName: '内容运营组', title: '新媒体运营' },
  { id: 3203, name: '范辉', deptId: 302, deptName: '内容运营组', title: '文案策划' },

  // 基础设施部（直属）
  { id: 4001, name: '史进', deptId: 4, deptName: '基础设施部', title: '基础架构总监' },

  // 运维组
  { id: 4101, name: '任浩', deptId: 401, deptName: '运维组', title: '运维经理' },
  { id: 4102, name: '柳青', deptId: 401, deptName: '运维组', title: '运维工程师' },
  { id: 4103, name: '易军', deptId: 401, deptName: '运维组', title: '运维工程师' },

  // 数据库管理组
  { id: 4201, name: '舒敏', deptId: 402, deptName: '数据库管理组', title: 'DBA 主管' },
  { id: 4202, name: '项阳', deptId: 402, deptName: '数据库管理组', title: 'DBA 工程师' },

  // 安全组
  { id: 4301, name: '钱锋', deptId: 403, deptName: '安全组', title: '安全主管' },
  { id: 4302, name: '魏然', deptId: 403, deptName: '安全组', title: '安全工程师' },

  // 人力资源部（直属）
  { id: 5001, name: '方华', deptId: 5, deptName: '人力资源部', title: 'HRD' },

  // 招聘组
  { id: 5101, name: '石磊', deptId: 501, deptName: '招聘组', title: '招聘经理' },
  { id: 5102, name: '谭敏', deptId: 501, deptName: '招聘组', title: '招聘专员' },

  // 薪酬绩效组
  { id: 5201, name: '沈洁', deptId: 502, deptName: '薪酬绩效组', title: '薪酬主管' },
  { id: 5202, name: '贺军', deptId: 502, deptName: '薪酬绩效组', title: '绩效专员' },

  // 财务部（直属）
  { id: 6001, name: '崔岩', deptId: 6, deptName: '财务部', title: '财务总监' },

  // 会计组
  { id: 6101, name: '褚莹', deptId: 601, deptName: '会计组', title: '会计主管' },
  { id: 6102, name: '伍强', deptId: 601, deptName: '会计组', title: '会计' },

  // 资金管理组
  { id: 6201, name: '顾婷', deptId: 602, deptName: '资金管理组', title: '资金主管' },
  { id: 6202, name: '侯杰', deptId: 602, deptName: '资金管理组', title: '出纳' },

  // 行政管理部（直属）
  { id: 7001, name: '武岳', deptId: 7, deptName: '行政管理部', title: '行政总监' },

  // 后勤组
  { id: 7101, name: '雷娟', deptId: 701, deptName: '后勤组', title: '后勤主管' },
  { id: 7102, name: '康辉', deptId: 701, deptName: '后勤组', title: '行政专员' },

  // 法务组
  { id: 7201, name: '岳峰', deptId: 702, deptName: '法务组', title: '法务主管' },
  { id: 7202, name: '邱雯', deptId: 702, deptName: '法务组', title: '法务专员' },
]

// ─── 导出 ───────────────────────────────

export const ORG_DATA = { DEPARTMENTS, EMPLOYEES }

/** 快速初始化 Map，提升后续查找性能 */
export const deptMap = new Map(DEPARTMENTS.map(d => [d.id, d]))
export const deptChildrenMap = new Map<number | null, MockDept[]>()
export const deptEmployeeMap = new Map<number, MockEmployee[]>()

// 建立 parentId → children 索引
for (const d of DEPARTMENTS) {
  const pid = d.parentId ?? 0
  if (!deptChildrenMap.has(pid)) deptChildrenMap.set(pid, [])
  deptChildrenMap.get(pid)!.push(d)
}
// 根部门 key = 0 / null
deptChildrenMap.set(null, deptChildrenMap.get(0)!)
deptChildrenMap.delete(0)

// 建立 deptId → employees 索引
for (const e of EMPLOYEES) {
  if (!deptEmployeeMap.has(e.deptId)) deptEmployeeMap.set(e.deptId, [])
  deptEmployeeMap.get(e.deptId)!.push(e)
}
