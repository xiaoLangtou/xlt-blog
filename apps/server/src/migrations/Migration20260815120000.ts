import { Migration } from '@mikro-orm/migrations'

export class Migration20260815120000 extends Migration {
  override async up(): Promise<void> {
    // 正文格式列：markdown（Markdown 编辑器）/ html（富文本编辑器）。
    // 现有文章此前已迁移为 HTML，故默认 html。
    this.addSql(
      "alter table `articles` add `content_format` enum('markdown', 'html') not null default 'html';"
    )
    this.addSql(
      "alter table `pages` add `content_format` enum('markdown', 'html') not null default 'html';"
    )
  }

  override async down(): Promise<void> {
    this.addSql('alter table `articles` drop column `content_format`;')
    this.addSql('alter table `pages` drop column `content_format`;')
  }
}
