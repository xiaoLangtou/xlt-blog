import { ArticleStatus, CodeTheme, CommentStatus, EditorType } from '@xlt-blog/shared'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
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

export class ImportArticlesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  defaultCategoryId?: number

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  defaultTagIds?: number[]

  @IsOptional()
  @IsEnum(ArticleStatus)
  defaultStatus?: ArticleStatus
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
  rawContent!: string

  @IsOptional()
  @IsEnum(EditorType)
  editorType?: EditorType

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

class ResumeProfileDto {
  @IsString() @IsNotEmpty() @MaxLength(100) name!: string
  @IsString() @IsNotEmpty() @MaxLength(100) headline!: string
  @IsString() @MaxLength(2000) summary!: string
  @IsString() @MaxLength(50) experience!: string
  @IsString() @MaxLength(100) education!: string
  @IsString() @MaxLength(100) availability!: string
  @IsString() @MaxLength(100) location!: string
}

class ResumeDesiredPositionDto {
  @IsString() @MaxLength(100) position!: string
  @IsString() @MaxLength(100) industry!: string
  @IsString() @MaxLength(100) salary!: string
}

class ResumeExperienceDto {
  @IsString() @IsNotEmpty() @MaxLength(100) id!: string
  @IsString() @IsNotEmpty() @MaxLength(200) company!: string
  @IsString() @IsNotEmpty() @MaxLength(100) title!: string
  @IsString() @MaxLength(100) department!: string
  @IsString() @MaxLength(30) start!: string
  @IsString() @MaxLength(30) end!: string
  @IsBoolean() current!: boolean
  @IsArray() @IsString({ each: true }) @MaxLength(100, { each: true }) skills!: string[]
  @IsArray() @IsString({ each: true }) @MaxLength(1000, { each: true }) highlights!: string[]
  @IsArray() @IsString({ each: true }) @MaxLength(1000, { each: true }) responsibilities!: string[]
}

class ResumeProjectDto {
  @IsString() @IsNotEmpty() @MaxLength(100) id!: string
  @IsString() @IsNotEmpty() @MaxLength(200) name!: string
  @IsString() @MaxLength(100) role!: string
  @IsString() @MaxLength(30) start!: string
  @IsString() @MaxLength(30) end!: string
  @IsString() @MaxLength(3000) description!: string
  @IsArray() @IsString({ each: true }) @MaxLength(100, { each: true }) stack!: string[]
  @IsArray() @IsString({ each: true }) @MaxLength(1000, { each: true }) highlights!: string[]
}

class ResumeEducationDto {
  @IsString() @IsNotEmpty() @MaxLength(100) id!: string
  @IsString() @IsNotEmpty() @MaxLength(200) school!: string
  @IsString() @MaxLength(100) degree!: string
  @IsString() @MaxLength(100) major!: string
  @IsString() @MaxLength(30) start!: string
  @IsString() @MaxLength(30) end!: string
  @IsString() @MaxLength(1000) description!: string
}

export class SaveResumeDto {
  @ValidateNested() @Type(() => ResumeProfileDto) profile!: ResumeProfileDto
  @ValidateNested() @Type(() => ResumeDesiredPositionDto) desiredPosition!: ResumeDesiredPositionDto
  @IsArray() @IsString({ each: true }) @MaxLength(100, { each: true }) skills!: string[]
  @IsArray() @ValidateNested({ each: true }) @Type(() => ResumeExperienceDto) experiences!: ResumeExperienceDto[]
  @IsArray() @ValidateNested({ each: true }) @Type(() => ResumeProjectDto) projects!: ResumeProjectDto[]
  @IsArray() @ValidateNested({ each: true }) @Type(() => ResumeEducationDto) education!: ResumeEducationDto[]
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
  @MaxLength(2_000_000)
  rawContent!: string

  @IsOptional()
  @IsEnum(EditorType)
  editorType?: EditorType

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus
}

/** 内容预览：三个编辑器共用的实时预览接口（与保存共用同一渲染管线） */
export class PreviewContentDto {
  @IsEnum(EditorType)
  editorType!: EditorType

  @IsString()
  @MaxLength(2_000_000)
  rawContent!: string

  @IsOptional()
  @IsEnum(CodeTheme)
  codeTheme?: CodeTheme
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


class LocalStorageConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  publicUrlPrefix?: string
}

class S3CompatibleStorageConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  endpoint?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  bucket?: string

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  accessKey?: string

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  secretKey?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  region?: string

  @IsOptional()
  @IsBoolean()
  pathStyle?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  publicUrlBase?: string
}

class S3StorageConfigDto extends S3CompatibleStorageConfigDto {
  @IsOptional()
  @IsIn(['aws', 'huawei-obs', 'aliyun-oss', 'tencent-cos', 'custom'])
  provider?: 'aws' | 'huawei-obs' | 'aliyun-oss' | 'tencent-cos' | 'custom'
}

export class SaveStorageConfigDto {
  @IsOptional()
  @IsIn(['local', 'rusfs', 's3'])
  active?: 'local' | 'rusfs' | 's3'

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalStorageConfigDto)
  local?: LocalStorageConfigDto

  @IsOptional()
  @ValidateNested()
  @Type(() => S3CompatibleStorageConfigDto)
  rusfs?: S3CompatibleStorageConfigDto

  @IsOptional()
  @ValidateNested()
  @Type(() => S3StorageConfigDto)
  s3?: S3StorageConfigDto
}

export class TestStorageConfigDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => SaveStorageConfigDto)
  config?: SaveStorageConfigDto
}

/** Intentionally empty: attachment URLs and storage keys are server-side data. */
export class MigrateStorageDto {}
