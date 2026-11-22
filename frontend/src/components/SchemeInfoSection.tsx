import type { ReactNode } from 'react'

export default function SchemeInfoSection({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`detail-panel ${className}`}><div className="panel-title"><span>{icon}</span><h2>{title}</h2></div>{children}</section>
}
