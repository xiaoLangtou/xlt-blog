# Compact Article Reading Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved compact book-binding technical-article reading style to the admin preview drawer and public post page in both light and dark themes.

**Architecture:** Keep the existing server-rendered HTML and editor lifecycle unchanged. Give the admin preview a semantic reading shell in `editor.vue`, and express its body treatment in the existing global admin `article-content.scss`; adapt the public `.article-content` rules in Nuxt's `main.css` to the same concrete rhythm using Nuxt UI theme variables. A small source-contract check is written first because neither frontend currently has visual-regression infrastructure.

**Tech Stack:** Vue 3 + Element Plus + SCSS (admin); Nuxt 4 + Nuxt UI + Tailwind CSS (public); Shiki-rendered HTML; Node.js source-contract check.

---

## File structure

| File | Responsibility |
| --- | --- |
| `scripts/verify-article-reading-style.mjs` | Dependency-free source-contract verification for the reading-shell markup and required light/dark style rules. |
| `apps/art-design-pro/src/views/blog/articles/editor.vue` | Admin preview shell only: reader header, article metadata/title/summary/cover/footer, and `article-content-preview` class binding. Existing preview request and drawer behavior remain intact. |
| `apps/art-design-pro/src/assets/styles/custom/article-content.scss` | Global admin preview typography, semantic element treatment, responsive overflow, and dark-theme overrides. It owns rendered HTML styling. |
| `apps/web/app/assets/css/main.css` | Public `.article-content` typography and component rules using Nuxt UI variables, including matching dark Shiki behavior. |

No changes are planned for API clients, server rendering, editor components, article data types, routes, SEO, or dependencies.

### Task 1: Add a failing article-style source contract

**Files:**
- Create: `scripts/verify-article-reading-style.mjs`

- [ ] **Step 1: Write the failing source-contract check**

Create the file with this exact content. It establishes the observable style and markup contracts before any application code changes:

```js
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
```

- [ ] **Step 2: Run the check and verify that it fails for the intended missing contracts**

Run:

```bash
node scripts/verify-article-reading-style.mjs
```

Expected: exit code `1` and a message that includes at least `admin reader shell`, `admin compact divider rhythm`, and `web compact divider rhythm`.

- [ ] **Step 3: Do not change the script while implementing Tasks 2–4**

The style and template changes must make the existing contract pass. If an assertion needs adjustment, first compare the assertion to the approved design specification; preserve assertions covering shell structure, compact divider rhythm, dark Shiki behavior, and responsive table overflow.

### Task 2: Build the semantic admin preview reader shell

**Files:**
- Modify: `apps/art-design-pro/src/views/blog/articles/editor.vue:453-514`

- [ ] **Step 1: Replace only the preview drawer's presentational markup**

Keep the existing `ElDrawer`, `v-model`, `previewVisible`, `previewLoading`, `previewHtml`, and return-button click handler. Replace the generic `flex ... bg-*` shell, Tailwind `prose` body, and empty spacer with semantic classes structured as follows:

```vue
<div class="article-reading-preview">
  <header class="article-reading-preview__bar">
    <ElButton text class="article-reading-preview__back" aria-label="返回编辑" @click="previewVisible = false">
      <ArtSvgIcon icon="ri:arrow-left-line" />
      <span>返回编辑</span>
    </ElButton>
    <span class="article-reading-preview__label">文章预览</span>
  </header>

  <main v-loading="previewLoading" class="article-reading-preview__scroll">
    <article class="article-reading-preview__sheet">
      <div class="article-reading-preview__issue">DRAFT · ARTICLE PREVIEW</div>
      <header class="article-reading-preview__header">
        <div class="article-reading-preview__meta">
          <span>{{ form.status === 'published' ? '已发布文章' : '草稿预览' }}</span>
          <span>{{ words }} 字 · {{ readMinutes }} 分钟阅读</span>
        </div>
        <h1>{{ form.title || '未命名文章' }}</h1>
        <p v-if="form.summary" class="article-reading-preview__summary">{{ form.summary }}</p>
      </header>

      <img v-if="form.cover" :src="form.cover" :alt="form.title" class="article-reading-preview__cover" />

      <div
        class="article-content-preview"
        :class="[`editor-${form.editorType}`, `code-theme-${form.codeTheme}`]"
        v-html="previewHtml"
      />

      <footer class="article-reading-preview__ending" aria-label="文章结束">
        <span class="article-reading-preview__seal">完</span>
      </footer>
    </article>
  </main>
</div>
```

