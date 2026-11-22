import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, Bot, CheckCircle2, LoaderCircle, MessageCircle, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import type { Copy, Language } from '../lib/content'
import { clearAssistantSession, readAssistantSession, writeAssistantSession, type AssistantSessionMessage } from '../lib/assistantSession'
import { askAssistant, SchemeApiError } from '../services/schemeService'
import type { AssistantChatStatus, AssistantHistoryItem, AssistantSourceReference } from '../types'

type Message = AssistantSessionMessage

function sessionStorageOrNull(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.sessionStorage } catch { return null }
}

function evidenceLabel(section: string, t: Copy): string {
  const labels: Record<string, string> = {
    summary: t.assistantSummary,
    overview: t.overview,
    benefits: t.benefits,
    eligibility_conditions: t.eligibility,
    documents_listed: t.documents,
    application_steps: t.application,
  }
  return labels[section] || section
}

function sourceStatus(source: AssistantSourceReference, t: Copy): string {
  if (source.verification_status === 'verified') return t.assistantSourceVerified
  if (source.verification_status === 'pending') return t.assistantSourcePending
  return t.assistantSourceUnverified
}

function SourceReferences({ sources, t }: { sources: AssistantSourceReference[]; t: Copy }) {
  if (!sources.length) return null
  return <div className="assistant-citations">
    <strong>{t.assistantSources}</strong>
    {sources.map((source, index) => <article className="assistant-citation" key={`${source.scheme_name}-${source.source_name}-${index}`}>
      <b>{source.scheme_name}</b>
      <span>{source.source_name}</span>
      <small className={`assistant-source-status ${source.verification_status}`}>{sourceStatus(source, t)}</small>
      {source.source_url && source.verification_status === 'verified' && <a href={source.source_url} target="_blank" rel="noopener noreferrer">{t.openOfficialSource}</a>}
      {source.last_verified_at && <small>{t.assistantLastVerified}: {source.last_verified_at.slice(0, 10)}</small>}
      {source.evidence_sections.length > 0 && <small>{t.assistantEvidence}: {source.evidence_sections.map(section => evidenceLabel(section, t)).join(', ')}</small>}
    </article>)}
  </div>
}

