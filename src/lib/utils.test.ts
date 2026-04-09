import { describe, expect, it } from 'vitest'

import { buildLockedName, deriveLockStatus, matchesUnlockText } from './utils'

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

describe('matchesUnlockText', () => {
  it('accepts the matching saved note text', () => {
    expect(matchesUnlockText('open-sesame', 'open-sesame')).toBe(true)
  })

  it('ignores surrounding whitespace while matching', () => {
    expect(matchesUnlockText('  open-sesame\n', 'open-sesame')).toBe(true)
  })

  it('rejects non-matching text', () => {
    expect(matchesUnlockText('not-it', 'open-sesame')).toBe(false)
  })
})
