import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router'
import type { Copy, Language } from '../lib/content'
import type { SchemeRecord } from '../types'
import DemoInfoBadge from './DemoInfoBadge'

export default function SchemeCard({ scheme, t, language, categoryLabel }: { scheme: SchemeRecord; t: Copy; language: Language; categoryLabel: string }) {
  const text = (value: SchemeRecord['name']) => value[language] || value.en
  return <article className="scheme-card"><div className="scheme-card-top"><span className="category-chip">{categoryLabel}</span>{scheme.isDemo && <DemoInfoBadge t={t}/>}</div><h2>{text(scheme.name)}</h2><p className="scheme-description">{text(scheme.shortDescription)}</p>{language !== 'en' && !scheme.shortDescription[language] && <p className="scheme-language-note">{t.sourceLanguage}</p>}<div className="benefit-summary"><span><CheckCircle2 size={15}/>{t.benefitsSummary}</span><p>{text(scheme.benefitsSummary)}</p></div><Link className="card-link" to={`/schemes/${scheme.id}`}>{t.viewDetails}<ArrowRight size={15}/></Link></article>
}
