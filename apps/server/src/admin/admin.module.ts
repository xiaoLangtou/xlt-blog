import { Module } from '@nestjs/common'
import { StorageModule } from '../storage/storage.module'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { AiService } from './ai.service'

@Module({
  imports: [StorageModule],
  controllers: [AdminController],
  providers: [AdminService, AiService]
})
export class AdminModule {}
