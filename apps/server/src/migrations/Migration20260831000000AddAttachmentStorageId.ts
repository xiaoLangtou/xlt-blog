import { Migration } from '@mikro-orm/migrations'

/** 将历史附件绑定到稳定的存储实例 ID，而非仅记录驱动类型。 */
export class Migration20260831000000AddAttachmentStorageId extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table `attachments` add `storage_id` varchar(64) null;')
    this.addSql(`
      update \`attachments\`
      set \`storage_id\` = case \`storage\`
        when 'rusfs' then 'legacy-rusfs'
        when 's3' then 'legacy-s3'
        else 'local'
      end
      where \`storage_id\` is null;
    `)
    this.addSql('create index `attachments_storage_id_index` on `attachments` (`storage_id`);')
  }

  override async down(): Promise<void> {
    this.addSql('alter table `attachments` drop index `attachments_storage_id_index`;')
    this.addSql('alter table `attachments` drop column `storage_id`;')
  }
}
