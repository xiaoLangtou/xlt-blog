import { Entity, PrimaryKey, Property } from '@mikro-orm/core'

@Entity({ tableName: 'sys_menu' })
export class SysMenu {
  @PrimaryKey({ columnType: 'bigint unsigned' })
  id!: number

  @Property({ fieldName: 'del_flag', default: 0 })
  delFlag = 0

  @Property({ fieldName: 'create_time', nullable: true })
  createTime?: Date | null

  @Property({ fieldName: 'create_by', length: 50, nullable: true })
  createBy?: string | null

  @Property({ fieldName: 'update_time', nullable: true })
  updateTime?: Date | null

  @Property({ fieldName: 'update_by', length: 50, nullable: true })
  updateBy?: string | null

  @Property({ fieldName: 'delete_time', nullable: true })
  deleteTime?: Date | null

  @Property({ fieldName: 'delete_by', length: 50, nullable: true })
  deleteBy?: string | null

  @Property({ length: 255, nullable: true })
  remark?: string | null

  @Property({ length: 255, nullable: true })
  name?: string | null

  @Property({ fieldName: 'en_name', length: 255, nullable: true })
  enName?: string | null

  @Property({ length: 255, nullable: true })
  permission?: string | null

  @Property({ length: 255, nullable: true })
  path?: string | null

  @Property({ fieldName: 'parent_menu_id', columnType: 'bigint', nullable: true })
  parentMenuId?: number | null

  @Property({ length: 255, nullable: true })
  icon?: string | null

  @Property({ length: 1, default: '1' })
  visible = '1'

  @Property({ fieldName: 'sort_order', nullable: true })
  sortOrder?: number | null

  @Property({ fieldName: 'keep_alive', length: 1, default: '0', nullable: true })
  keepAlive = '0'

  @Property({ length: 1, nullable: true })
  embedded?: string | null

  @Property({ fieldName: 'menu_type', length: 1, default: '0' })
  menuType = '0'

  @Property({ fieldName: 'is_iframe', length: 255, default: '0' })
  isIframe = '0'

  @Property({ fieldName: 'iframe_url', length: 255, nullable: true })
  iframeUrl?: string | null

  @Property({ length: 255, nullable: true })
  component?: string | null
}