- [ ] **Step 2: Remove only the obsolete local prose configuration**

Delete the scoped `.prose { --tw-prose-* }` block from `editor.vue`. Do not remove unrelated editor, cover, settings, responsive, or drawer styles. Leave the existing `.article-preview-drawer :deep(.el-drawer__body)` reset in place.

- [ ] **Step 3: Add shell-only scoped styles**

Add styles under the preview drawer reset. These styles deliberately use admin variables and do not style headings, paragraphs, code, tables, or lists:

```scss
.article-reading-preview { height: 100%; color: var(--article-ink); background: var(--default-bg-color); }
.article-reading-preview__bar { display: flex; height: 52px; align-items: center; justify-content: space-between; padding: 0 24px; border-bottom: 1px solid var(--article-border); background: color-mix(in srgb, var(--default-bg-color) 88%, transparent); backdrop-filter: blur(14px); }
.article-reading-preview__back { color: var(--article-secondary); }
.article-reading-preview__label, .article-reading-preview__issue, .article-reading-preview__meta { color: var(--article-muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; letter-spacing: .08em; }
.article-reading-preview__scroll { height: calc(100% - 52px); overflow-y: auto; }
.article-reading-preview__sheet { width: min(100% - 40px, 980px); min-height: 100%; margin: 28px auto 64px; padding: clamp(28px, 5vw, 64px) clamp(22px, 8vw, 112px) 56px; border: 1px solid var(--article-border); background: var(--default-bg-color); box-shadow: 0 20px 70px rgb(23 39 72 / 11%); }
.article-reading-preview__issue { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.article-reading-preview__issue::after { height: 1px; flex: 1; content: ''; background: var(--article-border); }
.article-reading-preview__header { padding-bottom: 31px; border-bottom: 1px solid var(--article-border); }
.article-reading-preview__meta { display: flex; flex-wrap: wrap; gap: 9px 16px; margin-bottom: 13px; }
.article-reading-preview__sheet h1 { margin: 0; color: var(--article-ink); font-family: Georgia, 'Songti SC', 'Noto Serif CJK SC', SimSun, serif; font-size: clamp(32px, 5vw, 50px); line-height: 1.22; letter-spacing: .04em; }
.article-reading-preview__summary { max-width: 690px; margin: 16px 0 0; padding-left: 15px; border-left: 2px solid var(--theme-color); color: var(--article-secondary); font-family: Georgia, 'Songti SC', 'Noto Serif CJK SC', SimSun, serif; font-size: 17px; line-height: 1.78; }
.article-reading-preview__cover { display: block; width: 100%; max-height: 480px; margin: 24px 0 0; object-fit: cover; border: 1px solid var(--article-border); border-radius: 5px; }
.article-reading-preview__ending { display: flex; justify-content: center; margin-top: 48px; }
.article-reading-preview__seal { display: grid; width: 36px; height: 50px; place-items: center; border-radius: 3px; background: var(--theme-color); color: #fff; font-family: Georgia, 'Songti SC', 'Noto Serif CJK SC', SimSun, serif; font-size: 15px; letter-spacing: .2em; writing-mode: vertical-rl; }
```

Add a narrow-screen rule in the existing `@media (max-width: 640px)` block:

```scss
.article-reading-preview__bar { padding: 0 16px; }
.article-reading-preview__sheet { width: calc(100% - 20px); margin-top: 20px; padding-bottom: 42px; }
```

### Task 3: Apply the compact rendered-content system to the admin preview

**Files:**
- Modify: `apps/art-design-pro/src/assets/styles/custom/article-content.scss`

- [ ] **Step 1: Scope the approved article typography to preview content without altering editor-mode selectors**

Keep the file's existing `.article-content-preview` compatibility rules for Notion colors, task lists, alignment, images, and `details`. Replace its initial typography values and add the following declarations inside `.article-content-preview` so output HTML has the approved reading rhythm:

