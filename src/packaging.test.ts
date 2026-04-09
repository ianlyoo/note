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
    portable: {
      unpackDirName: string
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
    expect(packageJson.scripts['dist:win']).toContain('electron-builder --win portable --x64')
  })

  it('ships the built renderer and Electron bundles in the portable build', () => {
    const packageJson = readPackageJson()

    expect(packageJson.build.files).toEqual(
      expect.arrayContaining(['dist/**/*', 'dist-electron/**/*', 'package.json']),
    )
  })

  it('targets a Windows portable executable with the expected artifact name', () => {
    const packageJson = readPackageJson()

    expect(packageJson.build.win.target).toEqual([
      {
        target: 'portable',
        arch: ['x64'],
      },
    ])
    expect(packageJson.build.win.artifactName).toBe('${productName}-Portable-${version}.${ext}')
    expect(packageJson.build.portable.unpackDirName).toBe('NotePortable')
  })
})
