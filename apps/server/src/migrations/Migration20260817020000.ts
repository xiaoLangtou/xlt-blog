import { Migration } from '@mikro-orm/migrations'

export class Migration20260817020000 extends Migration {
  override async up(): Promise<void> {
    // 评论新增「已拒绝」状态
    this.addSql(`
      alter table \`comments\`
        modify column \`status\` enum('pending', 'approved', 'rejected') not null default 'pending';
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      alter table \`comments\`
        modify column \`status\` enum('pending', 'approved') not null default 'pending';
    `)
  }
}
