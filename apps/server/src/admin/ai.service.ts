import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { type AiAction, CompleteAiDto } from './ai.dto'

const SYSTEM_PROMPTS: Record<AiAction, string> = {
  rephrase: '你是中文技术博客编辑。润色以下 Markdown，保持原意、事实和格式，只输出改写后的正文。',
  expand: '你是中文技术博客编辑。扩写以下 Markdown，补充必要细节与过渡，不编造事实，只输出扩写后的正文。',
  shorten: '你是中文技术博客编辑。压缩以下 Markdown，保留关键信息，只输出缩短后的正文。',
  continue: '你是中文技术博客作者。承接以下 Markdown 自然续写 1 到 3 段，只输出续写部分。',
  summarize: '你是中文技术博客编辑。为以下 Markdown 写不超过 120 字的摘要，只输出摘要。',
  grammar: '你是中文技术博客校对。修正错别字、标点和明显语病，不改写风格，只输出校对后的正文。',
  translate: '将以下 Markdown 译为英文；若原文主要是英文则译为中文。保持格式，只输出译文。',
  prompt: '按用户指令处理以下 Markdown。只输出结果正文，不要解释。'
}

@Injectable()
export class AiService {
  async complete(dto: CompleteAiDto) {
    if (dto.action === 'prompt' && !dto.instruction?.trim()) {
      throw new BadRequestException('自定义指令不能为空')
    }

    const apiKey = process.env.AI_API_KEY
    if (!apiKey) throw new ServiceUnavailableException('未配置 AI_API_KEY')

    const baseUrl = (process.env.AI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '')
    const model = process.env.AI_MODEL ?? 'gpt-4o-mini'
    const user = dto.instruction?.trim() ? `${dto.instruction.trim()}\n\n---\n\n${dto.text}` : dto.text

    let response: Response
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          temperature: 0.6,
          messages: [
            { role: 'system', content: SYSTEM_PROMPTS[dto.action] },
            { role: 'user', content: user }
          ]
        })
      })
    } catch {
      throw new BadGatewayException('无法连接 AI 服务')
    }

    if (!response.ok) {
      throw new BadGatewayException(`AI 服务请求失败 (${response.status})`)
    }

    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const text = payload.choices?.[0]?.message?.content?.trim()
    if (!text) throw new BadGatewayException('AI 未返回内容')
    return { text }
  }
}
