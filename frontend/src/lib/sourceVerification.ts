export type SourceVerificationData = {
  verification_status?: string
  source_url?: string | null
  last_verified_at?: string | null
}

export function hasVerifiedSource(source: SourceVerificationData | undefined): boolean {
  if (source?.verification_status !== 'verified' || !source.source_url || !source.last_verified_at) return false
  try { return new URL(source.source_url).protocol === 'https:' } catch { return false }
}
