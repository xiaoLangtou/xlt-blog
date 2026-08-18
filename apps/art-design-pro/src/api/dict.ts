import request from '@/utils/http'

/** 获取字典类型列表（分页） */
export function fetchGetDictTypeList(params?: Api.Dict.DictTypeSearchParams) {
  return request.get<Api.Dict.DictTypeList>({
    url: '/dict/list',
    params
  })
}

/** 获取字典类型详情 */
export function fetchGetDictTypeDetail(id: number | string) {
  return request.get<Api.Dict.IDictType>({
    url: `/dict/detail/${id}`
  })
}

/** 新增字典类型 */
export function fetchAddDictType(params: Api.Dict.DictTypeFormParams) {
  return request.post({
    url: '/dict/add',
    params
  })
}

/** 更新字典类型 */
export function fetchUpdateDictType(params: Api.Dict.DictTypeFormParams & { id: number }) {
  return request.post({
    url: '/dict/update',
    params
  })
}

/** 删除字典类型 */
export function fetchRemoveDictType(id: number | string) {
  return request.del({
    url: `/dict/remove/${id}`
  })
}

/** 获取字典数据列表 */
export function fetchGetDictDataList(params: Api.Dict.DictDataSearchParams) {
  return request.get<Api.Dict.DictDataList>({
    url: '/dict/data/list',
    params
  })
}

/** 获取字典数据详情 */
export function fetchGetDictDataDetail(id: number | string) {
  return request.get<Api.Dict.IDictData>({
    url: `/dict/data/detail/${id}`
  })
}

/** 根据字典类型获取字典数据 */
export function fetchGetDictDataByType(params: Api.Dict.DictDataTypeSearchParams) {
  return request.get<Api.Dict.DictDataList>({
    url: '/dict/data/type-detail',
    params
  })
}

/** 新增字典数据 */
export function fetchAddDictData(params: Api.Dict.DictDataFormParams) {
  return request.post({
    url: '/dict/data/add',
    params
  })
}

/** 更新字典数据 */
export function fetchUpdateDictData(params: Api.Dict.DictDataFormParams & { id: number }) {
  return request.post({
    url: '/dict/data/update',
    params
  })
}

/** 删除字典数据 */
export function fetchRemoveDictData(id: number | string) {
  return request.del({
    url: `/dict/data/remove/${id}`
  })
}
