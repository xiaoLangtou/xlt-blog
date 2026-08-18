import CryptoJS from 'crypto-js'

/** MD5 加密 */
export function md5(value: string) {
  return CryptoJS.MD5(value).toString()
}

/** 密码 MD5 加密 */
export function encryptPassword(password: string) {
  return md5(password)
}
