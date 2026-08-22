import { AppRouteRecordRaw } from '@/utils/router'
import Login from '@views/auth/login/index.vue'
import Register from '@views/auth/register/index.vue'
import ForgetPassword from '@views/auth/forget-password/index.vue'
import Exception403 from '@views/exception/403/index.vue'
import Exception404 from '@views/exception/404/index.vue'
import Exception500 from '@views/exception/500/index.vue'
import Outside from '@views/index/index.vue'
import Iframe from '@/views/outside/Iframe.vue'

/**
 * 静态路由配置（不需要权限就能访问的路由）
 *
 * 属性说明：
 * isHideTab: true 表示不在标签页中显示
 *
 * 注意事项：
 * 1、path、name 不要和动态路由冲突，否则会导致路由冲突无法访问
 * 2、静态路由不管是否登录都可以访问
 */
export const staticRoutes: AppRouteRecordRaw[] = [
  // 不需要登录就能访问的路由示例
  // {
  //   path: '/welcome',
  //   name: 'WelcomeStatic',
  //   component: () => import('@views/dashboard/console/index.vue'),
  //   meta: { title: 'menus.dashboard.title' }
  // },
  {
    path: '/auth/login',
    name: 'Login',
    component: Login,
    meta: { title: 'menus.login.title', isHideTab: true }
  },
  {
    path: '/auth/register',
    name: 'Register',
    component: Register,
    meta: { title: 'menus.register.title', isHideTab: true }
  },
  {
    path: '/auth/forget-password',
    name: 'ForgetPassword',
    component: ForgetPassword,
    meta: { title: 'menus.forgetPassword.title', isHideTab: true }
  },
  {
    path: '/403',
    name: 'Exception403',
    component: Exception403,
    meta: { title: '403', isHideTab: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'Exception404',
    component: Exception404,
    meta: { title: '404', isHideTab: true }
  },
  {
    path: '/500',
    name: 'Exception500',
    component: Exception500,
    meta: { title: '500', isHideTab: true }
  },
  {
    path: '/outside',
    component: Outside,
    name: 'Outside',
    meta: { title: 'menus.outside.title' },
    children: [
      // iframe 内嵌页面
      {
        path: '/outside/iframe/:path',
        name: 'Iframe',
        component: Iframe,
        meta: { title: 'iframe' }
      }
    ]
  }
]
