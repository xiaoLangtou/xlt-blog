# 接口文档

> 基于 `src/service/apis/` 整理，所有接口均通过统一请求封装 `xltRequest` 调用。

---

## 目录

- [认证模块](#认证模块)
- [用户管理](#用户管理)
- [部门管理](#部门管理)
- [角色管理](#角色管理)
- [菜单管理](#菜单管理)
- [字典管理](#字典管理)
- [岗位管理](#岗位管理)
- [接口管理](#接口管理)
- [权限策略（Casbin）](#权限策略casbin)
- [日志管理](#日志管理)
- [缓存信息](#缓存信息)
- [通用](#通用)

---

## 认证模块

### 用户登录

- **方法**：`POST`
- **路径**：`/auth/login`
- **请求体**：

| 字段      | 类型   | 必填 | 说明      |
| --------- | ------ | ---- | --------- |
| username  | string | 是   | 用户名    |
| password  | string | 是   | 密码      |
| captcha   | string | 否   | 验证码    |
| captchaId | string | 否   | 验证码 ID |

- **响应**：

```ts
{
  code: number
  msg: string
  data: {
    accessToken: string
    refreshToken: string
    userInfo: {
      id: number
      username: string
      nickname?: string
      email?: string
      headPic?: string
      roles: any[]
      permissions: string[]
    }
  }
}
```

---

### 获取当前用户信息

- **方法**：`GET`
- **路径**：`/auth/info`
- **响应**：`ServiceResult<{ userInfo: IUserInfo }>`

---

### 获取当前用户菜单

- **方法**：`GET`
- **路径**：`/menu/user/list`
- **响应**：`ServiceResult<MenuOptions[]>`（菜单树形结构）

---

### 退出登录

- **方法**：`POST`
- **路径**：`/auth/logout`
- **响应**：`ServiceResult<{ code: number }>`

---

### 获取验证码

- **方法**：`GET`
- **路径**：`/captcha/image`
- **响应**：

```ts
ServiceResult<{
  captcha: string // Base64 图片
  captchaId: string // 验证码 ID
}>
```

---

## 用户管理

### 获取用户列表

- **方法**：`GET`
- **路径**：`/user/list`
- **请求参数**：

| 字段     | 类型   | 必填 | 说明     |
| -------- | ------ | ---- | -------- |
| current  | number | 否   | 页码     |
| size     | number | 否   | 每页数量 |
| username | string | 否   | 用户名   |
| deptId   | string | 否   | 部门 ID  |
| nickname | string | 否   | 昵称     |
| email    | string | 否   | 邮箱     |
| phone    | string | 否   | 手机号   |
| name     | string | 否   | 姓名     |

- **响应**：`ServiceResult<ResPage<IUser>>`

---

### 获取用户详情

- **方法**：`GET`
- **路径**：`/user/detail/:id`
- **路径参数**：`id` - 用户 ID

---

### 新增用户

- **方法**：`POST`
- **路径**：`/user/add`
- **请求体**：

| 字段      | 类型     | 必填 | 说明         |
| --------- | -------- | ---- | ------------ |
| username  | string   | 否   | 用户名       |
| deptId    | string   | 否   | 部门 ID      |
| post      | number[] | 否   | 岗位 ID 列表 |
| nickname  | string   | 否   | 昵称         |
| email     | string   | 否   | 邮箱         |
| phone     | string   | 否   | 手机号       |
| name      | string   | 否   | 姓名         |
| enName    | string   | 否   | 英文名       |
| remark    | string   | 否   | 备注         |
| roles     | number[] | 否   | 角色 ID 列表 |
| status    | string   | 否   | 状态         |
| sex       | string   | 否   | 性别         |
| jobNumber | string   | 否   | 工号         |

---

### 编辑用户

- **方法**：`POST`
- **路径**：`/user/edit`
- **请求体**：同新增用户，`id` 为必传

---

### 删除用户

- **方法**：`DELETE`
- **路径**：`/user/remove/:id`
- **路径参数**：`id` - 用户 ID

---

### 修改用户状态

- **方法**：`PUT`
- **路径**：`/user/status`
- **请求体**：

| 字段   | 类型   | 必填 | 说明                               |
| ------ | ------ | ---- | ---------------------------------- |
| id     | number | 是   | 用户 ID                            |
| status | string | 是   | 状态（NORMAL：正常，FROZEN：冻结） |

---

### 重置密码

- **方法**：`PUT`
- **路径**：`/user/reset/password`
- **请求体**：

| 字段 | 类型     | 必填 | 说明         |
| ---- | -------- | ---- | ------------ |
| ids  | number[] | 是   | 用户 ID 列表 |

---

### 根据角色获取用户列表

- **方法**：`GET`
- **路径**：`/user/role/list`
- **请求参数**：

| 字段     | 类型   | 必填 | 说明     |
| -------- | ------ | ---- | -------- |
| roleId   | number | 是   | 角色 ID  |
| current  | number | 否   | 页码     |
| size     | number | 否   | 每页数量 |
| username | string | 否   | 用户名   |
| nickname | string | 否   | 昵称     |
| email    | string | 否   | 邮箱     |
| phone    | string | 否   | 手机号   |
| status   | string | 否   | 状态     |

---

### 获取不在当前角色的用户列表

- **方法**：`GET`
- **路径**：`/user/role/not/list`
- **请求参数**：同上

---

## 部门管理

### 获取部门列表（分页）

- **方法**：`GET`
- **路径**：`/dept/list`
- **请求参数**：

| 字段   | 类型   | 必填 | 说明     |
| ------ | ------ | ---- | -------- |
| name   | string | 否   | 部门名称 |
| code   | string | 否   | 部门编码 |
| pid    | number | 否   | 父级 ID  |
| status | number | 否   | 状态     |

- **响应**：`ServiceResult<ResPage<IDept>>`

---

### 获取部门树

- **方法**：`GET`
- **路径**：`/dept/tree`
- **响应**：`ServiceResult<IDept[]>`

---

### 获取部门详情

- **方法**：`GET`
- **路径**：`/dept/detail/:id`
- **路径参数**：`id` - 部门 ID

---

### 新增部门

- **方法**：`POST`
- **路径**：`/dept/add`
- **请求体**：

| 字段       | 类型   | 必填 | 说明     |
| ---------- | ------ | ---- | -------- |
| deptCode   | string | 是   | 部门编码 |
| deptName   | string | 是   | 部门名称 |
| deptType   | string | 是   | 部门类型 |
| fullName   | string | 是   | 全称     |
| orderNum   | number | 是   | 排序     |
| parentId   | number | 是   | 父级 ID  |
| address    | string | 否   | 地址     |
| email      | string | 否   | 邮箱     |
| leader     | string | 否   | 负责人   |
| phone      | string | 否   | 电话     |
| postalCode | string | 否   | 邮编     |
| remark     | string | 否   | 备注     |

---

### 更新部门

- **方法**：`POST`
- **路径**：`/dept/edit`
- **请求体**：同新增部门，`id` 为必传

---

### 删除部门

- **方法**：`DELETE`
- **路径**：`/dept/remove/:id`
- **路径参数**：`id` - 部门 ID

---

### 修改部门状态

- **方法**：`PUT`
- **路径**：`/dept/change-status`
- **请求体**：

| 字段   | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | number | 是   | 部门 ID |
| status | number | 是   | 状态    |

---

### 生成部门常量

- **方法**：`GET`
- **路径**：`/dept/generate-dept-constants`

---

## 角色管理

### 获取角色列表

- **方法**：`GET`
- **路径**：`/role/list`
- **请求参数**：

| 字段      | 类型           | 必填 | 说明       |
| --------- | -------------- | ---- | ---------- |
| current   | number         | 否   | 页码       |
| size      | number         | 否   | 每页数量   |
| roleName  | string         | 否   | 角色名称   |
| roleCode  | string         | 否   | 角色编码   |
| isEnable  | number\|string | 否   | 状态       |
| startTime | string         | 否   | 创建时间起 |
| endTime   | string         | 否   | 创建时间止 |

- **响应**：`ServiceResult<ResPage<IRole>>`

---

### 获取角色详情

- **方法**：`GET`
- **路径**：`/role/detail/:id`
- **路径参数**：`id` - 角色 ID
- **响应**：`ServiceResult<IRole>`

---

### 创建角色

- **方法**：`POST`
- **路径**：`/role/add`
- **请求体**：

| 字段        | 类型   | 必填 | 说明     |
| ----------- | ------ | ---- | -------- |
| roleName    | string | 否   | 角色名称 |
| roleCode    | string | 否   | 角色编码 |
| description | string | 否   | 角色描述 |
| sortOrder   | number | 否   | 排序     |

---

### 更新角色

- **方法**：`POST`
- **路径**：`/role/edit`
- **请求体**：同创建角色，`id` 为必传

---

### 删除角色

- **方法**：`POST`
- **路径**：`/role/remove/:id`
- **路径参数**：`id` - 角色 ID

---

### 修改角色状态

- **方法**：`PUT`
- **路径**：`/role/changeStatus`
- **请求体**：

| 字段     | 类型   | 必填 | 说明    |
| -------- | ------ | ---- | ------- |
| roleId   | number | 是   | 角色 ID |
| isEnable | number | 是   | 状态    |

---

### 修改角色菜单权限

- **方法**：`PUT`
- **路径**：`/role/changeMenu`
- **请求体**：

| 字段    | 类型     | 必填 | 说明         |
| ------- | -------- | ---- | ------------ |
| id      | number   | 是   | 角色 ID      |
| menus   | number[] | 否   | 菜单 ID 列表 |
| buttons | number[] | 否   | 按钮 ID 列表 |

---

### 角色分配用户

- **方法**：`POST`
- **路径**：`/role/add/users`
- **请求体**：

| 字段   | 类型     | 必填 | 说明         |
| ------ | -------- | ---- | ------------ |
| roleId | number   | 是   | 角色 ID      |
| users  | number[] | 是   | 用户 ID 列表 |

---

### 移除角色用户

- **方法**：`PUT`
- **路径**：`/role/remove/users`
- **请求体**：同角色分配用户

---

## 菜单管理

### 获取菜单树

- **方法**：`GET`
- **路径**：`/menu/tree`
- **请求参数**：

| 字段 | 类型   | 必填 | 说明     |
| ---- | ------ | ---- | -------- |
| name | string | 否   | 菜单名称 |

---

### 获取菜单详情

- **方法**：`GET`
- **路径**：`/menu/detail/:id`
- **路径参数**：`id` - 菜单 ID
- **响应**：`ServiceResult<IMenu>`

---

### 创建菜单

- **方法**：`POST`
- **路径**：`/menu/create`
- **请求体**：

| 字段        | 类型          | 必填 | 说明        |
| ----------- | ------------- | ---- | ----------- |
| parentId    | number        | 是   | 父级菜单 ID |
| name        | string        | 是   | 菜单名称    |
| menuType    | number        | 是   | 菜单类型    |
| sortOrder   | number        | 是   | 排序        |
| path        | string        | 否   | 路由路径    |
| component   | string        | 否   | 组件路径    |
| icon        | string        | 否   | 图标        |
| isKeepAlive | string        | 否   | 是否缓存    |
| isHide      | string        | 否   | 是否隐藏    |
| isIframe    | string        | 否   | 是否内嵌    |
| permission  | string        | 否   | 权限标识    |
| enName      | string        | 否   | 英文名      |
| buttons     | IButtonItem[] | 否   | 按钮列表    |

---

### 更新菜单

- **方法**：`POST`
- **路径**：`/menu/update`
- **请求体**：同创建菜单，`id` 为必传

---

### 删除菜单

- **方法**：`DELETE`
- **路径**：`/menu/delete/:id`
- **路径参数**：`id` - 菜单 ID

---

## 字典管理

### 获取字典类型列表

- **方法**：`GET`
- **路径**：`/dict/list`
- **请求参数**：

| 字段 | 类型   | 必填 | 说明           |
| ---- | ------ | ---- | -------------- |
| name | string | 否   | 字典名称或编码 |

- **响应**：`ServiceResult<IDictType[]>`

---

### 获取字典类型详情

- **方法**：`GET`
- **路径**：`/dict/detail/:id`
- **路径参数**：`id` - 字典 ID
- **响应**：`ServiceResult<IDictType>`

---

### 新增字典类型

- **方法**：`POST`
- **路径**：`/dict/add`
- **请求体**：

| 字段       | 类型   | 必填 | 说明     |
| ---------- | ------ | ---- | -------- |
| dictName   | string | 是   | 字典名称 |
| dictCode   | string | 是   | 字典编码 |
| systemFlag | string | 是   | 系统标识 |
| dictDesc   | string | 否   | 字典描述 |

---

### 更新字典类型

- **方法**：`POST`
- **路径**：`/dict/update`
- **请求体**：同新增字典类型，`id` 为必传

---

### 删除字典类型

- **方法**：`DELETE`
- **路径**：`/dict/remove/:id`
- **路径参数**：`id` - 字典 ID

---

### 获取字典数据列表

- **方法**：`GET`
- **路径**：`/dict/data/list`
- **请求参数**：

| 字段    | 类型   | 必填 | 说明        |
| ------- | ------ | ---- | ----------- |
| typeId  | number | 是   | 字典类型 ID |
| current | number | 否   | 页码        |
| size    | number | 否   | 每页数量    |

- **响应**：`ServiceResult<ResPage<IDictData>>`

---

### 获取字典数据详情

- **方法**：`GET`
- **路径**：`/dict/data/detail/:id`
- **路径参数**：`id` - 字典数据 ID
- **响应**：`ServiceResult<IDictData>`

---

### 根据字典类型获取字典数据

- **方法**：`GET`
- **路径**：`/dict/data/type-detail`
- **请求参数**：

| 字段 | 类型   | 必填 | 说明         |
| ---- | ------ | ---- | ------------ |
| type | string | 是   | 字典类型编码 |

- **响应**：`ServiceResult<ResPage<IDictData>>`

---

### 新增字典数据

- **方法**：`POST`
- **路径**：`/dict/data/add`
- **请求体**：

| 字段       | 类型   | 必填 | 说明        |
| ---------- | ------ | ---- | ----------- |
| dictValue  | string | 是   | 字典值      |
| dictLabel  | string | 是   | 字典标签    |
| dictTypeId | number | 是   | 字典类型 ID |
| dictRemark | string | 否   | 备注        |
| dictSort   | number | 否   | 排序        |

---

### 更新字典数据

- **方法**：`POST`
- **路径**：`/dict/data/update`
- **请求体**：同新增字典数据，`id` 为必传

---

### 删除字典数据

- **方法**：`DELETE`
- **路径**：`/dict/data/remove/:id`
- **路径参数**：`id` - 字典数据 ID

---

## 岗位管理

### 获取岗位列表

- **方法**：`GET`
- **路径**：`/post/list`
- **请求参数**：

| 字段    | 类型           | 必填 | 说明     |
| ------- | -------------- | ---- | -------- |
| current | number         | 否   | 页码     |
| size    | number         | 否   | 每页数量 |
| name    | string         | 否   | 岗位名称 |
| code    | string         | 否   | 岗位编码 |
| status  | number\|string | 否   | 状态     |

- **响应**：`ServiceResult<ResPage<IPost>>`

---

### 获取岗位详情

- **方法**：`GET`
- **路径**：`/post/detail/:id`
- **路径参数**：`id` - 岗位 ID
- **响应**：`ServiceResult<IPost>`

---

### 新增岗位

- **方法**：`POST`
- **路径**：`/post/add`
- **请求体**：

| 字段        | 类型           | 必填 | 说明     |
| ----------- | -------------- | ---- | -------- |
| name        | string         | 否   | 岗位名称 |
| code        | string         | 否   | 岗位编码 |
| status      | number\|string | 否   | 状态     |
| description | string         | 否   | 描述     |
| sortOrder   | number         | 否   | 排序     |

---

### 编辑岗位

- **方法**：`POST`
- **路径**：`/post/edit`
- **请求体**：同新增岗位，`id` 为必传

---

### 删除岗位

- **方法**：`DELETE`
- **路径**：`/post/remove/:id`
- **路径参数**：`id` - 岗位 ID

---

### 修改岗位状态

- **方法**：`PUT`
- **路径**：`/post/status`
- **请求体**：

| 字段   | 类型           | 必填 | 说明    |
| ------ | -------------- | ---- | ------- |
| id     | number\|string | 是   | 岗位 ID |
| status | number         | 是   | 状态    |

---

## 接口管理

### 获取接口列表

- **方法**：`GET`
- **路径**：`/api/list`
- **请求参数**：分页参数及其他查询条件
- **响应**：`ServiceResult<ResPage<IApi[]>>`

---

### 获取所有接口

- **方法**：`GET`
- **路径**：`/api/all`
- **响应**：`ServiceResult<ResPage<IApi[]>>`

---

### 获取接口详情

- **方法**：`GET`
- **路径**：`/api/detail/:id`
- **路径参数**：`id` - 接口 ID
- **响应**：`ServiceResult<IApi>`

---

### 获取接口分组

- **方法**：`GET`
- **路径**：`/api/group`
- **响应**：`ServiceResult<IApiGroup[]>`

---

### 同步接口列表

- **方法**：`GET`
- **路径**：`/api/synchronous`
- **响应**：

```ts
ServiceResult<{
  newApis: IApi[]
  deleteApis: IApi[]
  ignoreApis: IApi[]
  apiGroups: string[]
}>
```

---

### 新增接口

- **方法**：`POST`
- **路径**：`/api/add`
- **请求体**：

| 字段        | 类型        | 必填 | 说明     |
| ----------- | ----------- | ---- | -------- |
| path        | string      | 否   | 接口路径 |
| description | string      | 否   | 描述     |
| method      | HTTP_METHOD | 否   | 请求方法 |
| apiGroup    | string      | 否   | 所属分组 |

---

### 编辑接口

- **方法**：`POST`
- **路径**：`/api/edit`
- **请求体**：同新增接口，`id` 为必传

---

### 删除接口

- **方法**：`DELETE`
- **路径**：`/api/remove/:id`
- **路径参数**：`id` - 接口 ID

---

### 忽略接口

- **方法**：`POST`
- **路径**：`/api/ignore`
- **请求体**：`IApi`

---

### 批量创建接口

- **方法**：`POST`
- **路径**：`/api/batch-apis`
- **请求体**：`IApi[]`

---

### 刷新 Casbin 缓存

- **方法**：`GET`
- **路径**：`/api/freshCasbin`

---

## 权限策略（Casbin）

### 根据角色 Code 获取 API 权限

- **方法**：`GET`
- **路径**：`/casbin/permission-list`
- **请求参数**：

| 字段 | 类型   | 必填 | 说明     |
| ---- | ------ | ---- | -------- |
| code | string | 是   | 角色编码 |

---

### 更新角色 API 权限

- **方法**：`POST`
- **路径**：`/casbin/update-role-permission`
- **请求体**：

| 字段     | 类型   | 必填 | 说明     |
| -------- | ------ | ---- | -------- |
| roleCode | string | 是   | 角色编码 |
| apis     | any[]  | 是   | 权限列表 |

---

## 日志管理

### 获取日志列表

- **方法**：`GET`
- **路径**：`/logger/list`
- **请求参数**：

| 字段      | 类型   | 必填 | 说明     |
| --------- | ------ | ---- | -------- |
| current   | number | 否   | 页码     |
| size      | number | 否   | 每页数量 |
| startTime | string | 否   | 开始时间 |
| endTime   | string | 否   | 结束时间 |
| createBy  | string | 否   | 操作人   |

- **响应**：`ServiceResult<ResPage<ILogs>>`

---

### 获取日志详情

- **方法**：`GET`
- **路径**：`/logger/detail?id={id}`
- **请求参数**：

| 字段 | 类型   | 必填 | 说明    |
| ---- | ------ | ---- | ------- |
| id   | number | 是   | 日志 ID |

- **响应**：`ServiceResult<ILogs>`，字段包含：请求路径、请求方法、请求参数、请求 IP、请求耗时、浏览器类型、操作系统、所属模块、响应体等。

---

## 缓存信息

### 获取 Redis 缓存信息

- **方法**：`GET`
- **路径**：`/redis-cache/info`
- **响应**：`ICache`

---

## 通用

### 获取 Gitee 动态

- **方法**：`GET`
- **路径**：`/gitee/news`

---

## 通用响应结构

```ts
// 统一响应包装
interface ServiceResult<T> {
  code: number
  data: T
  message: string
}

// 分页响应
interface ResPage<T> {
  records: T[]
  pager?: {
    current: number
    pageSize: number
    total: number
  }
}
```
