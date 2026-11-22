import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, MessageCircle, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { categories, type Copy, type Language } from '../lib/content'
import { listSchemes } from '../services/schemeService'
import type { SchemeRecord } from '../types'

export function countSchemesByCategory(schemes: Pick<SchemeRecord, 'categoryId'>[]): Record<string, number> {
  const counts = Object.fromEntries(categories.map(category => [category.id, 0])) as Record<string, number>
  for (const scheme of schemes) counts[scheme.categoryId] = (counts[scheme.categoryId] ?? 0) + 1
  return counts
}

export default function HomePage({ t, language }: { t: Copy; language: Language }) {
  const navigate = useNavigate()
  const [featuredScheme, setFeaturedScheme] = useState<SchemeRecord | null>(null)
  const [featuredError, setFeaturedError] = useState(false)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number> | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    listSchemes({}, controller.signal).then(rows => {
      setFeaturedScheme(rows[0] ?? null)
      setCategoryCounts(countSchemesByCategory(rows))
    }).catch(reason => {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) setFeaturedError(true)
    })
    return () => controller.abort()
  }, [])
  const submit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); navigate(`/schemes?q=${encodeURIComponent(String(data.get('query') || ''))}`) }
  return <main>
    <section className="hero"><div className="hero-inner"><div className="hero-copy"><div className="eyebrow"><span/> {t.eyebrow}</div><h1>{t.titleA}<br/><span>{t.titleB}</span></h1><p className="hero-intro">{t.intro}</p><form className="search-box hero-search" onSubmit={submit}><BookOpen size={19}/><input name="query" placeholder={t.search} aria-label={t.search}/><button type="submit">{t.searchButton}<ArrowRight size={16}/></button></form><div className="hero-actions"><Link className="button" to="/schemes">{t.exploreCta}<ArrowRight size={16}/></Link><Link className="button button-light" to="/eligibility">{t.eligibilityCta}</Link></div><div className="trust-note"><ShieldCheck size={16}/><span>{t.trustNote}</span></div></div>
      <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-sun"/><div className="hero-document"><div className="doc-top"><span className="doc-seal"><ShieldCheck size={22}/></span><span className="doc-lines"><i/><i/><i/></span></div><div className="doc-rule"/><div className="doc-row"><span className="doc-icon"><BookOpen size={17}/></span><span className="doc-text"><i/><i/></span></div><div className="doc-row"><span className="doc-icon teal"><CheckCircle2 size={17}/></span><span className="doc-text"><i/><i/></span></div><div className="doc-bottom"><span/><span/><span/></div></div><div className="float-pill float-left"><span className="pill-icon teal"><BookOpen size={16}/></span><span><strong>{t.simpleExplanations}</strong><small>{t.languageNames}</small></span></div><div className="float-pill float-right"><span className="pill-icon gold"><ShieldCheck size={16}/></span><span><strong>{t.sourceAware}</strong><small>{t.knowWhatToTrust}</small></span></div><div className="hero-dots dots-a"/><div className="hero-dots dots-b"/></div></div><div className="hero-curve"/></section>

    <section className="section category-section"><div className="section-heading"><div><div className="eyebrow muted-eyebrow">{t.journeyEyebrow}</div><h2>{t.categories}</h2><p>{t.categoriesSub}</p></div><Link className="text-link" to="/schemes">{t.browseAll}<ArrowRight size={16}/></Link></div><div className="category-grid">{categories.map(({ id, name, te, hi, icon: Icon, tone }) => <Link key={id} to={`/schemes?category=${encodeURIComponent(id)}`} className="category-card"><span className={`category-icon ${tone}`}><Icon size={22}/></span><span className="category-name">{{en:name,te,hi}[language]}</span><ArrowRight className="category-arrow" size={17}/><span className="category-number" aria-label={categoryCounts ? `${categoryCounts[id] ?? 0}` : undefined}>{categoryCounts ? String(categoryCounts[id] ?? 0).padStart(2, '0') : '—'}</span></Link>)}</div></section>

      <section className="section featured-section"><div className="featured-copy"><div className="eyebrow muted-eyebrow">{t.featuredEyebrow}</div><h2>{t.featured}</h2><p>{t.featuredSub}</p><Link className="button button-outline" to="/schemes">{t.exploreCta}<ArrowRight size={16}/></Link></div>{featuredScheme ? <Link to={`/schemes/${featuredScheme.id}`} className="featured-card"><div className="featured-top"><span className="category-icon gold"><GraduationCap size={21}/></span><span className="demo-tag"><span/> {featuredScheme.isDemo ? t.demo : featuredScheme.source.verificationStatus === 'verified' ? t.verifiedSource : featuredScheme.source.verificationStatus === 'unverified' ? t.assistantSourceUnverified : t.verificationPending}</span></div><span className="featured-label">{featuredScheme.isDemo ? t.nitimitraSample : t.schemeInformationLabel}</span><h3>{featuredScheme.name[language] || featuredScheme.name.en}</h3><p>{featuredScheme.shortDescription[language] || featuredScheme.shortDescription.en}</p><span className="card-link">{t.viewDetails}<ArrowRight size={15}/></span></Link> : <div className="featured-card" role="status"><span className="featured-label">{featuredError ? t.error : t.loading}</span><p>{featuredError ? t.backendLoadError : t.loading}</p><Link className="card-link" to="/schemes">{t.exploreCta}<ArrowRight size={15}/></Link></div>}</section>

    <section className="how-section"><div className="section how-inner"><div className="section-heading centered"><div className="eyebrow">{t.designedEyebrow}</div><h2>{t.how}</h2><p>{t.howSub}</p></div><div className="steps-grid">{t.steps.map((step, i) => <div className="step-card" key={step}><span className="step-number">0{i + 1}</span><div className="step-line"><span/></div><h3>{step}</h3><p>{t.stepText[i]}</p></div>)}</div></div></section>

    <section className="section trust-section"><div className="trust-icon"><ShieldCheck size={23}/></div><div><span className="eyebrow muted-eyebrow">{t.checkableInfo}</span><h2>{t.trustTitle}</h2><p>{t.trustText}</p></div><div className="trust-marks"><span><CheckCircle2 size={15}/>{t.clearDemoLabels}</span><span><CheckCircle2 size={15}/>{t.officialSourcesWhenVerified}</span></div></section>

    <section className="assistant-wrap section"><div className="assistant-card"><div className="assistant-icon"><MessageCircle size={26}/><span/></div><div className="assistant-copy"><span className="eyebrow">{t.hereToHelp}</span><h2>{t.assistantTitle}</h2><p>{t.assistantText}</p></div><Link to="/assistant" className="assistant-link">{t.openAssistant}<ArrowRight size={16}/></Link></div><div className="notice"><ShieldCheck size={18}/><p>{t.disclaimer}</p></div></section>
  </main>
}
