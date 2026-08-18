import { ArticleStatus, CodeTheme, CommentStatus, ContentFormat } from '@xlt-blog/shared'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator'

export class AdminArticleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus

  @IsOptional()
  @IsString()
  keyword?: string
}

export class AdminTagQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20

  @IsOptional()
  @IsString()
  keyword?: string
}

export class SaveArticleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  slug!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string

  @IsString()
  @MaxLength(2_000_000)
  content!: string

  @IsOptional()
  @IsEnum(ContentFormat)
  contentFormat?: ContentFormat

  @IsOptional()
  @IsEnum(CodeTheme)
  codeTheme?: CodeTheme

  @IsOptional()
  @IsString()
  cover?: string

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  tagIds?: number[]
}

export class SaveCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  slug!: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number
}

export class SaveTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  slug!: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon?: string | null
}

export class AdminColumnQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus
}

export class SaveColumnDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cover?: string | null

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort?: number
}

export class SetColumnArticlesDto {
  @IsArray()
  @IsInt({ each: true })
  articleIds!: number[]
}

export class AdminCommentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20

  @IsOptional()
  @IsEnum(CommentStatus)
  status?: CommentStatus

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  articleId?: number

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc'
}

export class ReplyCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content!: string
}

export class MenuItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  label!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  url!: string

  @Type(() => Number)
  @IsInt()
  sort!: number
}

export class SaveSettingsDto {
  @IsOptional()
  @IsString()
  themeColor?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemDto)
  menus?: MenuItemDto[]
}

export class AdminAttachmentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 24

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsString()
  sort?: string
}

export class SavePageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  slug!: string

  @IsString()
  content!: string

  @IsOptional()
  @IsEnum(ContentFormat)
  contentFormat?: ContentFormat

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus
}

export class SaveFriendLinkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  url!: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  logo?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number
}

// ---------- 后台菜单 ----------

export class SaveAdminMenuDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  enName?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  permission?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  path?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number

  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @IsString()
  visible?: string

  @IsOptional()
  @IsString()
  keepAlive?: string

  @IsOptional()
  @IsString()
  menuType?: string

  @IsOptional()
  @IsString()
  isIframe?: string

  @IsOptional()
  @IsString()
  iframeUrl?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  component?: string

  @IsOptional()
  @IsString()
  remark?: string
}
