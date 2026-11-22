import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ClipboardCheck, ShieldAlert } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { type Copy, type Language } from '../lib/content'
import { checkSchemeEligibility, getEligibilityQuestionnaire, listSchemes, SchemeApiError } from '../services/schemeService'
import type { EligibilityCheck, EligibilityQuestionnaire, SchemeRecord } from '../types'

function QuestionPrompt({ question, value, onChange, chooseLabel }: { question: EligibilityQuestionnaire['questions'][number]; value: string; onChange: (value: string) => void; chooseLabel: string }) {
  return <div className="eligibility-question"><label className="field-label" htmlFor={`answer-${question.field}`}>{question.label}</label>{question.type === 'select' ? <select id={`answer-${question.field}`} className="eligibility-scheme-select" value={value} onChange={event => onChange(event.target.value)}><option value="">{chooseLabel}</option>{question.options.map(option => <option key={String(option)} value={option}>{String(option)}</option>)}</select> : <input id={`answer-${question.field}`} className="eligibility-answer" type={question.type === 'number' ? 'number' : 'text'} min={question.type === 'number' ? 0 : undefined} value={value} onChange={event => onChange(event.target.value)}/>}</div>
}

export default function EligibilityPage({ t, language }: { t: Copy; language: Language }) {
  const [params, setParams] = useSearchParams()
  const [schemes, setSchemes] = useState<SchemeRecord[]>([])
  const [slug, setSlug] = useState(params.get('scheme') || '')
  const [questionnaire, setQuestionnaire] = useState<EligibilityQuestionnaire | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({})
  const [result, setResult] = useState<EligibilityCheck | null>(null)
  const [completedDocuments, setCompletedDocuments] = useState<string[]>([])
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [questionnaireLoading, setQuestionnaireLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(false)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    listSchemes({}, controller.signal).then(rows => {
      setSchemes(rows)
      if (!params.get('scheme') && rows.length && !slug) setSlug(rows[0].id)
      setLoading(false)
    }).catch(reason => { if (!(reason instanceof DOMException && reason.name === 'AbortError')) { setError(true); setLoading(false) } })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!slug) { setQuestionnaire(null); setQuestionnaireLoading(false); setParams(current => { const next = new URLSearchParams(current); next.delete('scheme'); return next }, { replace: true }); return }
    const controller = new AbortController()
    setQuestionnaire(null); setQuestionnaireLoading(true); setResult(null); setAnswers({}); setStep(0); setValidationError('')
    setParams(current => { const next = new URLSearchParams(current); next.set('scheme', slug); return next }, { replace: true })
    getEligibilityQuestionnaire(slug, controller.signal).then(setQuestionnaire).catch(reason => {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError(true)
    }).finally(() => {
      if (!controller.signal.aborted) setQuestionnaireLoading(false)
    })
    return () => controller.abort()
  }, [slug, setParams])

  const questions = useMemo(() => [...new Map((questionnaire?.questions || []).map(question => [question.field, question])).values()], [questionnaire])
  const activeQuestion = questions[step]
  const canAnswer = (question: EligibilityQuestionnaire['questions'][number], raw: string | number | boolean) => {
    if (typeof raw === 'string' && !raw.trim()) return false
    if (question.type === 'number' && (typeof raw !== 'number' || !Number.isFinite(raw))) return false
    return true
  }
  const updateAnswer = (field: string, type: string, value: string) => setAnswers(current => ({ ...current, [field]: type === 'number' && value !== '' ? Number(value) : value }))
  const runCheck = async () => {
    if (!slug) return
    setChecking(true); setValidationError('')
    try { setResult(await checkSchemeEligibility(slug, answers)); setCompletedDocuments([]) }
    catch (reason) { setValidationError(reason instanceof SchemeApiError && reason.status === 422 ? t.answerInvalid : t.eligibilityApiError) }
    finally { setChecking(false) }
  }
  const advance = () => {
    if (step < questions.length) {
      const question = questions[step]
      const answer = answers[question.field]
      if (answer === undefined || !canAnswer(question, answer)) { setValidationError(question.type === 'number' && answer !== undefined ? t.invalidNumber : t.answerRequired); return }
    }
    setValidationError('')
    if (step < questions.length) setStep(step + 1)
    else void runCheck()
  }
  const resultLabel = result?.overall_status === 'appears_eligible' ? t.resultEligible : result?.overall_status === 'appears_not_eligible' ? t.resultNotEligible : result?.overall_status === 'insufficient_information' ? t.resultInsufficient : t.resultUnknown
  const statusLabel = (status: string) => status === 'met' ? t.conditionMet : status === 'not_met' ? t.conditionNotMet : status === 'needs_more_information' ? t.conditionNeedsInfo : t.conditionUnverified
  const explanationLabel = (key?: string | null, fallback?: string) => ({ rule_unverified: t.ruleUnverifiedExplanation, demo_rule: t.demoRuleExplanation, answer_missing: t.answerMissingExplanation, answer_matches: t.answerMatchesExplanation, answer_does_not_match: t.answerDoesNotMatchExplanation, document_requirement_unknown: t.documentUnknown } as Record<string, string>)[key || ''] || fallback

  return <main className="page-main section eligibility-page">
    <div className="page-heading"><div className="eyebrow muted-eyebrow">{t.eligibilityEyebrow}</div><h1>{t.eligibilityTitle}</h1><p>{t.eligibilityIntro}</p></div>
    <div className="eligibility-layout">
      <aside className="eligibility-aside"><span className="eligibility-aside-icon"><ClipboardCheck size={22}/></span><h2>{t.transparentCheck}</h2><p>{t.transparentCheckText}</p><div className="aside-rule"/><span className="aside-note"><ShieldAlert size={16}/>{t.resultDisclaimer}</span></aside>
      <section className="eligibility-panel" aria-live="polite">
        {loading ? <div className="state-card" role="status"><p>{t.loading}</p></div> : error && !questionnaire ? <div className="state-card error-state" role="alert"><h2>{t.error}</h2><p>{t.eligibilityApiError}</p><Link className="button button-outline" to="/schemes">{t.exploreCta}</Link></div> : <>
          <label className="field-label" htmlFor="eligibility-scheme">{t.selectScheme}</label>
          <select id="eligibility-scheme" className="eligibility-scheme-select" value={slug} onChange={event => { setSlug(event.target.value); setError(false) }}>
            <option value="">{t.chooseScheme}</option>{schemes.map(scheme => <option key={scheme.id} value={scheme.id}>{scheme.name[language] || scheme.name.en}</option>)}
          </select>
          {!schemes.length && !error && <p>{t.noSchemes}</p>}
          {questionnaireLoading && <div className="state-card" role="status"><p>{t.loading}</p></div>}
          {questionnaire && !result && <>
            {language !== 'en' && questions.length > 0 && <p className="notice-text">{t.originalSchemeContent}</p>}
            {questions.length > 0 ? <>
              <div className="progress-meta"><span>{t.questionProgress} {Math.min(step + 1, questions.length)} {t.of} {questions.length}</span><span>{Math.round((step / questions.length) * 100)}%</span></div><div className="progress-track"><span style={{ width: `${(step / questions.length) * 100}%` }}/></div>
              {step < questions.length && activeQuestion ? <QuestionPrompt question={activeQuestion} value={answers[activeQuestion.field] === undefined ? '' : String(answers[activeQuestion.field])} chooseLabel={t.chooseCategory} onChange={value => updateAnswer(activeQuestion.field, activeQuestion.type, value)}/> : <div className="eligibility-question"><h2>{t.reviewAnswers}</h2>{questions.map(question => <p key={question.field}><strong>{question.label}</strong>: {answers[question.field]}</p>)}</div>}
              {questionnaire.is_demo && <p className="notice-text">{t.demoEligibility}</p>}
              {validationError && <p className="field-error" role="alert">{validationError}</p>}
              <div className="step-actions">{step > 0 && <button className="button button-light" type="button" onClick={() => setStep(step - 1)}><ArrowLeft size={15}/>{t.previous}</button>}<button className="button" type="button" disabled={checking} onClick={advance}>{checking ? t.checkingEligibility : step === questions.length ? t.evaluateEligibility : t.continue}<ArrowRight size={15}/></button></div>
            </> : <div className="state-card"><p>{questionnaire.is_demo ? t.demoEligibility : t.noQuestions}</p><button className="button" type="button" disabled={checking} onClick={() => void runCheck()}>{checking ? t.checkingEligibility : t.evaluateEligibility}</button></div>}
          </>}
          {result && <div className="eligibility-result"><span className="eyebrow muted-eyebrow">{result.is_demo ? t.demo : t.preliminary}</span><h2>{resultLabel}</h2><p>{t.resultDisclaimer}</p>{result.is_demo && <p>{t.demoEligibility}</p>}
            {language !== 'en' && result.conditions.length > 0 && <p className="notice-text">{t.originalSchemeContent}</p>}
            <h3>{t.conditionResults}</h3><div className="condition-results">{result.conditions.map(condition => <article className="condition-result" key={condition.rule_id}><div><strong>{condition.description}</strong><span className={`condition-status ${condition.status}`}>{statusLabel(condition.status)}</span></div><p>{explanationLabel(condition.explanation_key, condition.explanation)}</p>{condition.answer !== null && <p><b>{t.yourAnswer}:</b> {String(condition.answer)}</p>}{condition.source_name && <p className="condition-source">{t.sourceReference}: {condition.source_url ? <a href={condition.source_url} target="_blank" rel="noreferrer">{condition.source_name}</a> : condition.source_name}</p>}</article>)}</div>
            <h3>{t.documentChecklist}</h3>{result.documents.length ? <ul className="document-checklist eligibility-documents">{result.documents.map(document => <li key={document.name}><label><input type="checkbox" checked={completedDocuments.includes(document.name)} onChange={event => setCompletedDocuments(current => event.target.checked ? [...current, document.name] : current.filter(name => name !== document.name))}/><span><b>{document.name}</b> · {document.requirement === 'unknown' ? t.unknown : document.requirement === 'required' ? t.required : t.optional}<small>{explanationLabel(document.explanation_key, document.explanation)}</small></span></label></li>)}</ul> : <p>{t.noSources}</p>}
            <div className="step-actions"><button className="button button-light" type="button" onClick={() => { setResult(null); setStep(0) }}>{t.editAnswers}</button><button className="button button-outline" type="button" onClick={() => { setSlug(''); setResult(null); setAnswers({}); setStep(0) }}>{t.restartCheck}</button></div>
          </div>}
        </>}
      </section>
    </div>
  </main>
}
