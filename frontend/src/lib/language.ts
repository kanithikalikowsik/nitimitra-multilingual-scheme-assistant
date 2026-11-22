import type { Language } from './content'

export const LANGUAGE_STORAGE_KEY = 'nitimitra-language'

export function readLanguage(storage: Pick<Storage, 'getItem'>): Language {
  const saved = storage.getItem(LANGUAGE_STORAGE_KEY)
  return saved === 'te' || saved === 'hi' ? saved : 'en'
}

export function persistLanguage(storage: Pick<Storage, 'setItem'>, language: Language): void {
  storage.setItem(LANGUAGE_STORAGE_KEY, language)
}
