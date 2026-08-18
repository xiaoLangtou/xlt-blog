import { Migration } from '@mikro-orm/migrations';

export class Migration20260812UpdateMenuPaths extends Migration {
  override async up(): Promise<void> {
    // 删除旧的前台菜单和后台菜单条目
    this.addSql(`DELETE FROM admin_menus WHERE path IN ('/system/site-menus', '/system/admin-menus');`)

    // 插入新的「菜单管理」条目（合并为一个 tab 页）
    this.addSql(`
      INSERT INTO admin_menus (title, path, icon, parent_id, sort, visible, component, keep_alive, created_at, updated_at)
      SELECT '菜单管理', '/system/menus', 'i-lucide:menu', id, 2, 1, '/views/system/menus.vue', 0, NOW(), NOW()
      FROM admin_menus WHERE path = '/system' AND parent_id IS NULL LIMIT 1;
    `)

    // 更新站点设置排序 3
    this.addSql(`UPDATE admin_menus SET sort = 3 WHERE path = '/system/settings';`)
  }

  override async down(): Promise<void> {
    this.addSql(`DELETE FROM admin_menus WHERE path = '/system/menus';`)
  }
}
