import request from '@/utils/http'

/** 获取岗位列表 */
export function fetchGetPostList(params: Api.Post.PostSearchParams) {
  return request.get<Api.Post.PostList>({
    url: '/post/list',
    params
  })
}

/** 获取岗位详情 */
export function fetchGetPostDetail(id: number | string) {
  return request.get<Api.Post.IPost>({
    url: `/post/detail/${id}`
  })
}

/** 新增岗位 */
export function fetchAddPost(params: Api.Post.PostFormParams) {
  return request.post({
    url: '/post/add',
    params
  })
}

/** 编辑岗位 */
export function fetchEditPost(params: Api.Post.PostFormParams & { id: number | string }) {
  return request.post({
    url: '/post/edit',
    params
  })
}

/** 删除岗位 */
export function fetchRemovePost(id: number | string) {
  return request.del({
    url: `/post/remove/${id}`
  })
}

/** 修改岗位状态 */
export function fetchChangePostStatus(params: Api.Post.PostStatusParams) {
  return request.put({
    url: '/post/status',
    params
  })
}
