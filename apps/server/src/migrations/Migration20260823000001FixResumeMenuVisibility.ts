import { Migration } from '@mikro-orm/migrations'

/** 修正早期个人简历菜单被错误标记为隐藏的问题。 */
export class Migration20260823000001FixResumeMenuVisibility extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      update \`sys_menu\`
      set \`visible\` = '0', \`update_time\` = now()
      where \`path\` = '/blog-system/resume'
        and \`del_flag\` = 0
        and \`visible\` = '1';
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      update \`sys_menu\`
      set \`visible\` = '1', \`update_time\` = now()
      where \`path\` = '/blog-system/resume'
        and \`del_flag\` = 0
        and \`visible\` = '0';
    `)
  }
}
