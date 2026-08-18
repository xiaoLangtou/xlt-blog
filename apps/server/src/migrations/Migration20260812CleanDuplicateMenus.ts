import { Migration } from '@mikro-orm/migrations';

export class Migration20260812CleanDuplicateMenus extends Migration {
  override async up(): Promise<void> {
    // 删除重复的「菜单管理」记录，只保留 id 最小的一条
    this.addSql(`
      DELETE FROM admin_menus 
      WHERE path = '/system/menus' 
      AND id NOT IN (
        SELECT * FROM (
          SELECT MIN(id) FROM admin_menus WHERE path = '/system/menus'
        ) AS t
      );
    `)
  }

  override async down(): Promise<void> {
    // 不可逆操作，down 留空
  }
}
