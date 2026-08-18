import request from '@/utils/http'

/** 获取角色列表 */
export function fetchGetRoleList(params: Api.Role.RoleSearchParams) {
  return request.get<Api.Role.RoleList>({
    url: '/role/list',
    params
  })
}

/** 获取角色详情 */
export function fetchGetRoleDetail(id: number | string) {
  return request.get<Api.Role.IRole>({
    url: `/role/detail/${id}`
  })
}

/** 创建角色 */
export function fetchAddRole(params: Api.Role.RoleFormParams) {
  return request.post({
    url: '/role/add',
    params
  })
}

/** 更新角色 */
export function fetchEditRole(params: Api.Role.RoleFormParams & { id: number }) {
  return request.post({
    url: '/role/edit',
    params
  })
}

/** 删除角色 */
export function fetchRemoveRole(id: number | string) {
  return request.post({
    url: `/role/remove/${id}`
  })
}

/** 修改角色状态 */
export function fetchChangeRoleStatus(params: Api.Role.RoleStatusParams) {
  return request.put({
    url: '/role/changeStatus',
    params
  })
}

/** 修改角色菜单权限 */
export function fetchChangeRoleMenu(params: Api.Role.RoleMenuParams) {
  return request.put({
    url: '/role/changeMenu',
    params
  })
}

/** 角色分配用户 */
export function fetchAddRoleUsers(params: Api.Role.RoleUsersParams) {
  return request.post({
    url: '/role/add/users',
    params
  })
}

/** 移除角色用户 */
export function fetchRemoveRoleUsers(params: Api.Role.RoleUsersParams) {
  return request.put({
    url: '/role/remove/users',
    params
  })
}
