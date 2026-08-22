import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const files = {
  adminEditor: await readFile(
    resolve(root, 'apps/art-design-pro/src/views/blog/articles/editor.vue'),
    'utf8'
  ),
  adminStyle: await readFile(
    resolve(root, 'apps/art-design-pro/src/assets/styles/custom/article-content.scss'),
    'utf8'
  ),
  webStyle: await readFile(resolve(root, 'apps/web/app/assets/css/main.css'), 'utf8')
}

const requirements = [
  ['admin reader shell', files.adminEditor, 'article-reading-preview'],
  ['admin editor-specific preview class', files.adminEditor, 'editor-${form.editorType}'],
  ['admin article ending seal', files.adminEditor, 'article-reading-preview__seal'],
  ['admin compact divider rhythm', files.adminStyle, 'hr + h2'],
  ['admin dark Shiki override', files.adminStyle, '--shiki-dark-bg'],
  ['web compact divider rhythm', files.webStyle, 'hr + h2'],
  ['web dark Shiki override', files.webStyle, '.dark .article-content .shiki'],
  ['web responsive table overflow', files.webStyle, 'overflow-x: auto']
]

const missing = requirements.filter(([, source, token]) => !source.includes(token))
if (missing.length) {
  console.error(`Missing article-reading contracts: ${missing.map(([name]) => name).join(', ')}`)
  process.exit(1)
}

console.log(`Article-reading contracts verified (${requirements.length} checks).`)
