import request from '@/utils/http'

/** 将博客服务端用户信息映射为目标应用会话格式 */
function mapUserInfo(info: Api.Auth.IUserInfo): Api.Auth.UserInfo {
  return {
    userId: info.id,
    userName: info.username,
    email: info.email ?? '',
    avatar: info.avatar ?? undefined,
    nickname: info.nickname,
    // 博客服务端仅提供认证，没有通用 RBAC 数据。
    roles: [],
    buttons: []
  }
}

/** 用户登录 */
export async function fetchLogin(params: Api.Auth.LoginParams) {
  const data = await request.post<Api.Auth.BlogLoginResponse>({
    url: '/auth/login',
    params: {
      username: params.username,
      password: params.password
    }
  })

  return {
    accessToken: data.token,
    userInfo: mapUserInfo(data.user)
  }
}

/** 获取当前用户信息 */
export async function fetchGetUserInfo() {
  const data = await request.get<Api.Auth.IUserInfo>({
    url: '/auth/me'
  })
  return mapUserInfo(data)
}

/** 退出登录 */
export function fetchLogout() {
  return request.post<void>({
    url: '/auth/logout'
  })
}
