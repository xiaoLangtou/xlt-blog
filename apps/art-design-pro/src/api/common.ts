import request from '@/utils/http'

/** 获取 Gitee 动态 */
export function fetchGetGiteeNews() {
  return request.get({
    url: '/gitee/news'
  })
}
