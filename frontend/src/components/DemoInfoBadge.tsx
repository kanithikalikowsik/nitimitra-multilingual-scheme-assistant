import { BadgeInfo } from 'lucide-react'
import type { Copy } from '../lib/content'

export default function DemoInfoBadge({ t }: { t: Copy }) {
  return <span className="demo-tag"><BadgeInfo size={12}/>{t.demo}</span>
}
