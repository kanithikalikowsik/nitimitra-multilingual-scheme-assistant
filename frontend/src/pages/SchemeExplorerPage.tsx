import { useEffect, useState } from 'react'
import { BookOpen, Search, SlidersHorizontal, X } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { categories, categoryLabel as getCategoryLabel, type Copy, type Language } from '../lib/content'
import { listSchemes } from '../services/schemeService'
import SchemeCard from '../components/SchemeCard'
import type { SchemeRecord } from '../types'

export default function SchemeExplorerPage({ t, language }: { t: Copy; language: Language }) {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const categoryParam = params.get('category') || ''
  const categoryId = categories.find(item => item.id === categoryParam || item.name === categoryParam)?.id || ''
  const hasFilters = Boolean(query || categoryParam)
  const selectedCategory = categories.find(item => item.id === categoryId)
  const [schemes, setSchemes] = useState<SchemeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    listSchemes({ query, categoryId }, controller.signal).then(data => {
      setSchemes(data)
      setLoading(false)
    }).catch(reason => {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      setError(true)
      setLoading(false)
    })
    return () => controller.abort()
  }, [query, categoryId, retry])

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return <main className="page-main section">
    <div className="page-heading explorer-heading"><div className="eyebrow muted-eyebrow">{t.infoExplorerEyebrow}</div><h1>{t.explorerTitle}</h1><p>{t.explorerIntro}</p></div>
    <section className="explorer-toolbar" aria-label={t.explorerTitle}>
      <div className="search-box explorer-search"><Search size={18}/><label className="sr-only" htmlFor="scheme-search">{t.searchPlaceholder}</label><input id="scheme-search" type="search" value={query} onChange={event => updateFilter('q', event.target.value)} placeholder={t.searchPlaceholder}/>{query && <button type="button" className="search-clear" onClick={() => updateFilter('q', '')} aria-label={t.clearSearch}><X size={15}/></button>}</div>
      <label className="filter-select"><SlidersHorizontal size={16}/><span className="sr-only">{t.filterAll}</span><select aria-label={t.filterAll} value={categoryId} onChange={event => updateFilter('category', event.target.value)}><option value="">{t.filterAll}</option>{categories.map(item => <option key={item.id} value={item.id}>{getCategoryLabel(item, language)}</option>)}</select></label>
    </section>
    <div className="results-toolbar"><p aria-live="polite">{loading ? t.loading : <><strong>{schemes.length}</strong> {schemes.length === 1 ? t.resultCountSingle : t.resultCount}{selectedCategory ? <> · {getCategoryLabel(selectedCategory, language)}</> : null}</>}</p>{hasFilters && <button type="button" className="clear-filters" onClick={() => setParams(new URLSearchParams(), { replace: true })}><X size={14}/>{t.clearFilters}</button>}</div>
    {loading ? <div className="state-card" role="status"><span className="loading-dot"/><p>{t.loading}</p></div> : error ? <div className="state-card error-state" role="alert"><h2>{t.error}</h2><p>{t.backendUnavailable}</p><button type="button" className="button button-outline" onClick={() => setRetry(value => value + 1)}>{t.retry}</button></div> : schemes.length > 0 ? <div className="scheme-grid">{schemes.map(scheme => {
      const category = categories.find(item => item.id === scheme.categoryId)
      const categoryLabel = category ? getCategoryLabel(category, language) : scheme.categoryId
      return <SchemeCard key={scheme.id} scheme={scheme} t={t} language={language} categoryLabel={categoryLabel}/>
    })}</div> : <div className="state-card empty-results"><span><BookOpen size={23}/></span><h2>{t.emptyTitle}</h2><p>{t.empty}</p>{hasFilters && <button type="button" className="button button-outline" onClick={() => setParams(new URLSearchParams(), { replace: true })}>{t.clearFilters}</button>}</div>}
  </main>
}
