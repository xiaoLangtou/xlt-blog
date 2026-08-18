import { Migration } from '@mikro-orm/migrations'

export class Migration20260816200000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table \`columns\` (
        \`id\` int unsigned not null auto_increment primary key,
        \`name\` varchar(255) not null,
        \`slug\` varchar(255) not null,
        \`description\` varchar(500) null,
        \`cover\` varchar(255) null,
        \`status\` enum('draft', 'published') not null default 'draft',
        \`sort\` int not null default 0,
        \`created_at\` datetime not null,
        \`updated_at\` datetime not null,
        unique \`columns_name_unique\` (\`name\`),
        unique \`columns_slug_unique\` (\`slug\`)
      ) default character set utf8mb4 engine = InnoDB;
    `)

    this.addSql(`
      create table \`column_articles\` (
        \`id\` int unsigned not null auto_increment primary key,
        \`column_id\` int unsigned not null,
        \`article_id\` int unsigned not null,
        \`sort\` int not null default 0,
        unique \`column_articles_column_article_unique\` (\`column_id\`, \`article_id\`),
        index \`column_articles_column_id_index\` (\`column_id\`),
        index \`column_articles_article_id_index\` (\`article_id\`)
      ) default character set utf8mb4 engine = InnoDB;
    `)

    this.addSql(`
      alter table \`column_articles\` add constraint \`column_articles_column_id_foreign\`
        foreign key (\`column_id\`) references \`columns\` (\`id\`) on update cascade on delete cascade;
    `)
    this.addSql(`
      alter table \`column_articles\` add constraint \`column_articles_article_id_foreign\`
        foreign key (\`article_id\`) references \`articles\` (\`id\`) on update cascade on delete cascade;
    `)

    // 菜单：专栏管理（visible=0 表示导航可见，与既有菜单一致）
    this.addSql(`
      insert into \`sys_menu\` (del_flag, create_time, update_time, name, en_name, permission, path, parent_menu_id, icon, visible, sort_order, keep_alive, menu_type, is_iframe, component)
      select 0, now(), now(), '专栏管理', 'columns', 'blog:column:list', '/blog/columns', id, 'ri:archive-line', '0', 6, '0', '1', '0', '/blog/columns/index'
      from \`sys_menu\` where \`path\` = '/blog' and \`del_flag\` = 0
      and not exists (select 1 from \`sys_menu\` where \`path\` = '/blog/columns' and \`del_flag\` = 0);
    `)
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists `column_articles`;')
    this.addSql('drop table if exists `columns`;')
    this.addSql("delete from `sys_menu` where `path` = '/blog/columns' and `del_flag` = 0;")
  }
}
