import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, FileText, Landmark, ListChecks, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router'
import DemoInfoBadge from '../components/DemoInfoBadge'
import SchemeInfoSection from '../components/SchemeInfoSection'
import { categories, categoryLabel as getCategoryLabel, type Copy, type Language } from '../lib/content'
import { getSchemeBySlug } from '../services/schemeService'
import type { SchemeRecord } from '../types'

export default function SchemeDetailPage({ t, language }: { t: Copy; language: Language }) {
  const { id } = useParams()
  const [scheme, setScheme] = useState<SchemeRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    getSchemeBySlug(id || '', controller.signal).then(result => {
      setScheme(result)
      setLoading(false)
    }).catch(reason => {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      setError(true)
      setLoading(false)
    })
    return () => controller.abort()
  }, [id, retry])
  if (loading) return <main className="page-main section"><Link className="back-link" to="/schemes"><ArrowLeft size={15}/>{t.back}</Link><div className="state-card" role="status"><span className="loading-dot"/><p>{t.loading}</p></div></main>
  if (error) return <main className="page-main section scheme-not-found"><Link className="back-link" to="/schemes"><ArrowLeft size={15}/>{t.back}</Link><div className="state-card error-state" role="alert"><h1>{t.error}</h1><p>{t.backendUnavailable}</p><button type="button" className="button button-outline" onClick={() => setRetry(value => value + 1)}>{t.retry}</button></div></main>
  if (!scheme) return <main className="page-main section scheme-not-found"><Link className="back-link" to="/schemes"><ArrowLeft size={15}/>{t.back}</Link><div className="state-card"><span className="not-found-mark">404</span><h1>{t.notFound}</h1><p>{t.notFoundDescription}</p><Link className="button" to="/schemes"><ArrowLeft size={15}/>{t.back}</Link></div></main>

  const category = categories.find(item => item.id === scheme.categoryId)
  const categoryLabel = category ? getCategoryLabel(category, language) : scheme.categoryId
  const text = (value: { en: string; te?: string; hi?: string }) => value[language] || value.en

  return <main className="page-main section scheme-detail-page">
    <Link className="back-link" to="/schemes"><ArrowLeft size={15}/>{t.back}</Link>
    <div className="detail-layout"><article className="detail-primary">
      <header className="detail-head"><div className="detail-tags"><span className="category-chip">{categoryLabel}</span>{scheme.isDemo && <DemoInfoBadge t={t}/>}</div><h1>{text(scheme.name)}</h1><p className="detail-lead">{text(scheme.shortDescription)}</p>{language !== 'en' && !scheme.shortDescription[language] && <p className="section-summary">{t.sourceLanguage}. {t.schemeOriginalLanguageNotice}</p>}</header>
      {scheme.isDemo && <div className="detail-demo-note"><ShieldCheck size={18}/><span>{t.demoDisclaimer}</span></div>}
      <SchemeInfoSection title={t.overview} icon={<BookOpen size={17}/>} className="overview-panel"><p>{text(scheme.overview)}</p></SchemeInfoSection>
      <SchemeInfoSection title={t.benefits} icon={<CheckCircle2 size={17}/> }><p className="section-summary">{text(scheme.benefitsSummary)}</p><ul className="detail-checklist">{scheme.benefits.map((item, index) => <li key={index}><CheckCircle2 size={15}/><span>{text(item)}</span></li>)}</ul></SchemeInfoSection>
      <SchemeInfoSection title={t.eligibility} icon={<ShieldCheck size={17}/> }><ul className="detail-checklist">{scheme.eligibilityConditions.map((item, index) => <li key={index}><ShieldCheck size={15}/><span>{text(item)}</span></li>)}</ul><Link className="button button-outline" to={`/eligibility?scheme=${encodeURIComponent(scheme.id)}`}>{t.eligibilityCta}</Link></SchemeInfoSection>
      <SchemeInfoSection title={t.documents} icon={<FileText size={17}/> }><ul className="detail-checklist document-checklist">{scheme.requiredDocuments.map((item, index) => <li key={index}><span className="check-square" aria-hidden="true"/><span>{text(item)}</span></li>)}</ul></SchemeInfoSection>
      <SchemeInfoSection title={t.application} icon={<ListChecks size={17}/> }><ol className="application-steps">{scheme.applicationSteps.map((item, index) => <li key={index}><span>{String(index + 1).padStart(2, '0')}</span><p>{text(item)}</p></li>)}</ol></SchemeInfoSection>
    </article><aside className="source-card" aria-labelledby="source-heading"><div className="source-card-heading"><span><Landmark size={18}/></span><div><small>{t.source}</small><h2 id="source-heading">{t.verificationDetails}</h2></div></div><div className={`verification-status ${scheme.source.verificationStatus}`}><span/>{scheme.source.verificationStatus === 'verified' ? t.verifiedSource : scheme.source.verificationStatus === 'unverified' ? t.assistantSourceUnverified : t.verificationPending}</div>{scheme.source.url && scheme.source.verificationStatus === 'verified' ? <a href={scheme.source.url} target="_blank" rel="noreferrer" className="source-link">{t.openOfficialSource}<ArrowUpRight size={15}/></a> : <p className="source-missing">{t.noSource}</p>}{scheme.source.authority && <div className="meta-row"><Landmark size={15}/><span><small>{t.department}</small>{scheme.source.authority}</span></div>}{scheme.source.lastVerified && <div className="meta-row"><CalendarDays size={15}/><span><small>{t.lastVerified}</small>{scheme.source.lastVerified}</span></div>}{!scheme.source.lastVerified && <p className="source-footnote">{t.noVerificationDate}</p>}<div className="source-divider"/><p className="source-footnote">{t.verifyImportant}</p></aside></div>
  </main>
}
