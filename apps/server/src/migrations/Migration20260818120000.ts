import { Migration } from '@mikro-orm/migrations'

/**
 * 多编辑器内容模型改造（方案第二、九节）：
 * content/contentFormat → editor_type + raw_content + render_html + renderer_version。
 * 存量为测试数据，不做内容回填：旧列直接删除，raw_content/render_html 置空串，
 * 存量文章重新编辑保存后即生成新模型数据。
 */
export class Migration20260818120000 extends Migration {
  override async up(): Promise<void> {
    // articles
    this.addSql(
      "alter table `articles` add `editor_type` enum('md','tiptap','domternal') not null default 'tiptap';"
    )
    this.addSql('alter table `articles` add `raw_content` longtext null;')
    this.addSql('alter table `articles` add `render_html` longtext null;')
    this.addSql('alter table `articles` add `renderer_version` int not null default 1;')
    this.addSql("update `articles` set `raw_content` = '', `render_html` = '';")
    this.addSql('alter table `articles` modify `raw_content` longtext not null;')
    this.addSql('alter table `articles` modify `render_html` longtext not null;')
    this.addSql('alter table `articles` drop column `content`;')
    this.addSql('alter table `articles` drop column `content_format`;')

    // pages
    this.addSql(
      "alter table `pages` add `editor_type` enum('md','tiptap','domternal') not null default 'md';"
    )
    this.addSql('alter table `pages` add `raw_content` longtext null;')
    this.addSql('alter table `pages` add `render_html` longtext null;')
    this.addSql('alter table `pages` add `renderer_version` int not null default 1;')
    this.addSql("update `pages` set `raw_content` = '', `render_html` = '';")
    this.addSql('alter table `pages` modify `raw_content` longtext not null;')
    this.addSql('alter table `pages` modify `render_html` longtext not null;')
    this.addSql('alter table `pages` drop column `content`;')
    this.addSql('alter table `pages` drop column `content_format`;')
  }

  override async down(): Promise<void> {
    this.addSql(
      "alter table `articles` add `content` longtext not null, add `content_format` enum('markdown','html') not null default 'html';"
    )
    this.addSql(
      'alter table `articles` drop column `editor_type`, drop column `raw_content`, drop column `render_html`, drop column `renderer_version`;'
    )
    this.addSql(
      "alter table `pages` add `content` longtext not null, add `content_format` enum('markdown','html') not null default 'html';"
    )
    this.addSql(
      'alter table `pages` drop column `editor_type`, drop column `raw_content`, drop column `render_html`, drop column `renderer_version`;'
    )
  }
}
