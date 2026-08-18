import { Migration } from '@mikro-orm/migrations'

export class Migration20260816160000 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table `tags` add `color` varchar(32) null;')
    this.addSql('alter table `tags` add `icon` varchar(500) null;')
  }

  override async down(): Promise<void> {
    this.addSql('alter table `tags` drop column `color`;')
    this.addSql('alter table `tags` drop column `icon`;')
  }
}
