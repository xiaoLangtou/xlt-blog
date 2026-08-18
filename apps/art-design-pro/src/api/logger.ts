import request from '@/utils/http'

/** 获取日志列表 */
export function fetchGetLogList(params: Api.Logger.LogSearchParams) {
  return request.get<Api.Logger.LogList>({
    url: '/logger/list',
    params
  })
}

/** 获取日志详情 */
export function fetchGetLogDetail(params: Api.Logger.LogDetailParams) {
  return request.get<Api.Logger.ILogs>({
    url: '/logger/detail',
    params
  })
}
