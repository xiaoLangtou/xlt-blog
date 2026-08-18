import request from '@/utils/http'

/** 获取用户列表 */
export function fetchGetUserList(params: Api.User.UserSearchParams) {
  return request.get<Api.User.UserList>({
    url: '/user/list',
    params
  })
}

/** 获取用户详情 */
export function fetchGetUserDetail(id: number | string) {
  return request.get<Api.User.IUser>({
    url: `/user/detail/${id}`
  })
}

/** 新增用户 */
export function fetchAddUser(params: Api.User.UserFormParams) {
  return request.post({
    url: '/user/add',
    params
  })
}

/** 编辑用户 */
export function fetchEditUser(params: Api.User.UserFormParams & { id: number }) {
  return request.post({
    url: '/user/edit',
    params
  })
}

/** 删除用户 */
export function fetchRemoveUser(id: number | string) {
  return request.del({
    url: `/user/remove/${id}`
  })
}

/** 修改用户状态 */
export function fetchChangeUserStatus(params: Api.User.UserStatusParams) {
  return request.put({
    url: '/user/status',
    params
  })
}

/** 重置密码 */
export function fetchResetUserPassword(params: Api.User.ResetPasswordParams) {
  return request.put({
    url: '/user/reset/password',
    params
  })
}

/** 根据角色获取用户列表 */
export function fetchGetUserListByRole(params: Api.User.RoleUserSearchParams) {
  return request.get<Api.User.UserList>({
    url: '/user/role/list',
    params
  })
}

/** 获取不在当前角色的用户列表 */
export function fetchGetUserListNotInRole(params: Api.User.RoleUserSearchParams) {
  return request.get<Api.User.UserList>({
    url: '/user/role/not/list',
    params
  })
}