```scss
font-size: 16px;
line-height: 1.78;
margin-top: 37px;

h2 { position: relative; margin: 48px 0 17px; padding: 0 0 9px 18px; border-bottom: 1px solid var(--default-border); color: var(--color-prose-headings); font-family: Georgia, 'Songti SC', 'Noto Serif CJK SC', SimSun, serif; font-size: clamp(25px, 3.6vw, 31px); line-height: 1.4; letter-spacing: .05em; }
h2::before { position: absolute; top: .3em; left: 0; width: 4px; height: 1.1em; content: ''; background: var(--theme-color); }
h2:first-child { margin-top: 0; }
h3 { margin: 28px 0 9px; color: var(--theme-color); font-family: Georgia, 'Songti SC', 'Noto Serif CJK SC', SimSun, serif; font-size: 21px; line-height: 1.45; letter-spacing: .04em; }
h4 { margin: 21px 0 6px; font-size: 17px; line-height: 1.65; }
p { margin: 9px 0; }
ul, ol { margin: 10px 0; }
li { margin: 3px 0; }
li::marker { color: var(--theme-color); font-weight: 700; }
pre { margin: 16px 0; padding: 17px 21px; border: 1px solid var(--default-border); border-radius: 5px; box-shadow: inset 3px 0 var(--theme-color); font-size: 13px; line-height: 1.65; }
table { margin: 18px 0; }
th, td { padding: 9px 13px; }
hr { position: relative; height: 14px; margin: 22px 0 0; border: 0; text-align: center; }
hr::before { position: absolute; top: 7px; right: 0; left: 0; height: 1px; content: ''; background: var(--default-border); }
hr::after { position: relative; z-index: 1; padding: 0 13px; content: '※'; color: var(--theme-color); background: var(--default-bg-color); font-size: 16px; }
hr + h2 { margin-top: 18px; }
```

- [ ] **Step 2: Make Shiki and code blocks respect the active admin theme**

Keep the existing `.dark .article-content-preview` section and add the following, using `!important` only because Shiki emits inline span styles:

```scss
.dark .article-content-preview .shiki,
.dark .article-content-preview .shiki span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
}
```

For inline code, replace direct `--art-gray-*` background usage with `var(--default-box-color)` and use `var(--article-ink)` for text so the existing theme variables govern both modes.

- [ ] **Step 3: Preserve overflow and mobile behavior**

Ensure these final rules exist in the same content scope:

```scss
table { display: block; width: 100%; overflow-x: auto; }
pre { overflow-x: auto; }

@media (max-width: 640px) {
  .article-content-preview { font-size: 15.5px; }
  .article-content-preview h2 { margin-top: 39px; font-size: 25px; }
  .article-content-preview h3 { margin-top: 25px; font-size: 20px; }
  .article-content-preview pre { padding: 15px 16px; font-size: 12px; }
}
```

### Task 4: Apply matching compact rules to the public article body

**Files:**
- Modify: `apps/web/app/assets/css/main.css:115-641`

- [ ] **Step 1: Retain existing public page chrome and scope changes to `.article-content`**

Do not alter the page's `UContainer`, article header, SEO, reading-progress bar, cover, ending seal, or comments. Replace only duplicated and oversized `.article-content` declarations so the following compact rules are the effective ones:

```css
.article-content {
  line-height: 1.78;
  font-size: 1rem;
}
.article-content h2 { position: relative; margin: 3rem 0 1.0625rem; padding: 0 0 .5625rem 1.125rem; border-bottom: 1px solid var(--ui-border); color: var(--ui-text-highlighted); font-family: var(--font-display); font-size: clamp(1.5625rem, 3.6vw, 1.9375rem); line-height: 1.4; letter-spacing: .05em; }
.article-content h2::before { position: absolute; top: .3em; left: 0; width: 4px; height: 1.1em; content: ''; background: var(--color-cinnabar); }
.article-content h2:first-child { margin-top: 0; }
.article-content h3 { margin: 1.75rem 0 .5625rem; color: var(--ui-primary); font-family: var(--font-display); font-size: 1.3125rem; line-height: 1.45; }
.article-content h4 { margin: 1.3125rem 0 .375rem; font-size: 1.0625rem; line-height: 1.65; }
.article-content p { margin: .5625rem 0; }
.article-content ul, .article-content ol { margin: .625rem 0; }
.article-content li { margin: .1875rem 0; }
.article-content li::marker { color: var(--color-cinnabar); font-weight: 700; }
```

