import { Migration } from '@mikro-orm/migrations'

export class Migration20260822000001AddStorageMenu extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      insert into \`sys_menu\` (del_flag, create_time, update_time, name, en_name, permission, path, parent_menu_id, icon, visible, sort_order, keep_alive, menu_type, is_iframe, component)
      select 0, now(), now(), '媒体存储', 'storage', 'blog:storage:update', '/blog-system/storage', id, 'ri:hard-drive-3-line', '1', 5, '0', '1', '0', '/blog/attachments/storage'
      from \`sys_menu\` where \`path\` = '/blog-system' and \`del_flag\` = 0
      and not exists (select 1 from \`sys_menu\` where \`path\` = '/blog-system/storage' and \`del_flag\` = 0);
    `)
  }

  override async down(): Promise<void> {
    this.addSql("delete from `sys_menu` where `path` = '/blog-system/storage';")
  }
}
