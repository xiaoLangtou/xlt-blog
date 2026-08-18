import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string

  @IsString()
  @IsNotEmpty()
  password!: string
}

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsOptional()
  nickname?: string

  @IsString()
  @IsOptional()
  avatar?: string
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword!: string

  @IsString()
  @MinLength(6)
  @MaxLength(64)
  newPassword!: string
}
