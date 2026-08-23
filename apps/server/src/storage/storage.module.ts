import { Module } from '@nestjs/common'
import { StorageCryptoService } from './storage-crypto.service'
import { StorageService } from './storage.service'

@Module({
  providers: [StorageService, StorageCryptoService],
  exports: [StorageService]
})
export class StorageModule {}
