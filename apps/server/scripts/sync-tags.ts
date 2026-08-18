import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { MikroORM } from '@mikro-orm/mysql'
import mikroOrmConfig from '../src/mikro-orm.config'
import { Tag } from '../src/entities'

const RESPONSE_PATH = join(process.cwd(), '..', 'art-design-pro', 'docs', 'response.json')
const UPLOAD_DIR = join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads')

interface RawTag {
  tag_id: string
  tag: {
    tag_name: string
    color: string
    icon: string
  }
}

/** 将标签名转为 URL slug；纯中文等无 ASCII 的名称回退为 tag_id */
function slugify(name: string, tagId: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || `tag-${tagId}`
}

/** 从 URL / content-type 推断扩展名，去掉字节跳动 CDN 的 `~` 后缀 */
function pickExtension(url: string, contentType: string | null): string {
  const pathname = url.split('?')[0]
  const ext = extname(pathname).toLowerCase().split('~')[0]
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return ext
  const map: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg'
  }
  return map[contentType ?? ''] ?? '.png'
}

async function downloadIcon(url: string): Promise<string | null> {
  if (!url || !url.startsWith('http')) return null
  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const filename = `${randomUUID()}${pickExtension(url, res.headers.get('content-type'))}`
    writeFileSync(join(UPLOAD_DIR, filename), buffer)
    return `/uploads/${filename}`
  } catch {
    return null
  }
}

async function main() {
  const orm = await MikroORM.init({ ...mikroOrmConfig, debug: false })
  const em = orm.em.fork()

  const raw = JSON.parse(readFileSync(RESPONSE_PATH, 'utf-8'))
  const data: RawTag[] = raw.data ?? []
  mkdirSync(UPLOAD_DIR, { recursive: true })

  const usedSlugs = new Set<string>()
  let created = 0
  let updated = 0
  let iconSkipped = 0

  for (const [index, item] of data.entries()) {
    const { tag_name: name, color, icon } = item.tag ?? {}
    if (!name) continue

    let slug = slugify(name, item.tag_id)
    // 解决 slug 冲突：同名/重名时追加序号
    let n = 2
    while (usedSlugs.has(slug)) slug = `${slugify(name, item.tag_id)}-${n++}`
    usedSlugs.add(slug)

    const localIcon = await downloadIcon(icon)
    if (!localIcon) iconSkipped++

    const existing = await em.findOne(Tag, { slug })
    if (existing) {
      existing.name = name
      existing.color = color || null
      if (localIcon) existing.icon = localIcon
      updated++
    } else {
      em.create(Tag, { name, slug, color: color || null, icon: localIcon })
      created++
    }

    if ((index + 1) % 25 === 0) {
      await em.flush()
      console.log(`已处理 ${index + 1}/${data.length}（新建 ${created}，更新 ${updated}）`)
    }
  }

  await em.flush()
  await orm.close()
  console.log(`完成：新建 ${created}，更新 ${updated}，图标下载失败 ${iconSkipped}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
