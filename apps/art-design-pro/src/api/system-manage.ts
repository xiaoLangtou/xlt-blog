/**
 * 系统管理 API（兼容层）
 * 保留原有导入路径，内部转发至对应模块并做字段映射
 */
import { fetchGetUserList as fetchUserListRaw } from './user'
import { fetchGetRoleList as fetchRoleListRaw } from './role'
export { fetchGetMenuList } from './menu'

function mapUserItem(user: Api.User.IUser): Api.SystemManage.UserListItem {
  return {
    id: user.id,
    avatar: '',
    status: user.status ?? '',
    userName: user.username ?? '',
    userGender: user.sex ?? '',
    nickName: user.nickname ?? '',
    userPhone: user.phone ?? '',
    userEmail: user.email ?? '',
    userRoles: user.roles?.map(String) ?? [],
    createBy: '',
    createTime: user.createTime ?? '',
    updateBy: '',
    updateTime: user.updateTime ?? ''
  }
}

function mapRoleItem(role: Api.Role.IRole): Api.SystemManage.RoleListItem {
  const roleId = role.roleId ?? role.id ?? 0
  return {
    roleId,
    roleName: role.roleName ?? '',
    roleCode: role.roleCode ?? '',
    description: role.description ?? '',
    enabled: role.isEnable === 1 || role.isEnable === '1',
    createTime: role.createTime ?? ''
  }
}

function normalizePageResult<T>(res: Api.Common.PaginatedResponse<T>) {
  return {
    records: res.records,
    total: res.pager?.total ?? res.total ?? res.records.length,
    current: res.pager?.current ?? res.current ?? 1,
    size: res.pager?.pageSize ?? res.size ?? res.records.length
  }
}

/** 获取用户列表（页面兼容） */
export async function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  const apiParams: Api.User.UserSearchParams = {
    current: params.current ?? 1,
    size: params.size ?? 20,
    username: params.userName,
    email: params.userEmail,
    phone: params.userPhone
  }

  const res = await fetchUserListRaw(apiParams)
  const page = normalizePageResult(res)

  return {
    ...page,
    records: res.records.map(mapUserItem)
  } satisfies Api.SystemManage.UserList
}

/** 获取角色列表（页面兼容） */
export async function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  const apiParams: Api.Role.RoleSearchParams = {
    current: params.current ?? 1,
    size: params.size ?? 20,
    roleName: params.roleName,
    roleCode: params.roleCode,
    isEnable: params.enabled === true ? 1 : params.enabled === false ? 0 : undefined,
    startTime: params.startTime ?? undefined,
    endTime: params.endTime ?? undefined
  }

  const res = await fetchRoleListRaw(apiParams)
  const page = normalizePageResult(res)

  return {
    ...page,
    records: res.records.map(mapRoleItem)
  } satisfies Api.SystemManage.RoleList
}
