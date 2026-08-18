/**
 * 路由守卫导航状态
 *
 * 仅持有守卫导航进行中的标志位，供 HTTP 拦截器判断 401 时是否需要自行跳转登录页。
 * 独立成模块以避免 utils/http 与 router/guards/beforeEach 之间的循环依赖。
 *
 * @module router/guards/navigationState
 */

let guardNavigating = false

export function setGuardNavigating(value: boolean): void {
  guardNavigating = value
}

export function isRouteGuardNavigating(): boolean {
  return guardNavigating
}
