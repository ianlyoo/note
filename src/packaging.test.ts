import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

interface PackageJsonShape {
  main: string
  productName: string
  description?: string
  scripts: Record<string, string>
  build: {
    files: string[]
    win: {
      icon: string
      artifactName: string
      target: Array<{
        target: string
        arch: string[]
      }>
    }
  }
}

function readPackageJson() {
  const packagePath = path.resolve(import.meta.dirname, '../package.json')
  return JSON.parse(readFileSync(packagePath, 'utf8')) as PackageJsonShape
}

describe('Windows packaging configuration', () => {
  it('keeps Electron entry aligned with built output', () => {
    const packageJson = readPackageJson()

    expect(packageJson.main).toBe('dist-electron/main.js')
    expect(packageJson.productName).toBe('Note')
    expect(packageJson.description).toBeUndefined()
  })

  it('defines scripts for local packing and Windows zip builds', () => {
    const packageJson = readPackageJson()

    expect(packageJson.scripts['pack:dir']).toContain('electron-builder --dir')
    expect(packageJson.scripts['dist:win']).toContain('electron-builder --win zip --x64')
  })

  it('ships the built renderer and Electron bundles in the Windows zip build', () => {
    const packageJson = readPackageJson()

    expect(packageJson.build.files).toEqual(
      expect.arrayContaining(['dist/**/*', 'dist-electron/**/*', 'package.json']),
    )
  })

  it('targets a Windows zip package with the expected icon and artifact name', () => {
    const packageJson = readPackageJson()

    expect(packageJson.build.win.target).toEqual([
      {
        target: 'zip',
        arch: ['x64'],
      },
    ])
    expect(packageJson.build.win.icon).toBe('icon.ico')
    expect(packageJson.build.win.artifactName).toBe('${productName}-Windows-${version}.${ext}')
  })
})
