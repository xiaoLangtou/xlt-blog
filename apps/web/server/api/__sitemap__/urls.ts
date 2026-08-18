import type { SitemapUrlInput } from '#sitemap/types'
import type { ApiResponse, ArchiveGroup } from '@xlt-blog/shared'

// 提供文章动态 URL 给 @nuxtjs/sitemap（nuxt.config 中 sitemap.sources 引用）
export default defineSitemapEventHandler(async () => {
  const config = useRuntimeConfig()
  try {
    const res = await $fetch<ApiResponse<ArchiveGroup[]>>('/archive', {
      baseURL: config.public.apiBase
    })
    return (res.data ?? []).flatMap(group =>
      group.articles.map(article => ({
        loc: `/posts/${article.slug}`,
        lastmod: article.publishedAt ?? undefined
      } satisfies SitemapUrlInput))
    )
  }
  catch {
    return []
  }
})
