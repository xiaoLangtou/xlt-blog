import request from '@/utils/http'

/** 获取部门列表（分页） */
export function fetchGetDeptList(params: Api.Dept.DeptSearchParams) {
  return request.get<Api.Dept.DeptList>({
    url: '/dept/list',
    params
  })
}

/** 获取部门树 */
export function fetchGetDeptTree() {
  return request.get<Api.Dept.IDept[]>({
    url: '/dept/tree'
  })
}

/** 获取部门详情 */
export function fetchGetDeptDetail(id: number | string) {
  return request.get<Api.Dept.IDept>({
    url: `/dept/detail/${id}`
  })
}

/** 新增部门 */
export function fetchAddDept(params: Api.Dept.DeptFormParams) {
  return request.post({
    url: '/dept/add',
    params
  })
}

/** 更新部门 */
export function fetchEditDept(params: Api.Dept.DeptFormParams & { id: number }) {
  return request.post({
    url: '/dept/edit',
    params
  })
}

/** 删除部门 */
export function fetchRemoveDept(id: number | string) {
  return request.del({
    url: `/dept/remove/${id}`
  })
}

/** 修改部门状态 */
export function fetchChangeDeptStatus(params: Api.Dept.DeptStatusParams) {
  return request.put({
    url: '/dept/change-status',
    params
  })
}

/** 生成部门常量 */
export function fetchGenerateDeptConstants() {
  return request.get({
    url: '/dept/generate-dept-constants'
  })
}
