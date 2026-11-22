import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, Menu, ShieldCheck, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router'
import type { Copy, Language } from '../lib/content'

export default function SiteShell({ children, language, setLanguage, t }: { children: ReactNode; language: Language; setLanguage: (language: Language) => void; t: Copy }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setMenuOpen(false), [location.pathname])
  const nav = [['/', t.navHome], ['/schemes', t.navExplore], ['/eligibility', t.navEligibility], ['/assistant', t.navAssistant]]
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">{t.skipContent}</a>
    <header className="site-header"><div className="nav-wrap">
      <Link to="/" className="brand" aria-label={t.brandHome}><span className="brand-mark"><ShieldCheck size={23}/></span><span className="brand-copy"><strong>NitiMitra</strong><small>{t.brandDescriptor}</small></span></Link>
      <nav className={menuOpen ? 'nav-links open' : 'nav-links'} aria-label={t.mainNavigation}>{nav.map(([to, label]) => <NavLink end={to === '/'} to={to} key={to} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}</nav>
      <div className="nav-actions"><label className="language-picker"><span className="sr-only">{t.language}</span><select value={language} onChange={e => setLanguage(e.target.value as Language)} aria-label={t.language}><option value="en">English</option><option value="te">తెలుగు</option><option value="hi">हिन्दी</option></select></label><Link to="/schemes" className="button button-small nav-cta">{t.exploreCta}<ArrowRight size={15}/></Link><button className="menu-toggle" type="button" onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? t.closeNavigation : t.openNavigation} aria-expanded={menuOpen}>{menuOpen ? <X/> : <Menu/>}</button></div>
    </div></header>
    <div id="main-content" tabIndex={-1}>{children}</div>
    <footer className="site-footer"><div className="footer-inner"><Link to="/" className="brand footer-brand" aria-label={t.brandHome}><span className="brand-mark"><ShieldCheck size={21}/></span><span className="brand-copy"><strong>NitiMitra</strong><small>{t.brandDescriptor}</small></span></Link><p>{t.footer}</p><nav aria-label={t.footerNavigation}><Link to="/schemes">{t.navExplore}</Link><Link to="/eligibility">{t.navEligibility}</Link><Link to="/assistant">{t.navAssistant}</Link></nav></div><div className="footer-bottom"><span>{t.copyright}</span><span>{t.disclaimer}</span></div></footer>
  </div>
}
