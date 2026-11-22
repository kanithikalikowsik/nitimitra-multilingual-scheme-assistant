import type { AssistantChatResult, AssistantHistoryItem, EligibilityCheck, EligibilityQuestionnaire, SchemeRecord, SchemeSource } from '../types'
import type { Language } from '../lib/content'
import { hasVerifiedSource } from '../lib/sourceVerification'

type ApiEligibilityRule = { id: number; rule_description: string; rule_type: string; criteria: SchemeRecord['eligibilityConditions'][number]['criteria'] }
type ApiDocument = { id: number; document_name: string; description: string | null }
type ApiApplicationStep = { id: number; step_number: number; instruction: string }
type ApiSource = { id: number; source_name: string; source_url: string | null; last_verified_at: string | null; verification_status: 'pending' | 'verified' | 'unverified' }
type ApiScheme = {
  id: number; name: string; slug: string; category: string; short_description: string; overview: string
  benefits: string[]; status: string; is_demo: boolean; created_at: string; updated_at: string
  eligibility_rules: ApiEligibilityRule[]; documents: ApiDocument[]; application_steps: ApiApplicationStep[]; sources: ApiSource[]
}

export type SchemeFilters = { query?: string; categoryId?: string }

const configuredBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '')
const apiBase = configuredBase.endsWith('/api') ? configuredBase : configuredBase.endsWith('/api/v1') ? configuredBase.slice(0, -3) : `${configuredBase}/api`

export class SchemeApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'SchemeApiError'
  }
}

async function request<T>(path: string, signal?: AbortSignal, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${apiBase}${path}`, { ...init, headers: { Accept: 'application/json', ...init.headers }, signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new SchemeApiError('Cannot reach the NitiMitra service. Check that the backend is running.')
  }
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}.`
    try {
      const body = await response.json() as { detail?: unknown }
      if (typeof body.detail === 'string') detail = body.detail
      else if (Array.isArray(body.detail)) {
        const messages = body.detail.flatMap(item => item && typeof item === 'object' && 'msg' in item && typeof item.msg === 'string' ? [item.msg] : [])
        if (messages.length) detail = messages.join(' ')
      }
    } catch { /* Keep the status-based message. */ }
    throw new SchemeApiError(detail, response.status)
  }
  try {
    return await response.json() as T
  } catch {
    throw new SchemeApiError('The NitiMitra service returned an unreadable response.', response.status)
  }
}

function localized(value: string) {
  // Preserve source-language wording. Locales are populated only when reviewed translations exist.
  return { en: value }
}

function mapScheme(scheme: ApiScheme): SchemeRecord {
  const source = scheme.sources.find(hasVerifiedSource) || scheme.sources[0]
  const sourceStatus = hasVerifiedSource(source) ? 'verified' : source?.verification_status === 'unverified' ? 'unverified' : 'pending'
  const mappedSource: SchemeSource = {
    authority: source?.source_name ?? null,
    url: sourceStatus === 'verified' ? source?.source_url ?? null : null,
    verificationStatus: sourceStatus,
    lastVerified: sourceStatus === 'verified' ? source?.last_verified_at ?? null : null,
  }
  return {
    id: scheme.slug,
    name: localized(scheme.name),
    categoryId: scheme.category,
    shortDescription: localized(scheme.short_description),
    overview: localized(scheme.overview),
    benefitsSummary: localized(scheme.benefits.length ? scheme.benefits.join(' ') : 'No verified benefit details are available.'),
    benefits: scheme.benefits.map(localized),
    eligibilityConditions: scheme.eligibility_rules.map(rule => ({ id: rule.id, ruleType: rule.rule_type, criteria: rule.criteria, ...localized(rule.rule_description) })),
    requiredDocuments: scheme.documents.map(document => localized(document.description ? `${document.document_name}: ${document.description}` : document.document_name)),
    applicationSteps: [...scheme.application_steps].sort((a, b) => a.step_number - b.step_number).map(step => localized(step.instruction)),
    keywords: [],
    source: mappedSource,
    isDemo: scheme.is_demo,
  }
}

export function getEligibilityQuestionnaire(slug: string, signal?: AbortSignal): Promise<EligibilityQuestionnaire> {
  return request(`/schemes/slug/${encodeURIComponent(slug)}/eligibility`, signal)
}

export function checkSchemeEligibility(slug: string, answers: Record<string, string | number | boolean>, signal?: AbortSignal): Promise<EligibilityCheck> {
  return request(`/schemes/slug/${encodeURIComponent(slug)}/eligibility-check`, signal, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }),
  })
}

export function askAssistant(message: string, language: Language, history: AssistantHistoryItem[], signal?: AbortSignal): Promise<AssistantChatResult> {
  return request('/assistant/chat', signal, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, language, history: history.slice(-8) }),
  })
}

export async function listSchemes(filters: SchemeFilters = {}, signal?: AbortSignal): Promise<SchemeRecord[]> {
  const params = new URLSearchParams()
  if (filters.query?.trim()) params.set('q', filters.query.trim())
  if (filters.categoryId) params.set('category', filters.categoryId)
  const endpoint = filters.query?.trim() ? '/schemes/search' : '/schemes'
  const result = await request<ApiScheme[]>(`${endpoint}${params.size ? `?${params}` : ''}`, signal)
  return result.map(mapScheme)
}

export async function getSchemeBySlug(slug: string, signal?: AbortSignal): Promise<SchemeRecord | null> {
  try {
    const scheme = await request<ApiScheme>(`/schemes/slug/${encodeURIComponent(slug)}`, signal)
    return mapScheme(scheme)
  } catch (error) {
    if (error instanceof SchemeApiError && error.status === 404) return null
    throw error
  }
}
