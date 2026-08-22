import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ArticleStatus, CommentStatus } from "@xlt-blog/shared";
import { XltCheckLogin } from "@xlt-token/nestjs";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { diskStorage } from "multer";
import { extname, join } from "node:path";
import {
  AdminArticleQueryDto,
  AdminAttachmentQueryDto,
  AdminColumnQueryDto,
  AdminCommentQueryDto,
  AdminTagQueryDto,
  PreviewContentDto,
  ReplyCommentDto,
  SaveAdminMenuDto,
  SaveArticleDto,
  SaveCategoryDto,
  SaveColumnDto,
  SaveFriendLinkDto,
  SavePageDto,
  SaveSettingsDto,
  SaveTagDto,
  SetColumnArticlesDto,
} from "./admin.dto";
import { CompleteAiDto } from "./ai.dto";
import { AdminService } from "./admin.service";
import { AiService } from "./ai.service";

const UPLOAD_DIR = join(process.cwd(), process.env.UPLOAD_DIR ?? "uploads");

/** 管理接口，全部要求登录 */
@XltCheckLogin()
@Controller("admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly aiService: AiService,
  ) {}

  // ---------- 仪表盘 ----------

  @Get("dashboard")
  dashboard() {
    return this.adminService.dashboard();
  }

  // ---------- 文章 ----------

  @Get("articles")
  listArticles(@Query() query: AdminArticleQueryDto) {
    return this.adminService.listArticles(query);
  }

  @Get("articles/:id")
  getArticle(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.getArticle(id);
  }

  @Post("articles")
  createArticle(@Body() dto: SaveArticleDto) {
    return this.adminService.createArticle(dto);
  }

  /** 内容实时预览：三编辑器共用，与保存同一渲染管线 */
  @Post("content/preview")
  previewContent(@Body() dto: PreviewContentDto) {
    return this.adminService.previewContent(dto);
  }

  /** 批量重渲染：转换器/白名单升级后回刷存量文章与页面 */
  @Post("content/rerender")
  rerenderContent() {
    return this.adminService.rerenderOutdatedContent();
  }

  @Put("articles/:id")
  updateArticle(@Param("id", ParseIntPipe) id: number, @Body() dto: SaveArticleDto) {
    return this.adminService.updateArticle(id, dto);
  }

  @Put("articles/:id/publish")
  publishArticle(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.setArticleStatus(id, ArticleStatus.Published);
  }

  @Put("articles/:id/unpublish")
  unpublishArticle(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.setArticleStatus(id, ArticleStatus.Draft);
  }

  @Delete("articles/:id")
  deleteArticle(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.deleteArticle(id);
  }

  // ---------- 分类 ----------

  @Get("categories")
  listCategories() {
    return this.adminService.listCategories();
  }

  @Post("categories")
  createCategory(@Body() dto: SaveCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Put("categories/:id")
  updateCategory(@Param("id", ParseIntPipe) id: number, @Body() dto: SaveCategoryDto) {
    return this.adminService.updateCategory(id, dto);
  }

  @Delete("categories/:id")
  deleteCategory(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.deleteCategory(id);
  }

  // ---------- 标签 ----------

  @Get("tags")
  listTags(@Query() query: AdminTagQueryDto) {
    return this.adminService.listTags(query);
  }

  @Get("tags/all")
  listAllTags() {
    return this.adminService.listAllTags();
  }

  @Post("tags")
  createTag(@Body() dto: SaveTagDto) {
    return this.adminService.createTag(dto);
  }

  @Put("tags/:id")
  updateTag(@Param("id", ParseIntPipe) id: number, @Body() dto: SaveTagDto) {
    return this.adminService.updateTag(id, dto);
  }

  @Delete("tags/:id")
  deleteTag(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.deleteTag(id);
  }

  // ---------- 专栏 ----------

  @Get("columns")
  listColumns(@Query() query: AdminColumnQueryDto) {
    return this.adminService.listColumns(query);
  }

  @Get("columns/all")
  listAllColumns() {
    return this.adminService.listAllColumns();
  }

  @Get("columns/:id")
  getColumn(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.getColumn(id);
  }

  @Post("columns")
  createColumn(@Body() dto: SaveColumnDto) {
    return this.adminService.createColumn(dto);
  }

  @Put("columns/:id")
  updateColumn(@Param("id", ParseIntPipe) id: number, @Body() dto: SaveColumnDto) {
    return this.adminService.updateColumn(id, dto);
  }

  @Delete("columns/:id")
  deleteColumn(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.deleteColumn(id);
  }

  @Put("columns/:id/articles")
  setColumnArticles(@Param("id", ParseIntPipe) id: number, @Body() dto: SetColumnArticlesDto) {
    return this.adminService.setColumnArticles(id, dto);
  }

  // ---------- 评论 ----------

  @Get("comments")
  listComments(@Query() query: AdminCommentQueryDto) {
    return this.adminService.listComments(query);
  }

  @Put("comments/:id/approve")
  approveComment(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.setCommentStatus(id, CommentStatus.Approved);
  }

  @Put("comments/:id/reject")
  rejectComment(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.setCommentStatus(id, CommentStatus.Rejected);
  }

  @Post("comments/:id/reply")
  replyComment(@Param("id", ParseIntPipe) id: number, @Body() dto: ReplyCommentDto) {
    return this.adminService.replyComment(id, dto.content);
  }

  @Delete("comments/:id")
  deleteComment(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.deleteComment(id);
  }

  // ---------- 设置 ----------

  @Get("settings")
  getSettings() {
    return this.adminService.getSettings();
  }

  @Put("settings")
  saveSettings(@Body() dto: SaveSettingsDto) {
    return this.adminService.saveSettings(dto);
  }

  // ---------- 附件 ----------

  @Get("attachments")
  listAttachments(@Query() query: AdminAttachmentQueryDto) {
    return this.adminService.listAttachments(query);
  }

  @Get("attachments/stats")
  getAttachmentStats() {
    return this.adminService.getAttachmentStats();
  }

  @Delete("attachments/:id")
  deleteAttachment(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.deleteAttachment(id);
  }

  // ---------- 独立页面 ----------

  @Get("pages")
  listPages() {
    return this.adminService.listPages();
  }

  @Get("pages/:id")
  getPage(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.getPage(id);
  }

  @Post("pages")
  createPage(@Body() dto: SavePageDto) {
    return this.adminService.createPage(dto);
  }

  @Put("pages/:id")
  updatePage(@Param("id", ParseIntPipe) id: number, @Body() dto: SavePageDto) {
    return this.adminService.updatePage(id, dto);
  }

  @Delete("pages/:id")
  deletePage(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.deletePage(id);
  }

  // ---------- 友情链接 ----------

  @Get("links")
  listLinks() {
    return this.adminService.listLinks();
  }

  @Post("links")
  createLink(@Body() dto: SaveFriendLinkDto) {
    return this.adminService.createLink(dto);
  }

  @Put("links/:id")
  updateLink(@Param("id", ParseIntPipe) id: number, @Body() dto: SaveFriendLinkDto) {
    return this.adminService.updateLink(id, dto);
  }

  @Delete("links/:id")
  deleteLink(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.deleteLink(id);
  }

  // ---------- AI ----------

  @Post("ai")
  completeAi(@Body() dto: CompleteAiDto) {
    return this.aiService.complete(dto);
  }

  // ---------- 上传 ----------

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 200 * 1024 * 1024 },
      fileFilter: (_req, _file, cb) => cb(null, true),
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("未接收到文件");
    const url = `/uploads/${file.filename}`;
    // 落一条附件记录，供附件库管理
    await this.adminService.createAttachment({
      filename: Buffer.from(file.originalname, "latin1").toString("utf8"),
      url,
      mimeType: file.mimetype,
      size: file.size,
    });
    return { url };
  }

  // ---------- 后台菜单 ----------

  @Get("menus")
  listAdminMenus() {
    return this.adminService.listAdminMenus();
  }

  @Get("menus/:id")
  getAdminMenu(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.getAdminMenu(id);
  }

  @Post("menus")
  createAdminMenu(@Body() dto: SaveAdminMenuDto) {
    return this.adminService.createAdminMenu(dto);
  }

  @Put("menus/:id")
  updateAdminMenu(@Param("id", ParseIntPipe) id: number, @Body() dto: SaveAdminMenuDto) {
    return this.adminService.updateAdminMenu(id, dto);
  }

  @Delete("menus/:id")
  deleteAdminMenu(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.deleteAdminMenu(id);
  }
}
