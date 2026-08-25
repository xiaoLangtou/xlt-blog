import { Migration } from '@mikro-orm/migrations'

/** 为已有站点补充“博客系统 → 个人简历”维护入口。 */
export class Migration20260823000000AddResumeMenu extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      insert into \`sys_menu\` (del_flag, create_time, update_time, name, en_name, permission, path, parent_menu_id, icon, visible, sort_order, keep_alive, menu_type, is_iframe, component)
      select 0, now(), now(), '个人简历', 'resume', 'blog:resume:update', '/blog-system/resume', id, 'ri:profile-line', '0', 5, '0', '1', '0', '/blog/resume/index'
      from \`sys_menu\` where \`path\` = '/blog-system' and \`del_flag\` = 0
      and not exists (select 1 from \`sys_menu\` where \`path\` = '/blog-system/resume' and \`del_flag\` = 0);
    `)
  }

  override async down(): Promise<void> {
    this.addSql("delete from `sys_menu` where `path` = '/blog-system/resume';")
  }
}
