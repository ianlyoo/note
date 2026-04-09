import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

interface PackageJsonShape {
  main: string
  productName: string
  scripts: Record<string, string>
  build: {
    files: string[]
    win: {
      artifactName: string
      target: Array<{
        target: string
        arch: string[]
      }>
    }
    nsis: {
      shortcutName: string
      oneClick: boolean
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
  })

  it('defines scripts for local packing and Windows installer builds', () => {
    const packageJson = readPackageJson()

    expect(packageJson.scripts['pack:dir']).toContain('electron-builder --dir')
    expect(packageJson.scripts['dist:win']).toContain('electron-builder --win nsis --x64')
  })

  it('ships the built renderer and Electron bundles in the installer', () => {
    const packageJson = readPackageJson()

    expect(packageJson.build.files).toEqual(
      expect.arrayContaining(['dist/**/*', 'dist-electron/**/*', 'package.json']),
    )
  })

  it('targets a Windows NSIS setup executable with the expected artifact name', () => {
    const packageJson = readPackageJson()

    expect(packageJson.build.win.target).toEqual([
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ])
    expect(packageJson.build.win.artifactName).toBe('${productName}-Setup-${version}.${ext}')
    expect(packageJson.build.nsis.shortcutName).toBe('Note')
    expect(packageJson.build.nsis.oneClick).toBe(true)
  })
})
