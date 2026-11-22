import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import SiteShell from './components/SiteShell'
import RouteScrollRestoration from './components/RouteScrollRestoration'
import AssistantPage from './pages/AssistantPage'
import EligibilityPage from './pages/EligibilityPage'
import HomePage from './pages/HomePage'
import SchemeDetailPage from './pages/SchemeDetailPage'
import SchemeExplorerPage from './pages/SchemeExplorerPage'
import { copy, type Language } from './lib/content'
import { persistLanguage, readLanguage } from './lib/language'

function Application() {
  const [language, setLanguage] = useState<Language>(() => readLanguage(window.localStorage))
  useEffect(() => { document.documentElement.lang = language; document.documentElement.dataset.language = language; document.title = copy[language].pageTitle; persistLanguage(window.localStorage, language) }, [language])
  const t = copy[language]
  return <>
    <RouteScrollRestoration />
    <SiteShell language={language} setLanguage={setLanguage} t={t}>
    <Routes>
      <Route path="/" element={<HomePage t={t} language={language}/>} />
      <Route path="/schemes" element={<SchemeExplorerPage t={t} language={language}/>} />
      <Route path="/schemes/:id" element={<SchemeDetailPage t={t} language={language}/>} />
      <Route path="/eligibility" element={<EligibilityPage t={t} language={language}/>} />
      <Route path="/assistant" element={<AssistantPage t={t} language={language}/>} />
      <Route path="*" element={<Navigate to="/" replace/>} />
    </Routes>
    </SiteShell>
  </>
}

export default function App() { return <BrowserRouter><Application/></BrowserRouter> }
