import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export const AI_ACTIONS = [
  'rephrase',
  'expand',
  'shorten',
  'continue',
  'summarize',
  'grammar',
  'translate',
  'prompt'
] as const

export type AiAction = (typeof AI_ACTIONS)[number]

export class CompleteAiDto {
  @IsIn(AI_ACTIONS)
  action!: AiAction

  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  text!: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instruction?: string
}
