# 组织架构选人组件

基于飞书组织架构选人功能的Vue 3 + TypeScript实现，支持多层级部门结构、人员搜索、多选/单选等功能。

## ✨ 特性

- 🌲 **树状结构**: 支持多层级部门嵌套
- 🔍 **智能搜索**: 支持部门名称、人员姓名、职位模糊搜索
- 🎯 **多选模式**: 支持单选、多选、仅选人员等模式
- 🧭 **面包屑导航**: 清晰的层级导航
- 📱 **响应式设计**: 适配移动端和桌面端
- 🎨 **现代化UI**: 基于Ant Design Vue的美观界面
- 🔧 **TypeScript**: 完整的类型定义支持
- ⚡ **高性能**: 基于Vue 3 Composition API

## 📦 安装使用

### 基础用法

```vue
<template>
  <OrgSelector
    :data="orgData"
    :multiple="true"
    :only-select-person="false"
    @change="handleSelectionChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import OrgSelector from '@/components/org-selector/index.vue';
import type { OrgData } from '@/utils/org-tree';

const orgData = ref<OrgData>({
  children: [
    {
      id: 'dept-001',
      name: '技术研发部',
      children: [
        {
          id: 'dept-001-001',
          name: '前端开发组',
          children: [],
          staffs: [
            { idStaff: 'staff-001', staffName: '张三', position: '前端工程师' }
          ]
        }
      ],
      staffs: [
        { idStaff: 'staff-002', staffName: '技术总监', position: '技术总监' }
      ]
    }
  ]
});

const handleSelectionChange = (selectedItems) => {
  console.log('选中的项目:', selectedItems);
};
</script>
```

### 高级用法

```vue
<template>
  <div class="org-selector-container">
    <!-- 单选模式 -->
    <OrgSelector
      :data="orgData"
      :multiple="false"
      @change="handleSingleSelection"
    />

    <!-- 仅选人员模式 -->
    <OrgSelector
      :data="orgData"
      :only-select-person="true"
      @change="handlePersonSelection"
    />
  </div>
</template>
```

### 使用工具函数

```typescript
import {
  initializeOrgData,
  collectAllStaff,
  searchOrgData,
  getParentPath,
  getOrgStatistics,
  exportSelectedData
} from '@/utils/org-tree';

// 初始化数据
const processedData = initializeOrgData(rawOrgData);

// 搜索功能
const searchResults = searchOrgData('张三', orgData);

// 获取统计信息
const stats = getOrgStatistics(orgData);
console.log(`总计: ${stats.totalStaff}人, ${stats.totalDepartments}部门`);

// 导出选中数据
const exportData = exportSelectedData(orgData);
```

## 🔧 API 文档

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `OrgData` | `{}` | 组织架构数据 |
| `multiple` | `boolean` | `true` | 是否支持多选 |
| `onlySelectPerson` | `boolean` | `false` | 是否只能选择人员 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `change` | `selectedItems: (Staff \| Department)[]` | 选择项发生变化时触发 |

### 数据结构

#### OrgData

```typescript
interface OrgData {
  children: Department[];
  staffs?: Staff[];
}
```

#### Department

```typescript
interface Department {
  id: string;
  name: string;
  children?: Department[];
  staffs?: Staff[];
  isChecked?: boolean;
  type?: 'department';
  parent?: string;
  level?: number;
}
```

#### Staff

```typescript
interface Staff {
  idStaff: string;
  staffName: string;
  position?: string;
  isChecked?: boolean;
  type?: 'staff';
  parent?: string;
}
```

## 🛠️ 工具函数

### 数据处理

```typescript
// 初始化数据，添加必要属性
initializeOrgData(data: OrgData): OrgData

// 收集所有人员
collectAllStaff(orgData: OrgData): Staff[]

// 人员去重
deduplicateStaff(staffList: Staff[]): Staff[]
```

### 搜索功能

```typescript
// 搜索部门和人员
searchOrgData(keyword: string, orgData: OrgData): Array<Staff | Department>

// 获取部门下所有人员
getDepartmentStaff(department: Department): Staff[]
```

### 路径处理

