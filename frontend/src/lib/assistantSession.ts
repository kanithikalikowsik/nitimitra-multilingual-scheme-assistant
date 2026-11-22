import type { AssistantChatStatus, AssistantSourceReference } from '../types'

export type AssistantSessionMessage = {
  id: string
  text: string
  kind: 'user' | 'assistant'
  status?: AssistantChatStatus
  sources?: AssistantSourceReference[]
  retry?: { text: string; history: Array<{ role: 'user' | 'assistant'; content: string }> }
}

const SESSION_KEY = 'nitimitra.assistant.conversation.v1'
const MAX_MESSAGES = 30

function isStoredMessage(value: unknown): value is AssistantSessionMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as Partial<AssistantSessionMessage>
  return typeof message.id === 'string' && typeof message.text === 'string'
    && (message.kind === 'user' || message.kind === 'assistant')
    && (message.status === undefined || ['answered', 'unavailable', 'unverified', 'not_found', 'error'].includes(message.status))
    && (message.sources === undefined || Array.isArray(message.sources))
}

export function readAssistantSession(storage: Pick<Storage, 'getItem'>): AssistantSessionMessage[] {
  try {
    const stored = storage.getItem(SESSION_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.filter(isStoredMessage).slice(-MAX_MESSAGES).map(({ id, text, kind, status, sources }) => ({ id, text, kind, status, sources })) : []
  } catch {
    return []
  }
}

export function writeAssistantSession(storage: Pick<Storage, 'setItem'>, messages: AssistantSessionMessage[]): void {
  try {
    const saved = messages.slice(-MAX_MESSAGES).map(({ id, text, kind, status, sources }) => ({ id, text, kind, status, sources }))
    storage.setItem(SESSION_KEY, JSON.stringify(saved))
  } catch {
    // Chat still works in memory when browser storage is disabled or full.
  }
}

export function clearAssistantSession(storage: Pick<Storage, 'removeItem'>): void {
  try { storage.removeItem(SESSION_KEY) } catch { /* Ignore unavailable session storage. */ }
}
