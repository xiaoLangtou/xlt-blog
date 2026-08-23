import { Migration } from '@mikro-orm/migrations'

export class Migration20260822000000AddAttachmentStorage extends Migration {
  override async up(): Promise<void> {
    this.addSql("alter table `attachments` add `storage` varchar(16) not null default 'local';")
    this.addSql('alter table `attachments` add `storage_key` varchar(512) null;')
    this.addSql(
      "update `attachments` set `storage` = 'local', `storage_key` = substring_index(`url`, '/', -1) where `storage_key` is null;"
    )
  }

  override async down(): Promise<void> {
    this.addSql('alter table `attachments` drop column `storage`, drop column `storage_key`;')
  }
}
