import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { StoredState } from './models'
import { createDefaultState, normalizeState } from './models'

export class StateStore {
  private readonly filePath: string
  private operationQueue: Promise<void> = Promise.resolve()

  constructor(baseDir: string) {
    this.filePath = path.join(baseDir, 'note-state.json')
  }

  async load() {
    await mkdir(path.dirname(this.filePath), { recursive: true })

    try {
      const raw = await readFile(this.filePath, 'utf8')
      return normalizeState(JSON.parse(raw)) as StoredState
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        const next = createDefaultState()
        await this.persist(next)
        return next
      }

      throw error
    }
  }

  async save(data: StoredState) {
    return this.enqueue(async () => {
      await this.persist(data)
    })
  }

  async mutate<T>(updater: (draft: StoredState) => Promise<T> | T) {
    return this.enqueue(async () => {
      const current = await this.load()
      const result = await updater(current)
      await this.persist(current)
      return result
    })
  }

  private async persist(data: StoredState) {
    await mkdir(path.dirname(this.filePath), { recursive: true })

    const tempPath = `${this.filePath}.tmp`
    await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8')
    await rename(tempPath, this.filePath)
  }

  private async enqueue<T>(operation: () => Promise<T>) {
    const previous = this.operationQueue
    let releaseQueue!: () => void

    this.operationQueue = new Promise<void>((resolve) => {
      releaseQueue = resolve
    })

    await previous

    try {
      return await operation()
    } finally {
      releaseQueue()
    }
  }
}
