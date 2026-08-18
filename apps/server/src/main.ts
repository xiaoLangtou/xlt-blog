import { MikroORM } from '@mikro-orm/mysql'
import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/global-exception.filter'
import { TransformInterceptor } from './common/transform.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')
  app.enableCors({ origin: true, credentials: true })
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } })
  )
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalFilters(new GlobalExceptionFilter())

  // 开发环境自动执行 pending 迁移，省去手动 migration:up
  if (process.env.NODE_ENV !== 'production') {
    const orm = app.get(MikroORM)
    await orm.getMigrator().up()
  }

  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port)
  new Logger('Bootstrap').log(`Server running at http://localhost:${port}/api`)
}

bootstrap()
