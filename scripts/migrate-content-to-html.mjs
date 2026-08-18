/**
 * 一次性迁移：把 articles / pages 表中现有的 Markdown 正文转换为「安全 HTML」。
 *
 * 用法（在仓库根目录）：
 *   node scripts/migrate-content-to-html.mjs          # 预览（dry-run，不写库）
 *   node scripts/migrate-content-to-html.mjs --apply   # 实际写库
 *
 * 逻辑：
 *  - 已经是 HTML（以块级标签开头）的行跳过，保证可重复执行；
 *  - Markdown 行经 markdown-it(html:true) + 增强表格 extract/restore 转为 HTML，
 *    再用 shared 的 normalizeArticleContent 做与服务端一致的净化后写回。
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import mysql from 'mysql2/promise'
import MarkdownIt from 'markdown-it'
import {
  extractTableFragments,
  restoreTableFragments,
  normalizeArticleContent
} from '../packages/shared/dist/index.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const apply = process.argv.includes('--apply')

function loadEnv() {
  const envPath = resolve(here, '../apps/server/.env')
  const env = {}
  try {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
      if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    // 忽略，回退到默认值
  }
  return env
}

const env = loadEnv()
const md = new MarkdownIt({ html: true, linkify: true, breaks: true })
const defaultImageRenderer =
  md.renderer.rules.image ??
  ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options))
md.renderer.rules.image = (tokens, index, options, envArg, self) => {
  const token = tokens[index]
  const titleIndex = token.attrIndex('title')
  const title = titleIndex >= 0 ? token.attrs?.[titleIndex]?.[1] : null
  const match = title ? /^width=(\d+)$/.exec(String(title).trim()) : null
  const width = match ? Number(match[1]) : null
  if (width && width >= 120 && width <= 1600) token.attrSet('width', String(width))
  if (match) token.attrSet('title', '')
  return defaultImageRenderer(tokens, index, options, envArg, self)
}

const looksLikeHtml = (s) =>
  /^\s*<(?:h[1-6]|p|ul|ol|pre|blockquote|table|div|img|hr|figure)\b/i.test(s)

function markdownToHtml(content) {
  const { markdown, fragments } = extractTableFragments(content)
  const rendered = restoreTableFragments(md.render(markdown), fragments)
  return normalizeArticleContent(rendered)
}

async function migrateTable(conn, table) {
  const [rows] = await conn.query(`SELECT id, content FROM \`${table}\``)
  let converted = 0
  let skipped = 0
  for (const row of rows) {
    const content = row.content ?? ''
    if (!content.trim() || looksLikeHtml(content)) {
      skipped += 1
      continue
    }
    let html
    try {
      html = markdownToHtml(content)
    } catch (error) {
      console.error(`  [${table}#${row.id}] 转换失败：`, error.message)
      continue
    }
    converted += 1
    console.log(`  [${table}#${row.id}] ${content.length} → ${html.length} 字符`)
    if (apply) {
      await conn.execute(`UPDATE \`${table}\` SET content = ? WHERE id = ?`, [html, row.id])
    }
  }
  console.log(`表 ${table}: 转换 ${converted} 行，跳过 ${skipped} 行（已是 HTML/空）`)
}

async function main() {
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3307),
    user: env.DB_USER || 'xlt_blog',
    password: env.DB_PASSWORD || 'xlt_blog',
    database: env.DB_NAME || 'xlt_blog'
  })
  console.log(apply ? '=== APPLY 模式：将写库 ===' : '=== DRY-RUN 模式：不写库（--apply 生效）===')
  try {
    await migrateTable(conn, 'articles')
    await migrateTable(conn, 'pages')
  } finally {
    await conn.end()
  }
  console.log('完成。')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
