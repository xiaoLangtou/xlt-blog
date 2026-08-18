import { Migration } from "@mikro-orm/migrations";

export class Migration20260817000000 extends Migration {
  override async up(): Promise<void> {
    // 将「菜单管理」从博客系统移回权限管理：删除博客系统下的重复条目，
    // 权限管理下已存在原始的菜单管理（path /admin/menu/index）。
    this.addSql(`
      delete from \`sys_menu\`
      where \`path\` = '/blog-system/menus' and \`del_flag\` = 0;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      insert into \`sys_menu\` (del_flag, create_time, update_time, name, en_name, permission, path, parent_menu_id, icon, visible, sort_order, keep_alive, menu_type, is_iframe, component)
      select 0, now(), now(), '菜单管理', 'menus', 'blog:menu:list', '/blog-system/menus', id, 'ri:menu-line', '0', 3, '0', '1', '0', '/system/menu'
      from \`sys_menu\` where \`path\` = '/blog-system' and \`del_flag\` = 0
      and not exists (select 1 from \`sys_menu\` where \`path\` = '/blog-system/menus' and \`del_flag\` = 0);
    `);
  }
}
