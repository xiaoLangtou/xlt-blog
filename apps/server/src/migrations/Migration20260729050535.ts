import { Migration } from '@mikro-orm/migrations';

export class Migration20260729050535 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`categories\` (\`id\` int unsigned not null auto_increment primary key, \`name\` varchar(255) not null, \`slug\` varchar(255) not null, \`description\` varchar(255) null, \`sort\` int not null default 0) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`categories\` add unique \`categories_name_unique\`(\`name\`);`);
    this.addSql(`alter table \`categories\` add unique \`categories_slug_unique\`(\`slug\`);`);

    this.addSql(`create table \`articles\` (\`id\` int unsigned not null auto_increment primary key, \`title\` varchar(255) not null, \`slug\` varchar(255) not null, \`summary\` varchar(500) null, \`content\` longtext not null, \`cover\` varchar(255) null, \`status\` enum('draft', 'published') not null default 'draft', \`views\` int not null default 0, \`category_id\` int unsigned null, \`published_at\` datetime null, \`created_at\` datetime not null, \`updated_at\` datetime not null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`articles\` add unique \`articles_slug_unique\`(\`slug\`);`);
    this.addSql(`alter table \`articles\` add index \`articles_status_index\`(\`status\`);`);
    this.addSql(`alter table \`articles\` add index \`articles_category_id_index\`(\`category_id\`);`);

    this.addSql(`create table \`comments\` (\`id\` int unsigned not null auto_increment primary key, \`article_id\` int unsigned not null, \`nickname\` varchar(255) not null, \`email\` varchar(255) null, \`content\` text not null, \`status\` enum('pending', 'approved') not null default 'pending', \`parent_id\` int unsigned null, \`created_at\` datetime not null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`comments\` add index \`comments_article_id_index\`(\`article_id\`);`);
    this.addSql(`alter table \`comments\` add index \`comments_status_index\`(\`status\`);`);
    this.addSql(`alter table \`comments\` add index \`comments_parent_id_index\`(\`parent_id\`);`);

    this.addSql(`create table \`tags\` (\`id\` int unsigned not null auto_increment primary key, \`name\` varchar(255) not null, \`slug\` varchar(255) not null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`tags\` add unique \`tags_name_unique\`(\`name\`);`);
    this.addSql(`alter table \`tags\` add unique \`tags_slug_unique\`(\`slug\`);`);

    this.addSql(`create table \`articles_tags\` (\`article_id\` int unsigned not null, \`tag_id\` int unsigned not null, primary key (\`article_id\`, \`tag_id\`)) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`articles_tags\` add index \`articles_tags_article_id_index\`(\`article_id\`);`);
    this.addSql(`alter table \`articles_tags\` add index \`articles_tags_tag_id_index\`(\`tag_id\`);`);

    this.addSql(`create table \`users\` (\`id\` int unsigned not null auto_increment primary key, \`username\` varchar(255) not null, \`password\` varchar(255) not null, \`nickname\` varchar(255) not null, \`avatar\` varchar(255) null, \`created_at\` datetime not null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`users\` add unique \`users_username_unique\`(\`username\`);`);

    this.addSql(`alter table \`articles\` add constraint \`articles_category_id_foreign\` foreign key (\`category_id\`) references \`categories\` (\`id\`) on update cascade on delete set null;`);

    this.addSql(`alter table \`comments\` add constraint \`comments_article_id_foreign\` foreign key (\`article_id\`) references \`articles\` (\`id\`) on update cascade on delete cascade;`);
    this.addSql(`alter table \`comments\` add constraint \`comments_parent_id_foreign\` foreign key (\`parent_id\`) references \`comments\` (\`id\`) on update cascade on delete cascade;`);

    this.addSql(`alter table \`articles_tags\` add constraint \`articles_tags_article_id_foreign\` foreign key (\`article_id\`) references \`articles\` (\`id\`) on update cascade on delete cascade;`);
    this.addSql(`alter table \`articles_tags\` add constraint \`articles_tags_tag_id_foreign\` foreign key (\`tag_id\`) references \`tags\` (\`id\`) on update cascade on delete cascade;`);
  }

}
