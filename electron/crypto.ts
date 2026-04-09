import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

import type { EncryptedNoteBody, PasswordConfig } from './models'

const PASSWORD_KEY_LENGTH = 64
const NOTE_KEY_LENGTH = 32

export function hashPassword(password: string): PasswordConfig {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex')

  return { salt, hash }
}

export function verifyPassword(password: string, config: PasswordConfig) {
  const derived = scryptSync(password, config.salt, PASSWORD_KEY_LENGTH)
  const stored = Buffer.from(config.hash, 'hex')

  if (derived.length !== stored.length) {
    return false
  }

  return timingSafeEqual(derived, stored)
}

function deriveEncryptionKey(password: string, salt: string) {
  return scryptSync(password, salt, NOTE_KEY_LENGTH)
}

export function encryptProtectedBody(body: string, password: string): EncryptedNoteBody {
  const salt = randomBytes(16).toString('hex')
  const iv = randomBytes(12)
  const key = deriveEncryptionKey(password, salt)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(body, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    salt,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    ciphertext: ciphertext.toString('hex'),
  }
}

export function decryptProtectedBody(encrypted: EncryptedNoteBody, password: string) {
  const key = deriveEncryptionKey(password, encrypted.salt)
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(encrypted.iv, 'hex'))
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'))

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, 'hex')),
    decipher.final(),
  ])

  return plaintext.toString('utf8')
}
