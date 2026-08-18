import request from '@/utils/http'

/** 根据角色 Code 获取 API 权限 */
export function fetchGetPermissionList(params: Api.Casbin.PermissionSearchParams) {
  return request.get({
    url: '/casbin/permission-list',
    params
  })
}

/** 更新角色 API 权限 */
export function fetchUpdateRolePermission(params: Api.Casbin.UpdateRolePermissionParams) {
  return request.post({
    url: '/casbin/update-role-permission',
    params
  })
}
