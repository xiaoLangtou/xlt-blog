/**
 * API 接口类型定义模块
 *
 * 提供所有后端接口的类型定义
 *
 * @module types/api/api
 */

declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<PaginationParams, 'current' | 'size'>

    /** 分页信息 */
    interface Pager {
      current: number
      pageSize: number
      total: number
      totalPage?: number
      lastPage?: number
      nextPage?: number
    }

    /** 分页响应（后端 ResPage 结构） */
    interface ResPage<T = unknown> {
      records: T[]
      pager?: Pager
      page?: Pager
    }

    /** 分页响应（兼容扁平结构） */
    interface PaginatedResponse<T = unknown> extends ResPage<T> {
      current?: number
      size?: number
      total?: number
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2'

    /** HTTP 请求方法 */
    type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      username: string
      password: string
      captcha?: string
      captchaId?: string
    }

    /** 博客服务端用户信息 */
    interface IUserInfo {
      id: number
      username: string
      nickname?: string
      email?: string
      avatar?: string | null
    }

    /** 登录响应 */
    interface LoginResponse {
      accessToken: string
      refreshToken: string
      userInfo: IUserInfo
    }

    /** xlt-blog 登录响应 */
    interface BlogLoginResponse {
      token: string
      user: IUserInfo
    }

    /** 验证码响应 */
    interface CaptchaResponse {
      captchaId: string
      captcha: string
    }

    /** 用户信息（前端使用） */
    interface UserInfo {
      buttons: string[]
      roles: string[]
      userId: number
      userName: string
      email: string
      avatar?: string
      nickname?: string
    }

    /** 退出登录响应 */
    interface LogoutResponse {
      code: number
    }
  }

  /** 用户管理 */
  namespace User {
    /** 用户实体 */
    interface IUser {
      id: number
      username?: string
      deptId?: string
      post?: number[]
      nickname?: string
      email?: string
      phone?: string
      name?: string
      enName?: string
      remark?: string
      roles?: number[]
      status?: string
      sex?: string
      jobNumber?: string
      createTime?: string
      updateTime?: string
    }

    /** 用户列表 */
    type UserList = Api.Common.ResPage<IUser>

    /** 用户搜索参数 */
    interface UserSearchParams extends Api.Common.CommonSearchParams {
      username?: string
      deptId?: string
      nickname?: string
      email?: string
      phone?: string
      name?: string
    }

    /** 新增/编辑用户参数 */
    interface UserFormParams {
      id?: number
      username?: string
      deptId?: string
      post?: number[]
      nickname?: string
      email?: string
      phone?: string
      name?: string
      enName?: string
      remark?: string
      roles?: number[]
      status?: string
      sex?: string
      jobNumber?: string
    }

    /** 修改用户状态参数 */
    interface UserStatusParams {
      id: number
      status: 'NORMAL' | 'FROZEN' | string
    }

    /** 重置密码参数 */
    interface ResetPasswordParams {
      ids: number[]
    }

    /** 角色用户列表搜索参数 */
    interface RoleUserSearchParams extends Api.Common.CommonSearchParams {
      roleId: number
      username?: string
      nickname?: string
      email?: string
      phone?: string
      status?: string
    }
  }

  /** 部门管理 */
  namespace Dept {
    interface IDept {
      id?: number
      deptCode?: string
      deptName?: string
      deptType?: string
      fullName?: string
      orderNum?: number
      parentId?: number
      address?: string
      email?: string
      leader?: string
      phone?: string
      postalCode?: string
      remark?: string
      status?: number
      children?: IDept[]
    }

    type DeptList = Api.Common.ResPage<IDept>

    interface DeptSearchParams extends Api.Common.CommonSearchParams {
      name?: string
      code?: string
      pid?: number
      status?: number
    }

    interface DeptFormParams {
      id?: number
      deptCode: string
      deptName: string
      deptType: string
      fullName: string
      orderNum: number
      parentId: number
      address?: string
      email?: string
      leader?: string
      phone?: string
      postalCode?: string
      remark?: string
    }

    interface DeptStatusParams {
      id: number
      status: number
    }
  }

  /** 角色管理 */
  namespace Role {
    interface IRole {
      id?: number
      roleId?: number
      roleName?: string
      roleCode?: string
      description?: string
      sortOrder?: number
      isEnable?: number | string
      createTime?: string
    }

    type RoleList = Api.Common.ResPage<IRole>

    interface RoleSearchParams extends Api.Common.CommonSearchParams {
      roleName?: string
      roleCode?: string
      isEnable?: number | string
      startTime?: string
      endTime?: string
    }

    interface RoleFormParams {
      id?: number
      roleName?: string
      roleCode?: string
      description?: string
      sortOrder?: number
    }

    interface RoleStatusParams {
      roleId: number
      isEnable: number
    }

    interface RoleMenuParams {
      id: number
      menus?: number[]
      buttons?: number[]
    }

    interface RoleUsersParams {
      roleId: number
      users: number[]
    }
  }

  /** 菜单管理 */
  namespace Menu {
    interface IButtonItem {
      id?: number
      name?: string
      permission?: string
      sortOrder?: number
    }

    /** 后端返回的 meta 结构 */
    interface IMenuMeta {
      icon?: string
      isKeepAlive?: boolean | string
      isHide?: boolean | string
      isAffix?: boolean | string
      isIframe?: boolean | string
      iframeUrl?: string
      requiresAuth?: boolean
      title?: string
    }

    interface IMenu {
      id?: number
      parentId?: number
      parentMenuId?: number
      name?: string
      menuType?: number | string
      sortOrder?: number
      path?: string
      component?: string | null
      icon?: string
      isKeepAlive?: string | boolean
      isHide?: string | boolean
      isIframe?: string | boolean
      iframeUrl?: string | null
      permission?: string | null
      enName?: string
      buttons?: IButtonItem[]
      meta?: IMenuMeta
      children?: IMenu[]
    }

    interface MenuFormParams {
      id?: number
      parentId: number
      name: string
      menuType: number
      sortOrder: number
      path?: string
      component?: string
      icon?: string
      isKeepAlive?: string
      isHide?: string
      isIframe?: string
      permission?: string
      enName?: string
      buttons?: IButtonItem[]
    }

    interface MenuTreeSearchParams {
      name?: string
    }
  }

  /** 字典管理 */
  namespace Dict {
    interface IDictType {
      id?: number
      dictName?: string
      dictCode?: string
      systemFlag?: string
      dictDesc?: string
      status?: number | null
      remark?: string | null
      createBy?: string
      updateBy?: string
      createTime?: string
      updateTime?: string | null
    }

    interface IDictData {
      id?: number
      dictValue?: string
      dictLabel?: string
      dictTypeId?: number
      dictRemark?: string
      dictSort?: number
    }

    type DictTypeList = Api.Common.ResPage<IDictType>
    type DictDataList = Api.Common.ResPage<IDictData>

    interface DictTypeSearchParams extends Api.Common.CommonSearchParams {
      name?: string
    }

    interface DictTypeFormParams {
      id?: number
      dictName: string
      dictCode: string
      systemFlag: string
      dictDesc?: string
    }

    interface DictDataSearchParams extends Api.Common.CommonSearchParams {
      typeId: number
    }

    interface DictDataTypeSearchParams extends Api.Common.CommonSearchParams {
      type: string
    }

    interface DictDataFormParams {
      id?: number
      dictValue: string
      dictLabel: string
      dictTypeId: number
      dictRemark?: string
      dictSort?: number
    }
  }

  /** 岗位管理 */
  namespace Post {
    interface IPost {
      id?: number | string
      name?: string
      code?: string
      status?: number | string
      description?: string
      sortOrder?: number
      createTime?: string
    }

    type PostList = Api.Common.ResPage<IPost>

    interface PostSearchParams extends Api.Common.CommonSearchParams {
      name?: string
      code?: string
      status?: number | string
    }

    interface PostFormParams {
      id?: number | string
      name?: string
      code?: string
      status?: number | string
      description?: string
      sortOrder?: number
    }

    interface PostStatusParams {
      id: number | string
      status: number
    }
  }

  /** 接口管理 */
  namespace ApiManage {
    interface IApi {
      id?: number
      path?: string
      description?: string
      method?: Api.Common.HttpMethod
      apiGroup?: string
    }

    interface IApiGroup {
      groupName?: string
      apis?: IApi[]
    }

    type ApiList = Api.Common.ResPage<IApi[]>

    interface ApiFormParams {
      id?: number
      path?: string
      description?: string
      method?: Api.Common.HttpMethod
      apiGroup?: string
      tags?: string
    }

    interface SyncApiResponse {
      newApis: IApi[]
      deleteApis: IApi[]
      ignoreApis: IApi[]
      apiGroups: string[]
    }
  }

  /** Casbin 权限 */
  namespace Casbin {
    interface PermissionSearchParams {
      code: string
    }

    interface UpdateRolePermissionParams {
      roleCode: string
      apis: unknown[]
    }
  }

  /** 日志管理 */
  namespace Logger {
    interface ILogs {
      id?: number
      requestPath?: string
      requestMethod?: string
      requestUrl?: string
      requestParams?: string
      requestIp?: string
      requestIpAddr?: string
      requestTime?: number
      requestTimeConsume?: string
      browser?: string
      os?: string
      module?: string
      logType?: string
      logContent?: string
      responseBody?: string
      status?: number
      createBy?: string
      createTime?: string
    }

    type LogList = Api.Common.ResPage<ILogs>

    interface LogSearchParams extends Api.Common.CommonSearchParams {
      startTime?: string
      endTime?: string
      createBy?: string
    }

    interface LogDetailParams {
      id: number
    }
  }

  /** 缓存信息 */
  namespace Cache {
    interface ICache {
      info?: Record<string, unknown>
      dbSize?: number
      commandStats?: Record<string, unknown>[]
    }
  }

  /** 组织架构选人组件 */
  namespace OrgSelector {
    /** 组织部门节点（树节点） */
    interface DeptNode {
      id: number | string
      deptName: string
      parentId: number | string | null
      hasChildren: boolean
      employeeCount?: number
    }

    /** 部门下的人员 */
    interface OrgEmployee {
      id: number | string
      name: string
      avatar?: string
      deptId: number | string
      deptName?: string
      title?: string
    }

    /** 获取子部门列表参数 */
    interface DeptChildrenParams {
      parentId: number | string | null
    }

    /** 获取部门下人员列表参数 */
    interface DeptEmployeeParams {
      deptId: number | string
      page: number
      size: number
      keyword?: string
    }

    /** 搜索参数 */
    interface SearchParams {
      keyword: string
      page?: number
      size?: number
    }

    /** 搜索结果 */
    interface SearchResult {
      departments: DeptNode[]
      employees: OrgEmployee[]
    }
  }

  /** 系统管理（兼容现有页面） */
  namespace SystemManage {
    /** 用户列表项（页面兼容） */
    interface UserListItem {
      id: number
      avatar: string
      status: string
      userName: string
      userGender: string
      nickName: string
      userPhone: string
      userEmail: string
      userRoles: string[]
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
    }

    type UserList = Api.Common.PaginatedResponse<UserListItem>

    type UserSearchParams = Partial<
      Pick<UserListItem, 'id' | 'userName' | 'userGender' | 'userPhone' | 'userEmail' | 'status'> &
        Api.Common.CommonSearchParams
    >

    interface RoleListItem {
      roleId: number
      roleName: string
      roleCode: string
      description: string
      enabled: boolean
      createTime: string
    }

    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    type RoleSearchParams = Partial<
      Pick<RoleListItem, 'roleId' | 'roleName' | 'roleCode' | 'description' | 'enabled'> &
        Api.Common.CommonSearchParams & {
          startTime: string | null
          endTime: string | null
        }
    >
  }
}
