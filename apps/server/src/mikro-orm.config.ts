import { defineConfig } from '@mikro-orm/mysql'
import { Migrator } from '@mikro-orm/migrations'
import { SeedManager } from '@mikro-orm/seeder'
import 'dotenv/config'
import {
  AdminMenu,
  Article,
  Attachment,
  Category,
  Column,
  ColumnArticle,
  Comment,
  FriendLink,
  Page,
  Setting,
  SysMenu,
  Tag,
  User
} from './entities'

export default defineConfig({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  dbName: process.env.DB_NAME ?? 'xlt_blog',
  user: process.env.DB_USER ?? 'xlt_blog',
  password: process.env.DB_PASSWORD ?? 'xlt_blog',
  entities: [
    User,
    Category,
    Tag,
    Article,
    Column,
    ColumnArticle,
    Comment,
    Setting,
    Attachment,
    Page,
    FriendLink,
    AdminMenu,
    SysMenu
  ],
  extensions: [Migrator, SeedManager],
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations'
  },
  seeder: {
    path: './dist/seeders',
    pathTs: './src/seeders'
  },
  debug: process.env.NODE_ENV !== 'production'
})
