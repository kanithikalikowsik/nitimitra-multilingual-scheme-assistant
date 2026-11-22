export type LocalizedText = { en: string; te?: string; hi?: string }

export type SchemeSource = {
  authority: string | null
  url: string | null
  verificationStatus: 'verified' | 'pending' | 'unverified'
  lastVerified: string | null
}

/** Normalized scheme shape; fields map cleanly to the future API response. */
export type SchemeRecord = {
  id: string
  name: LocalizedText
  categoryId: string
  shortDescription: LocalizedText
  overview: LocalizedText
  benefitsSummary: LocalizedText
  benefits: LocalizedText[]
  eligibilityConditions: EligibilityRuleRecord[]
  requiredDocuments: LocalizedText[]
  applicationSteps: LocalizedText[]
  keywords: LocalizedText[]
  source: SchemeSource
  isDemo: boolean
}

export type EligibilityRuleRecord = LocalizedText & { id: number; ruleType: string; criteria: EligibilityCriteria | null }
export type EligibilityCriteria = { field: string; operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in'; expected: string | number | boolean | Array<string | number | boolean>; verification_status?: 'verified' | 'pending' | 'unverified'; question?: string; field_type?: 'text' | 'number' | 'select'; options?: Array<string | number> }
export type EligibilityQuestionnaire = { scheme_id: number; scheme_name: string; is_demo: boolean; questions: Array<{ field: string; label: string; type: string; options: Array<string | number>; rule_id: number }>; rule_count: number; source_name: string | null; source_url: string | null }
export type EligibilityExplanationKey = 'rule_unverified' | 'demo_rule' | 'answer_missing' | 'answer_matches' | 'answer_does_not_match' | 'document_requirement_unknown'
export type EligibilityCheck = { scheme_id: number; scheme_name: string; is_demo: boolean; preliminary: true; overall_status: 'appears_eligible' | 'appears_not_eligible' | 'insufficient_information' | 'cannot_determine'; conditions: Array<{ rule_id: number; description: string; answer: string | number | boolean | null; status: 'met' | 'not_met' | 'needs_more_information' | 'not_verified'; explanation: string; explanation_key?: EligibilityExplanationKey | null; source_name: string | null; source_url: string | null }>; documents: Array<{ name: string; requirement: 'required' | 'optional' | 'unknown'; explanation: string; explanation_key?: EligibilityExplanationKey | null; source_name: string | null; source_url: string | null }> }

export type AssistantChatStatus = 'answered' | 'unavailable' | 'unverified' | 'not_found' | 'error'
export type AssistantSourceReference = { scheme_name: string; source_name: string; source_url: string | null; verification_status: 'verified' | 'pending' | 'unverified'; last_verified_at: string | null; evidence_sections: string[] }
export type AssistantChatResult = { answer: string; status: AssistantChatStatus; sources: AssistantSourceReference[]; stored: false }
export type AssistantHistoryItem = { role: 'user' | 'assistant'; content: string }
