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
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ArticleStatus, CommentStatus } from "@xlt-blog/shared";
import { XltCheckLogin } from "@xlt-token/nestjs";
import { randomUUID } from "node:crypto";
import { mkdir, open, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Writable } from "node:stream";
import { memoryStorage, type StorageEngine } from "multer";
import {
  AdminArticleQueryDto,
  AdminAttachmentQueryDto,
  AdminColumnQueryDto,
  AdminCommentQueryDto,
  AdminTagQueryDto,
  ImportArticlesDto,
  MigrateStorageDto,
  PreviewContentDto,
  ReplyCommentDto,
  SaveAdminMenuDto,
  SaveArticleDto,
  SaveCategoryDto,
  SaveColumnDto,
  SaveFriendLinkDto,
  SavePageDto,
  SaveResumeDto,
  SaveSettingsDto,
  SaveStorageConfigDto,
  SaveTagDto,
  SetColumnArticlesDto,
  TestStorageConfigDto,
} from "./admin.dto";
import { CompleteAiDto } from "./ai.dto";
import { AdminService, MAX_IMPORT_FILE_SIZE, type ImportArticleFile } from "./admin.service";
import { AiService } from "./ai.service";

const IMPORT_TEMP_DIRECTORY = join(tmpdir(), "xlt-blog-markdown-import");

async function removeTemporaryImportFile(path: string) {
  try {
    await unlink(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

const importArticleStorage: StorageEngine = {
  _handleFile(_req, file, callback) {
    void (async () => {
      const path = join(IMPORT_TEMP_DIRECTORY, randomUUID());
      let fileHandle: Awaited<ReturnType<typeof open>> | undefined;
      let output: Writable | undefined;
      let size = 0;
      let tooLarge = false;
      let completed = false;

      const complete = async (initialError?: Error) => {
        if (completed) return;
        completed = true;

        if (initialError) {
          file.stream.unpipe(output);
          output?.destroy();
          file.stream.resume();
        }

        let error = initialError;
        try {
          await fileHandle?.close();
        } catch (closeError) {
          error ??= closeError instanceof Error ? closeError : new Error("Failed to close import file");
        }

        if (error || tooLarge) {
          try {
            await removeTemporaryImportFile(path);
          } catch (cleanupError) {
            error ??= cleanupError instanceof Error ? cleanupError : new Error("Failed to clean up import file");
          }
        }

        if (error) {
          callback(error);
          return;
        }

        callback(null, { path, size, tooLarge } as Partial<Express.Multer.File>);
      };

      try {
        await mkdir(IMPORT_TEMP_DIRECTORY, { recursive: true, mode: 0o700 });
        fileHandle = await open(path, "wx", 0o600);
        output = new Writable({
          write(chunk, _encoding, done) {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            size += buffer.length;
            if (tooLarge || size >= MAX_IMPORT_FILE_SIZE) {
              tooLarge = true;
              done();
              return;
            }
            void fileHandle!.writeFile(buffer).then(() => done(), done);
          },
        });
        output.once("error", (error) => void complete(error));
        output.once("finish", () => void complete());
        file.stream.once("error", (error) => output?.destroy(error));
        file.stream.pipe(output);
      } catch (error) {
        file.stream.resume();
        await complete(error instanceof Error ? error : new Error("Failed to store import file"));
      }
    })();
  },
  _removeFile(_req, file, callback) {
    if (!file.path) {
      callback(null);
      return;
    }
    void removeTemporaryImportFile(file.path).then(
      () => callback(null),
      (error) => callback(error instanceof Error ? error : new Error("Failed to clean up import file")),
    );
  },
};

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

  @Post("articles/import")
  @UseInterceptors(
    FilesInterceptor("files", 50, {
      storage: importArticleStorage,
      fileFilter: (_req, _file, callback) => callback(null, true),
    }),
  )
  importArticles(
    @UploadedFiles() files: ImportArticleFile[] | undefined,
    @Body() defaults: ImportArticlesDto,
  ) {
    return this.adminService.importArticles(files ?? [], defaults);
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

  // ---------- 个人简历 ----------

  @Get("resume")
  getResume() {
    return this.adminService.getResume();
  }

  @Put("resume")
  saveResume(@Body() dto: SaveResumeDto) {
    return this.adminService.saveResume(dto);
  }

  // ---------- 存储 ----------

  @Get("storage/config")
  getStorageConfig() {
    return this.adminService.getStorageConfig();
  }

  @Put("storage/config")
  saveStorageConfig(@Body() dto: SaveStorageConfigDto) {
    return this.adminService.saveStorageConfig(dto);
  }

  @Post("storage/test")
  testStorage(@Body() dto: TestStorageConfigDto) {
    return this.adminService.testStorageConfig(dto);
  }

  @Post("storage/migrate")
  migrateStorage(@Body() _dto: MigrateStorageDto) {
    return this.adminService.migrateStorageAttachments();
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
      storage: memoryStorage(),
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("未接收到文件");
    return this.adminService.uploadAttachment({
      filename: Buffer.from(file.originalname, "latin1").toString("utf8"),
      buffer: file.buffer,
      mimeType: file.mimetype,
      size: file.size,
    });
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
