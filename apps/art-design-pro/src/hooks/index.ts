// 通用功能集合
export { useCommon } from './core/useCommon'

// 应用模式
export { useAppMode } from './core/useAppMode'

// 权限控制
export { useAuth } from './core/useAuth'

// 表格数据管理方案
export { useTable } from './core/useTable'

// 表格列配置管理
export { useTableColumns } from './core/useTableColumns'

// 主题相关
export { useTheme } from './core/useTheme'

// 礼花+文字滚动
export { useCeremony } from './core/useCeremony'

// 顶栏快速入口
export { useFastEnter } from './core/useFastEnter'

// 顶栏功能管理
export { useHeaderBar } from './core/useHeaderBar'

// 图表相关
export { useChart, useChartComponent, useChartOps } from './core/useChart'

// 组织架构选人
export { useOrgSelector } from './core/useOrgSelector'

// 布局高度
export { useLayoutHeight, useAutoLayoutHeight } from './core/useLayoutHeight'

// TanStack Query
export {
  useCaptchaQuery,
  useUserInfoQuery,
  useLoginMutation,
  useLogoutMutation
} from './queries/useAuthQuery'
export { useMenuQuery } from './queries/useMenuQuery'
export {
  useDictTypeListQuery,
  useAddDictTypeMutation,
  useUpdateDictTypeMutation,
  useRemoveDictTypeMutation,
  useDictDataListQuery,
  useAddDictDataMutation,
  useUpdateDictDataMutation,
  useRemoveDictDataMutation
} from './queries/useDictQuery'
export {
  useDeptListQuery,
  useDeptTreeQuery,
  useDeptDetailQuery,
  useGenerateDeptConstantsQuery,
  useAddDeptMutation,
  useEditDeptMutation,
  useRemoveDeptMutation,
  useChangeDeptStatusMutation
} from './queries/useDeptQuery'
export {
  usePostListQuery,
  usePostDetailQuery,
  useAddPostMutation,
  useEditPostMutation,
  useRemovePostMutation,
  useChangePostStatusMutation
} from './queries/usePostQuery'
export {
  useApiListQuery,
  useAllApisQuery,
  useApiDetailQuery,
  useApiGroupsQuery,
  useSyncApisQuery,
  useAddApiMutation,
  useEditApiMutation,
  useRemoveApiMutation,
  useIgnoreApiMutation,
  useBatchCreateApisMutation
} from './queries/useApiQuery'
export {
  useLogListQuery,
  useLogDetailQuery
} from './queries/useLoggerQuery'
export { useCacheInfoQuery } from './queries/useCacheQuery'
export {
  useBlogArticleListQuery,
  useBlogArticleQuery,
  useBlogCategoriesQuery,
  useBlogTagsQuery,
  useBlogCommentsQuery,
  useBlogAttachmentsQuery
} from './queries/useBlogQuery'
