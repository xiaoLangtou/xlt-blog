import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ArticleQueryDto, CreateCommentDto } from './blog.dto'
import { BlogService } from './blog.service'

/** 博客前台公开接口，白名单模式下默认放行 */
@Controller()
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get('articles')
  listArticles(@Query() query: ArticleQueryDto) {
    return this.blogService.listArticles(query)
  }

  @Get('articles/:slug')
  getArticle(@Param('slug') slug: string) {
    return this.blogService.getArticleBySlug(slug)
  }

  @Get('articles/:slug/comments')
  listComments(@Param('slug') slug: string) {
    return this.blogService.listComments(slug)
  }

  @Post('articles/:slug/comments')
  createComment(@Param('slug') slug: string, @Body() dto: CreateCommentDto) {
    return this.blogService.createComment(slug, dto)
  }

  @Get('categories')
  listCategories() {
    return this.blogService.listCategories()
  }

  @Get('tags')
  listTags() {
    return this.blogService.listTags()
  }

  @Get('columns')
  listColumns() {
    return this.blogService.listColumns()
  }

  @Get('columns/:slug')
  getColumn(@Param('slug') slug: string) {
    return this.blogService.getColumnBySlug(slug)
  }

  @Get('archive')
  archive() {
    return this.blogService.archive()
  }

  @Get('site/stats')
  siteStats() {
    return this.blogService.siteStats()
  }

  @Get('site/config')
  siteConfig() {
    return this.blogService.siteConfig()
  }

  @Get('links')
  listLinks() {
    return this.blogService.listLinks()
  }

  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) {
    return this.blogService.getPageBySlug(slug)
  }
}
