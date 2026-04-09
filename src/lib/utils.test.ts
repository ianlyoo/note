import { describe, expect, it } from 'vitest'

import { buildLockedName, deriveLockStatus } from './utils'

describe('buildLockedName', () => {
  it('keeps the original file name in the locked name', () => {
    expect(buildLockedName('12345678-9abc', 'Skyrim')).toBe('.__note_locked__12345678__Skyrim')
  })
})

describe('deriveLockStatus', () => {
  it('marks healthy locked items as locked', () => {
    expect(deriveLockStatus({ originalExists: false, lockedExists: true })).toBe('locked')
  })

  it('marks duplicate visibility as conflict', () => {
    expect(deriveLockStatus({ originalExists: true, lockedExists: true })).toBe('conflict')
  })

  it('marks missing targets as missing', () => {
    expect(deriveLockStatus({ originalExists: false, lockedExists: false })).toBe('missing')
  })
})
