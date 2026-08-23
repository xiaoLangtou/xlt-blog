import { InternalServerErrorException, Injectable } from '@nestjs/common'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const FORMAT_VERSION = 'v1'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

@Injectable()
export class StorageCryptoService {
  encrypt(value: string): string {
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, this.getKey(), iv)
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()

    return [
      FORMAT_VERSION,
      iv.toString('base64url'),
      tag.toString('base64url'),
      ciphertext.toString('base64url')
    ].join(':')
  }

  decrypt(value: string): string {
    try {
      const [version, encodedIv, encodedTag, encodedCiphertext, extra] = value.split(':')
      if (
        version !== FORMAT_VERSION ||
        !encodedIv ||
        !encodedTag ||
        encodedCiphertext === undefined ||
        extra !== undefined ||
        !this.isBase64Url(encodedIv) ||
        !this.isBase64Url(encodedTag) ||
        !this.isBase64Url(encodedCiphertext)
      ) {
        throw new Error('Invalid encrypted storage credential')
      }

      const iv = Buffer.from(encodedIv, 'base64url')
      const tag = Buffer.from(encodedTag, 'base64url')
      const ciphertext = Buffer.from(encodedCiphertext, 'base64url')
      if (iv.length !== IV_LENGTH || tag.length !== AUTH_TAG_LENGTH) {
        throw new Error('Invalid encrypted storage credential')
      }

      const decipher = createDecipheriv(ALGORITHM, this.getKey(), iv)
      decipher.setAuthTag(tag)
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
    } catch {
      throw new InternalServerErrorException('存储凭据无法解密')
    }
  }

  maskSecret(value: string): string {
    if (!value) return value
    if (value.length <= 4) return '*'.repeat(value.length)
    return `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`
  }

  private getKey(): Buffer {
    const key = process.env.STORAGE_ENCRYPTION_KEY
    if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
      throw new InternalServerErrorException('存储加密密钥配置无效')
    }

    const buffer = Buffer.from(key, 'hex')
    if (buffer.length !== 32) {
      throw new InternalServerErrorException('存储加密密钥配置无效')
    }
    return buffer
  }

  private isBase64Url(value: string): boolean {
    return /^[A-Za-z0-9_-]*$/.test(value)
  }
}
