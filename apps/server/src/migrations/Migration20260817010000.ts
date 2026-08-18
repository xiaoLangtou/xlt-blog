import { Migration } from "@mikro-orm/migrations";

export class Migration20260817010000 extends Migration {
  override async up(): Promise<void> {
    // 开启博客列表页缓存，避免切换页面时整页重新加载、丢失状态。
    this.addSql(`
      update \`sys_menu\` set \`keep_alive\` = '1'
      where \`del_flag\` = 0 and \`path\` in (
        '/blog/articles',
        '/blog/categories',
        '/blog/tags',
        '/blog/columns',
        '/blog/comments',
        '/blog/attachments'
      );
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      update \`sys_menu\` set \`keep_alive\` = '0'
      where \`del_flag\` = 0 and \`path\` in (
        '/blog/articles',
        '/blog/categories',
        '/blog/tags',
        '/blog/columns',
        '/blog/comments',
        '/blog/attachments'
      );
    `);
  }
}
