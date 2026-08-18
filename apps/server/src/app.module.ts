import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ServeStaticModule } from '@nestjs/serve-static'
import { XltTokenGuard, XltTokenModule } from '@xlt-token/nestjs'
import { join } from 'node:path'
import mikroOrmConfig from './mikro-orm.config'
import { AuthModule } from './auth/auth.module'
import { BlogModule } from './blog/blog.module'
import { AdminModule } from './admin/admin.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    // 白名单模式：默认放行，管理接口用 @XltCheckLogin() 标注
    XltTokenModule.forRoot({
      isGlobal: true,
      config: {
        tokenName: 'authorization',
        tokenPrefix: 'Bearer ',
        timeout: 60 * 60 * 24 * 7,
        defaultCheck: false
      }
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads'),
      serveRoot: '/uploads'
    }),
    AuthModule,
    BlogModule,
    AdminModule
  ],
  providers: [{ provide: APP_GUARD, useClass: XltTokenGuard }]
})
export class AppModule {}
