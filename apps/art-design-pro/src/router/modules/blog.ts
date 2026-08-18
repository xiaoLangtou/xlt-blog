import type { AppRouteRecord } from '@/types/router'

export const blogRoutes: AppRouteRecord = {
  name: 'Blog',
  path: '/blog',
  component: '/index/index',
  redirect: '/blog/articles',
  meta: {
    title: '内容管理',
    icon: 'ri:article-line'
  },
  children: [
    {
      name: 'BlogArticles',
      path: 'articles',
      component: '/blog/articles/index',
      meta: {
        title: '文章管理',
        icon: 'ri:file-text-line',
        keepAlive: true,
        fixedTab: true
      }
    },
    {
      name: 'BlogArticleCreate',
      path: 'articles/new',
      component: '/blog/articles/editor',
      meta: {
        title: '新建文章',
        isHide: true,
        isHideTab: true
      }
    },
    {
      name: 'BlogArticleEdit',
      path: 'articles/:id/edit',
      component: '/blog/articles/editor',
      meta: {
        title: '编辑文章',
        isHide: true,
        isHideTab: true
      }
    },
    {
      name: 'BlogCategories',
      path: 'categories',
      component: '/blog/categories/index',
      meta: {
        title: '分类管理',
        icon: 'ri:folder-3-line',
        keepAlive: true
      }
    },
    {
      name: 'BlogTags',
      path: 'tags',
      component: '/blog/tags/index',
      meta: {
        title: '标签管理',
        icon: 'ri:price-tag-3-line',
        keepAlive: true
      }
    },
    {
      name: 'BlogColumns',
      path: 'columns',
      component: '/blog/columns/index',
      meta: {
        title: '专栏管理',
        icon: 'ri:archive-line',
        keepAlive: true
      }
    },
    {
      name: 'BlogAttachments',
      path: 'attachments',
      component: '/blog/attachments/index',
      meta: {
        title: '媒体库',
        icon: 'ri:image-line',
        keepAlive: true
      }
    },
    {
      name: 'BlogComments',
      path: 'comments',
      component: '/blog/comments/index',
      meta: {
        title: '评论管理',
        icon: 'ri:chat-3-line',
        keepAlive: true
      }
    }
  ]
}
