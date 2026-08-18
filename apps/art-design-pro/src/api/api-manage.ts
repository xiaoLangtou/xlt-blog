import request from '@/utils/http'

/** 获取接口列表 */
export function fetchGetApiList(params?: Api.Common.CommonSearchParams & Record<string, unknown>) {
  return request.get<Api.ApiManage.ApiList>({
    url: '/api/list',
    params
  })
}

/** 获取所有接口 */
export function fetchGetAllApis() {
  return request.get<Api.ApiManage.ApiList>({
    url: '/api/all'
  })
}

/** 获取接口详情 */
export function fetchGetApiDetail(id: number | string) {
  return request.get<Api.ApiManage.IApi>({
    url: `/api/detail/${id}`
  })
}

/** 获取接口分组 */
export function fetchGetApiGroups() {
  return request.get<Api.ApiManage.IApiGroup[]>({
    url: '/api/group'
  })
}

/** 同步接口列表 */
export function fetchSyncApis() {
  return request.get<Api.ApiManage.SyncApiResponse>({
    url: '/api/synchronous'
  })
}

/** 新增接口 */
export function fetchAddApi(params: Api.ApiManage.ApiFormParams) {
  return request.post({
    url: '/api/add',
    params
  })
}

/** 编辑接口 */
export function fetchEditApi(params: Api.ApiManage.ApiFormParams & { id: number }) {
  return request.post({
    url: '/api/edit',
    params
  })
}

/** 删除接口 */
export function fetchRemoveApi(id: number | string) {
  return request.del({
    url: `/api/remove/${id}`
  })
}

/** 忽略接口 */
export function fetchIgnoreApi(params: Api.ApiManage.IApi) {
  return request.post({
    url: '/api/ignore',
    params
  })
}

/** 批量创建接口 */
export function fetchBatchCreateApis(params: Api.ApiManage.IApi[]) {
  return request.post({
    url: '/api/batch-apis',
    params
  })
}

/** 刷新 Casbin 缓存 */
export function fetchFreshCasbin() {
  return request.get({
    url: '/api/freshCasbin'
  })
}
