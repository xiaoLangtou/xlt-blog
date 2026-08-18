import { Migration } from '@mikro-orm/migrations';

export class Migration20260812113921 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`admin_menus\` (\`id\` int unsigned not null auto_increment primary key, \`title\` varchar(100) not null, \`path\` varchar(200) null, \`icon\` varchar(100) null, \`parent_id\` int null, \`sort\` int not null default 0, \`visible\` tinyint(1) not null default true, \`component\` varchar(100) null, \`keep_alive\` tinyint(1) not null default false, \`created_at\` datetime not null, \`updated_at\` datetime not null) default character set utf8mb4 engine = InnoDB;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists \`admin_menus\`;`);
  }

}
