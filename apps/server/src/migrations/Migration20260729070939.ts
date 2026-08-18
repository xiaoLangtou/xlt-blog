import { Migration } from '@mikro-orm/migrations';

export class Migration20260729070939 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`attachments\` (\`id\` int unsigned not null auto_increment primary key, \`filename\` varchar(255) not null, \`url\` varchar(255) not null, \`mime_type\` varchar(255) not null, \`size\` int not null default 0, \`created_at\` datetime not null) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`friend_links\` (\`id\` int unsigned not null auto_increment primary key, \`name\` varchar(255) not null, \`url\` varchar(255) not null, \`logo\` varchar(255) null, \`description\` varchar(255) null, \`sort\` int not null default 0) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`pages\` (\`id\` int unsigned not null auto_increment primary key, \`title\` varchar(255) not null, \`slug\` varchar(255) not null, \`content\` longtext not null, \`status\` enum('draft', 'published') not null default 'draft', \`created_at\` datetime not null, \`updated_at\` datetime not null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`pages\` add unique \`pages_slug_unique\`(\`slug\`);`);
    this.addSql(`alter table \`pages\` add index \`pages_status_index\`(\`status\`);`);

    this.addSql(`create table \`settings\` (\`key\` varchar(100) not null, \`value\` json not null, primary key (\`key\`)) default character set utf8mb4 engine = InnoDB;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists \`attachments\`;`);

    this.addSql(`drop table if exists \`friend_links\`;`);

    this.addSql(`drop table if exists \`pages\`;`);

    this.addSql(`drop table if exists \`settings\`;`);
  }

}