- [ ] **Step 2: Update public code, table, and divider styling**

Use these rules after the retained font declarations. The public app supplies all referenced variables in both theme modes:

```css
.article-content .shiki,
.article-content pre { margin: 1rem 0; padding: 1.0625rem 1.3125rem; overflow-x: auto; border: 1px solid var(--ui-border); border-radius: .3125rem; background: var(--ui-bg-elevated); box-shadow: inset 3px 0 var(--ui-primary); font-size: .8125rem; line-height: 1.65; }
.article-content table { display: block; width: 100%; margin: 1.125rem 0; overflow-x: auto; border-collapse: collapse; }
.article-content th, .article-content td { min-width: 7rem; padding: .5625rem .8125rem; border: 1px solid var(--ui-border); }
.article-content th { color: var(--ui-text-highlighted); background: var(--ui-bg-elevated); }
.article-content hr { position: relative; height: .875rem; margin: 1.375rem 0 0; border: 0; text-align: center; }
.article-content hr::before { position: absolute; top: .4375rem; right: 0; left: 0; height: 1px; content: ''; background: var(--ui-border); }
.article-content hr::after { position: relative; z-index: 1; padding: 0 .8125rem; content: '※'; color: var(--color-cinnabar); background: var(--ui-bg); font-size: 1rem; }
.article-content hr + h2 { margin-top: 1.125rem; }
.dark .article-content .shiki,
.dark .article-content .shiki span { color: var(--shiki-dark) !important; background-color: var(--shiki-dark-bg) !important; }
```

- [ ] **Step 3: Keep the front-end responsive**

Add or retain the following narrow-screen overrides near the existing reduced-motion rule:

```css
@media (max-width: 640px) {
  .article-content { font-size: .96875rem; }
  .article-content h2 { margin-top: 2.4375rem; font-size: 1.5625rem; }
  .article-content h3 { margin-top: 1.5625rem; font-size: 1.25rem; }
  .article-content .shiki,
  .article-content pre { padding: .9375rem 1rem; font-size: .75rem; }
}
```

### Task 5: Make the contract green and run application validation

**Files:**
- Modify only if a missing required selector in Tasks 2–4 prevents the contract from passing; do not weaken or remove contract assertions.

- [ ] **Step 1: Run the source-contract check**

Run:

```bash
node scripts/verify-article-reading-style.mjs
```

Expected: exit code `0` and `Article-reading contracts verified (8 checks).`

- [ ] **Step 2: Run the targeted admin checks**

Run:

```bash
pnpm --filter art-design-pro lint
pnpm --filter art-design-pro build
```

Expected: both commands exit `0`. The build runs `vue-tsc --noEmit` before Vite, exercising the changed Vue template and SCSS import graph.

- [ ] **Step 3: Run the public production build**

Run:

```bash
pnpm --filter @xlt-blog/web build
```

Expected: exit code `0`, with Nuxt generating the production build successfully.

- [ ] **Step 4: Perform manual visual checks with the supplied Java tutorial HTML**

Check both apps in light and dark themes at desktop and a narrow viewport. Confirm: metadata/title/summary/cover remain readable; `h2` and `h3` hierarchy remains visible; `hr` to following `h2` has no conspicuous blank band; code and tables scroll horizontally as isolated regions; Shiki colors switch via `--shiki-dark` and `--shiki-dark-bg`; links, inline code, task lists, details, alignment, and Notion colors retain their existing behavior.

- [ ] **Step 5: Review only task-owned changes before reporting**

Run:

```bash
git diff -- apps/art-design-pro/src/views/blog/articles/editor.vue apps/art-design-pro/src/assets/styles/custom/article-content.scss apps/web/app/assets/css/main.css scripts/verify-article-reading-style.mjs docs/superpowers/
```

Expected: the diff contains only the reader shell, compact rendered-content styling, static verification, prototype/spec/plan documentation, and no unrelated worktree changes. Do not create a commit unless the user asks.
