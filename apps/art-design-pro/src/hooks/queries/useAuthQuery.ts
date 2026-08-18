/**
 * 认证相关 Query / Mutation Hooks
 *
 * @module hooks/queries/useAuthQuery
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { unref } from 'vue'
import { fetchCaptcha, fetchGetUserInfo, fetchLogin, fetchLogout } from '@/api/auth'
import { queryKeys } from '@/utils/query'

/** 获取图片验证码 */
export function useCaptchaQuery(options?: { enabled?: MaybeRef<boolean> }) {
  return useQuery({
    queryKey: queryKeys.auth.captcha(),
    queryFn: fetchCaptcha,
    enabled: () => unref(options?.enabled) ?? true,
    staleTime: 0,
    gcTime: 0
  })
}

/** 获取当前用户信息 */
export function useUserInfoQuery(options?: { enabled?: MaybeRef<boolean> }) {
  return useQuery({
    queryKey: queryKeys.auth.userInfo(),
    queryFn: fetchGetUserInfo,
    enabled: () => unref(options?.enabled) ?? true
  })
}

/** 用户登录 */
export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: fetchLogin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.all })
    }
  })
}

/** 退出登录 */
export function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: fetchLogout,
    onSettled: () => {
      queryClient.clear()
    }
  })
}
