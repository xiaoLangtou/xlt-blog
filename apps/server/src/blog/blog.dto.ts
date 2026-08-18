import { Type } from 'class-transformer'
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class ArticleQueryDto {
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

  /** 分类 slug */
  @IsOptional()
  @IsString()
  category?: string

  /** 标签 slug */
  @IsOptional()
  @IsString()
  tag?: string

  @IsOptional()
  @IsString()
  keyword?: string
}

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nickname!: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number
}
