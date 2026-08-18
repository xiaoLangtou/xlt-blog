import { watchDebounced } from '@vueuse/core'
import type { MaybeRefOrGetter, Ref } from 'vue'

export type AutoSaveState = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutoSaveOptions<T> {
  source: MaybeRefOrGetter<T>
  save: () => Promise<void>
  enabled?: MaybeRefOrGetter<boolean>
  backupKey?: MaybeRefOrGetter<string>
  backup: () => T
  debounce?: number
}

interface DraftBackup<T> {
  at: number
  data: T
}

export function useBlogAutoSave<T>(options: UseAutoSaveOptions<T>) {
  const state = ref<AutoSaveState>('idle') as Ref<AutoSaveState>
  const lastSavedAt = ref<Date | null>(null)

  async function save() {
    if (options.enabled !== undefined && !toValue(options.enabled)) return

    state.value = 'saving'
    // 先写备份再落库：让备份时间戳早于服务端 updatedAt，
    // 避免刷新后把“刚保存过的内容”误判为“有更新的本地草稿”。
    // 即使保存失败，这里也已保留了最后一次编辑内容。
    writeBackup()
    try {
      await options.save()
      lastSavedAt.value = new Date()
      state.value = 'saved'
    } catch {
      state.value = 'error'
    }
  }

  function writeBackup() {
    const key = options.backupKey && toValue(options.backupKey)
    if (!key) return

    try {
      localStorage.setItem(key, JSON.stringify({ at: Date.now(), data: options.backup() }))
    } catch {
      // Storage capacity and serialization failures must not interrupt authoring.
    }
  }

  function readBackup(): DraftBackup<T> | null {
    const key = options.backupKey && toValue(options.backupKey)
    if (!key) return null

    try {
      const value = localStorage.getItem(key)
      return value ? (JSON.parse(value) as DraftBackup<T>) : null
    } catch {
      return null
    }
  }

  function clearBackup() {
    const key = options.backupKey && toValue(options.backupKey)
    if (key) localStorage.removeItem(key)
  }

  const stop = watchDebounced(() => toValue(options.source), save, {
    debounce: options.debounce ?? 2000,
    deep: true
  })

  return { state, lastSavedAt, flush: save, readBackup, clearBackup, stop }
}
