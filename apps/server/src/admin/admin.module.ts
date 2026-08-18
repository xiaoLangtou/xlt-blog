import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { AiService } from './ai.service'

@Module({
  controllers: [AdminController],
  providers: [AdminService, AiService]
})
export class AdminModule {}
