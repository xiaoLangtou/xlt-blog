import request from '@/utils/http'

/** 获取 Redis 缓存信息 */
export function fetchGetRedisCacheInfo() {
  return request.get<Api.Cache.ICache>({
    url: '/redis-cache/info'
  })
}
