import { Migration } from '@mikro-orm/migrations'

export class Migration20260813UseSysMenu extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists \`sys_menu\` (
        \`id\` bigint unsigned not null auto_increment comment '菜单ID',
        \`del_flag\` tinyint not null default 0 comment '删除标识 0:未删除 1:已删除',
        \`create_time\` datetime null comment '创建时间',
        \`create_by\` varchar(50) null comment '创建人',
        \`update_time\` datetime null comment '更新时间',
        \`update_by\` varchar(50) null comment '更新人',
        \`delete_time\` datetime null comment '删除时间',
        \`delete_by\` varchar(50) null comment '删除人',
        \`remark\` varchar(255) null comment '备注',
        \`name\` varchar(255) null comment '菜单名称',
        \`en_name\` varchar(255) null comment '英文名称',
        \`permission\` varchar(255) null comment '权限标识',
        \`path\` varchar(255) null comment '路由路径',
        \`parent_menu_id\` bigint null comment '父ID',
        \`icon\` varchar(255) null comment '菜单图标',
        \`visible\` char not null default '1' comment '是否显示 0:不可见 1:可见',
        \`sort_order\` int null comment '排序值',
        \`keep_alive\` char null default '0' comment '是否缓存 0:不缓存 1:缓存',
        \`embedded\` char null comment '是否内嵌 0:不内嵌 1:内嵌',
        \`menu_type\` char not null default '0' comment '菜单类型 0:目录 1:菜单 2:按钮',
        \`is_iframe\` varchar(255) not null default '0' comment '是否外链 0:不是 1:是',
        \`iframe_url\` varchar(255) null comment '外链地址',
        \`component\` varchar(255) null comment '组件路径',
        primary key (\`id\`),
        index \`sys_menu_del_flag_index\` (\`del_flag\`)
      ) default character set utf8mb4 engine = InnoDB;
    `)

    this.addSql(`
      insert into \`sys_menu\` (del_flag, create_time, update_time, name, en_name, path, parent_menu_id, icon, visible, sort_order, keep_alive, menu_type, is_iframe, component)
      select 0, now(), now(), '博客管理', 'blog', '/blog', -1, 'ri:article-line', '0', 20, '0', '0', '0', ''
      where not exists (select 1 from \`sys_menu\` where \`path\` = '/blog' and \`del_flag\` = 0);
    `)

    const menus = [
      ['文章管理', 'articles', 'blog:article:list', '/blog/articles', 'ri:file-text-line', '0', '1', '/blog/articles/index'],
      ['新建文章', 'article-create', 'blog:article:create', '/blog/articles/new', 'ri:file-add-line', '1', '1', '/blog/articles/editor'],
      ['编辑文章', 'article-edit', 'blog:article:update', '/blog/articles/:id/edit', 'ri:edit-line', '1', '1', '/blog/articles/editor'],
      ['分类管理', 'categories', 'blog:category:list', '/blog/categories', 'ri:folder-3-line', '0', '1', '/blog/categories/index'],
      ['标签管理', 'tags', 'blog:tag:list', '/blog/tags', 'ri:price-tag-3-line', '0', '1', '/blog/tags/index'],
      ['评论管理', 'comments', 'blog:comment:list', '/blog/comments', 'ri:chat-3-line', '0', '1', '/blog/comments/index'],
      ['媒体库', 'attachments', 'blog:attachment:list', '/blog/attachments', 'ri:image-line', '0', '1', '/blog/attachments/index']
    ]

    menus.forEach(([name, enName, permission, path, icon, visible, menuType, component], index) => {
      this.addSql(`
        insert into \`sys_menu\` (del_flag, create_time, update_time, name, en_name, permission, path, parent_menu_id, icon, visible, sort_order, keep_alive, menu_type, is_iframe, component)
        select 0, now(), now(), '${name}', '${enName}', '${permission}', '${path}', id, '${icon}', '${visible}', ${index + 1}, '0', '${menuType}', '0', '${component}'
        from \`sys_menu\` where \`path\` = '/blog' and \`del_flag\` = 0
        and not exists (select 1 from \`sys_menu\` where \`path\` = '${path}' and \`del_flag\` = 0);
      `)
    })

    this.addSql(`
      insert into \`sys_menu\` (del_flag, create_time, update_time, name, en_name, path, parent_menu_id, icon, visible, sort_order, keep_alive, menu_type, is_iframe, component)
      select 0, now(), now(), '博客系统', 'blog-system', '/blog-system', -1, 'ri:settings-3-line', '0', 21, '0', '0', '0', ''
      where not exists (select 1 from \`sys_menu\` where \`path\` = '/blog-system' and \`del_flag\` = 0);
    `)

    const systemMenus = [
      ['独立页面', 'pages', 'blog:page:list', '/blog-system/pages', 'ri:pages-line', '/blog/pages/index'],
      ['友情链接', 'links', 'blog:link:list', '/blog-system/links', 'ri:links-line', '/blog/links/index'],
      ['菜单管理', 'menus', 'blog:menu:list', '/blog-system/menus', 'ri:menu-line', '/system/menu'],
      ['站点设置', 'settings', 'blog:settings:update', '/blog-system/settings', 'ri:palette-line', '/blog/settings/index']
    ]

    systemMenus.forEach(([name, enName, permission, path, icon, component], index) => {
      this.addSql(`
        insert into \`sys_menu\` (del_flag, create_time, update_time, name, en_name, permission, path, parent_menu_id, icon, visible, sort_order, keep_alive, menu_type, is_iframe, component)
        select 0, now(), now(), '${name}', '${enName}', '${permission}', '${path}', id, '${icon}', '1', ${index + 1}, '0', '1', '0', '${component}'
        from \`sys_menu\` where \`path\` = '/blog-system' and \`del_flag\` = 0
        and not exists (select 1 from \`sys_menu\` where \`path\` = '${path}' and \`del_flag\` = 0);
      `)
    })
  }

  override async down(): Promise<void> {
    this.addSql("delete from `sys_menu` where `path` in ('/blog', '/blog/articles', '/blog/articles/new', '/blog/articles/:id/edit', '/blog/categories', '/blog/tags', '/blog/comments', '/blog/attachments', '/blog-system', '/blog-system/pages', '/blog-system/links', '/blog-system/menus', '/blog-system/settings');")
  }
}