export default function AssistantPage({ t, language }: { t: Copy; language: Language }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>(() => { const storage = sessionStorageOrNull(); return storage ? readAssistantSession(storage) : [] })
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)
  const chatBodyRef = useRef<HTMLDivElement>(null)
  const lastSources = useMemo(() => [...messages].reverse().find(message => message.kind === 'assistant' && message.sources?.length)?.sources || [], [messages])

  useEffect(() => {
    const chatBody = chatBodyRef.current
    if (chatBody) chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])
  useEffect(() => { const storage = sessionStorageOrNull(); if (storage) messages.length ? writeAssistantSession(storage, messages) : clearAssistantSession(storage) }, [messages])

  const submit = (text: string, history: AssistantHistoryItem[], appendUser: boolean) => {
    if (submittingRef.current || !text.trim()) return
    submittingRef.current = true
    const prompt = text.trim()
    setLoading(true)
    if (appendUser) {
      setMessages(current => [...current, { id: `${Date.now()}-user`, text: prompt, kind: 'user' }])
      setInput('')
    }
    void askAssistant(prompt, language, history).then(result => {
      const retry = result.status === 'error' ? { text: prompt, history } : undefined
      setMessages(current => [...current, { id: `${Date.now()}-assistant`, text: result.answer, kind: 'assistant', status: result.status, sources: result.sources, retry }])
    }).catch((reason: unknown) => {
      const message = reason instanceof SchemeApiError && reason.status === 422
        ? /1,?500/.test(reason.message) ? t.assistantLimit : /blank|empty/i.test(reason.message) ? t.assistantEmptyQuestion : t.assistantRequestError
        : t.assistantRequestError
      setMessages(current => [...current, { id: `${Date.now()}-assistant-error`, text: message, kind: 'assistant', status: 'error', retry: { text: prompt, history } }])
    }).finally(() => { submittingRef.current = false; setLoading(false) })
  }

  const send = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const history = messages.filter(message => message.status !== 'error').slice(-8).map(message => ({
      role: message.kind === 'user' ? 'user' as const : 'assistant' as const,
      content: message.text.slice(0, 1200),
    }))
    submit(input, history, true)
  }

  const statusLabel = (status?: AssistantChatStatus, hasVerifiedSources = false) => {
    if (status === 'answered') return hasVerifiedSources ? t.assistantStatusAnswered : t.assistantStatusGeneral
    if (status === 'unverified') return t.assistantStatusUnverified
    if (status === 'not_found') return t.assistantStatusNotFound
    if (status === 'unavailable') return t.assistantStatusUnavailable
    if (status === 'error') return t.assistantStatusError
    return ''
  }

  return <main className="page-main section assistant-page">
    <div className="page-heading"><div className="eyebrow muted-eyebrow">{t.assistantEyebrow}</div><h1>{t.assistantPageTitle}</h1><p>{t.assistantIntro}</p></div>
    <div className="assistant-layout">
      <section className="chat-panel" aria-label={t.assistantPageTitle}>
        <div className="chat-head"><span className="chat-head-icon"><Bot size={20}/></span><span><strong>NitiMitra</strong><small><i/>{t.verifiedOnly}</small></span><button className="chat-clear" type="button" onClick={() => { const storage = sessionStorageOrNull(); if (storage) clearAssistantSession(storage); setMessages([]) }} disabled={loading || messages.length === 0}><Trash2 size={15}/>{t.assistantClear}</button></div>
        <div className="chat-notice"><ShieldCheck size={18}/><p>{t.assistantNotice}<br/><span>{t.assistantPrivacyNote}</span></p></div>
        <div className="chat-body" ref={chatBodyRef} aria-live="polite" aria-relevant="additions text">
          {messages.length === 0 ? <div className="chat-welcome"><span className="welcome-icon"><Sparkles size={21}/></span><h2>{t.welcomeTitle}</h2><p>{t.welcomeText}</p></div> : messages.map(message => <div key={message.id} className={`message-row ${message.kind}`}>
            <span className="message-avatar">{message.kind === 'user' ? <MessageCircle size={15}/> : <Bot size={16}/>}</span>
            <div className="message-bubble" role={message.status === 'error' ? 'alert' : undefined}><small>{message.kind === 'user' ? t.userQuestion : t.assistantReplyLabel}</small>
              {message.status && <span className={`assistant-response-status ${message.status}`}>{statusLabel(message.status, Boolean(message.sources?.length))}</span>}
              <p>{message.text}</p>
              {message.kind === 'assistant' && <SourceReferences sources={message.sources || []} t={t}/>}
              {message.retry && <button className="assistant-retry" type="button" disabled={loading} onClick={() => submit(message.retry!.text, message.retry!.history, false)}><LoaderCircle size={14}/>{t.assistantRetry}</button>}
              {message.kind === 'assistant' && message.status === 'not_found' && <Link to="/schemes">{t.browseSchemeInformation}</Link>}
            </div>
          </div>)}
          {loading && <div className="assistant-loading" role="status"><LoaderCircle className="assistant-spinner" size={16}/><span>{t.assistantLoading}</span></div>}
        </div>
        <div className="suggestions"><span>{t.suggestionsTitle}</span><div>{t.suggestions.map(question => <button type="button" key={question} disabled={loading} onClick={() => setInput(question)}>{question}</button>)}</div></div>
        <form className="chat-compose" onSubmit={send}><label className="sr-only" htmlFor="chat-input">{t.chatPlaceholder}</label><input id="chat-input" value={input} onChange={event => setInput(event.target.value)} placeholder={t.chatPlaceholder} maxLength={1500} aria-describedby="assistant-char-count"/><span id="assistant-char-count" className="chat-char-count">{input.length}/1500</span><button type="submit" aria-label={t.send} disabled={!input.trim() || loading}><ArrowUp size={18}/></button></form>
      </section>
      <aside className="sources-panel"><span className="sources-heading-icon"><ShieldCheck size={19}/></span><div className="eyebrow muted-eyebrow">{t.sourcesTitle}</div><h2>{t.groundedInSources}</h2><p>{t.sourceNote}</p>
        {lastSources.length ? <div className="assistant-source-list"><SourceReferences sources={lastSources} t={t}/></div> : <div className="no-sources"><span><CheckCircle2 size={17}/></span><p>{t.assistantNoReliableSources}</p></div>}
        <div className="sources-foot"><ShieldCheck size={16}/>{t.sourcePromise}</div>
      </aside>
    </div>
  </main>
}
