import { Migration } from '@mikro-orm/migrations'

export class Migration20260815000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      "alter table `articles` add `code_theme` enum('github', 'atom') not null default 'github';"
    )
  }

  override async down(): Promise<void> {
    this.addSql('alter table `articles` drop column `code_theme`;')
  }
}
