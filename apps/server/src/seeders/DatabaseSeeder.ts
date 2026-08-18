import type { EntityManager } from '@mikro-orm/mysql'
import { Seeder } from '@mikro-orm/seeder'
import { ArticleStatus, CodeTheme, ContentFormat, DEFAULT_MENUS, DEFAULT_THEME_COLOR } from '@xlt-blog/shared'
import { hash } from 'bcryptjs'
import { Article, Category, Setting, Tag, User } from '../entities'

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    // 管理员账号（幂等：已存在则跳过）
    const username = process.env.ADMIN_USERNAME ?? 'admin'
    let admin = await em.findOne(User, { username })
    if (!admin) {
      admin = em.create(User, {
        username,
        password: await hash(process.env.ADMIN_PASSWORD ?? 'admin123', 10),
        nickname: '博主',
        avatar: null,
        createdAt: new Date()
      })
    }

    let category = await em.findOne(Category, { slug: 'uncategorized' })
    if (!category) {
      category = em.create(Category, {
        name: '默认分类',
        slug: 'uncategorized',
        description: '未分类文章',
        sort: 0
      })
    }

    let tag = await em.findOne(Tag, { slug: 'hello' })
    if (!tag) {
      tag = em.create(Tag, { name: 'Hello', slug: 'hello' })
    }

    const exists = await em.findOne(Article, { slug: 'hello-world' })
    if (!exists) {
      const article = em.create(Article, {
        title: 'Hello World',
        slug: 'hello-world',
        summary: '欢迎来到我的博客，这是第一篇示例文章。',
        content: [
          '# Hello World',
          '',
          '欢迎来到 **xlt-blog**！这是一篇由 seeder 生成的示例文章。',
          '',
          '## 代码高亮示例',
          '',
          '```ts',
          'const greet = (name: string) => `Hello, ${name}!`',
          "console.log(greet('World'))",
          '```',
          '',
          '> 你可以在管理后台编辑或删除这篇文章。'
        ].join('\n'),
        codeTheme: CodeTheme.Github,
        contentFormat: ContentFormat.Markdown,
        cover: null,
        status: ArticleStatus.Published,
        views: 0,
        category,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      article.tags.add(tag)
    }

    // 默认站点设置（幂等）
    const themeSetting = await em.findOne(Setting, { key: 'themeColor' })
    if (!themeSetting) {
      em.create(Setting, { key: 'themeColor', value: DEFAULT_THEME_COLOR })
    }
    const menusSetting = await em.findOne(Setting, { key: 'menus' })
    if (!menusSetting) {
      em.create(Setting, { key: 'menus', value: DEFAULT_MENUS })
    }

    await em.flush()
  }
}