```typescript
// 获取父级路径
getParentPath(nodeId: string, orgData: OrgData, isStaff?: boolean): Department[]

// 获取显示路径
getNodeDisplayPath(nodeId: string, orgData: OrgData, isStaff?: boolean): string
```

### 状态管理

```typescript
// 更新选中状态
updateNodeCheckStatus(nodeId: string, checked: boolean, orgData: OrgData, isStaff?: boolean): void

// 获取选中节点
getSelectedNodes(orgData: OrgData): Array<Staff | Department>

// 清空选中状态
clearAllSelection(orgData: OrgData): void
```

### 统计和导出

```typescript
// 获取统计信息
getOrgStatistics(orgData: OrgData): {
  totalDepartments: number;
  totalStaff: number;
  selectedDepartments: number;
  selectedStaff: number;
  totalNodes: number;
  selectedNodes: number;
}

// 导出选中数据
exportSelectedData(orgData: OrgData): Array<{
  id: string;
  name: string;
  type: string;
  path: string;
  position?: string;
  level?: number;
}>
```

## 🎨 样式定制

### CSS 变量

```scss
.org-selector {
  --org-primary-color: #1890ff;
  --org-border-color: #d9d9d9;
  --org-hover-bg: #f5f5f5;
  --org-selected-bg: #e6f7ff;
}
```

### 自定义样式

```scss
.org-selector {
  // 自定义组件整体样式
  .org-tree {
    // 自定义树结构样式
  }
  
  .selected-panel {
    // 自定义选中面板样式
  }
  
  .search-results {
    // 自定义搜索结果样式
  }
}
```

## 📱 响应式设计

组件采用响应式设计，自动适配不同屏幕尺寸：

- **桌面端**: 左右分栏布局，完整功能
- **平板端**: 适中布局，保持可用性
- **移动端**: 上下布局，优化触摸体验

## 🔍 搜索功能

### 搜索范围

- 部门名称
- 人员姓名
- 职位信息

### 搜索特性

- 模糊匹配
- 实时搜索
- 高亮显示
- 路径展示

## 💡 使用场景

1. **人员选择**: 选择项目成员、审批人员等
2. **部门管理**: 部门权限分配、组织架构管理
3. **通知发送**: 选择通知接收人员或部门
4. **数据权限**: 设置数据访问权限范围

## 🎯 最佳实践

### 1. 数据预处理

```typescript
// 建议在接收到后端数据后进行预处理
const processedData = initializeOrgData(apiResponse);
```

### 2. 性能优化

```typescript
// 对于大量数据，建议使用虚拟滚动
// 或者分页加载
const pagedData = usePagination(orgData, 100);
```

### 3. 缓存策略

```typescript
// 缓存搜索结果
const searchCache = new Map();
const cachedSearch = (keyword: string) => {
  if (searchCache.has(keyword)) {
    return searchCache.get(keyword);
  }
  const result = searchOrgData(keyword, orgData);
  searchCache.set(keyword, result);
  return result;
};
```

## 🐛 常见问题

### Q: 如何处理大量数据？
A: 可以使用虚拟滚动或分页加载来优化性能。

### Q: 如何自定义搜索逻辑？
A: 可以重写 `searchOrgData` 函数或传入自定义搜索函数。

### Q: 如何实现权限控制？
A: 在数据处理阶段过滤掉无权限的部门和人员。

### Q: 如何支持多选限制？
A: 可以在 `handleCheckChange` 中添加数量限制逻辑。

## 🔄 更新日志

### v1.0.0 (2024-01-01)
- ✨ 初始版本发布
- 🌲 支持多层级部门结构
- 🔍 实现搜索功能
- 🎯 支持多选/单选模式
- 📱 响应式设计

## 📄 许可证

MIT License

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来完善这个组件！

### 开发流程

1. Fork 本仓库
2. 创建特性分支
3. 提交你的修改
4. 推送到分支
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 进行开发
- 遵循 Vue 3 Composition API 最佳实践
- 保持代码简洁和注释完整
- 编写单元测试

---

**基于飞书组织架构选人功能的现代化Vue 3实现** 🚀 
