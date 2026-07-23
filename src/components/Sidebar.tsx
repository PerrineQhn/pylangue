import { MODULES } from '@/data'
import { TIER_INFO } from '@/lib/types'
import type { Progress } from '@/lib/storage'

export function Sidebar({ current, onNavigate, onHome, progress, open, onClose }: {
  current: { moduleId: string; lessonId: string } | null
  onNavigate: (moduleId: string, lessonId: string) => void
  onHome: () => void
  progress: Progress
  open: boolean
  onClose: () => void
}) {
  const tiers = [1, 2, 3] as const
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <nav className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <button className="sidebar-close" aria-label="Fermer le sommaire" onClick={onClose}>✕</button>
        <button className="sidebar-title" onClick={onHome}>
          <span className="logo-mark">{"</>"}</span>
          <span>
            <span className="logo-name">PyLangue</span>
            <span className="logo-sub">Python pour le NLP & les LLM</span>
          </span>
        </button>
        {tiers.map(t => (
          <div key={t} className="sidebar-tier">
            <div className={`sidebar-tier-name tier-text-${t}`}>Palier {t} — {TIER_INFO[t].name}</div>
            {MODULES.filter(m => m.tier === t).map(m => (
              <div key={m.id} className="sidebar-module">
                <div className="sidebar-module-title">
                  {m.title}
                  {m.status === 'outline' && <span className="soon-tag">à venir</span>}
                </div>
                {m.lessons.map(l => {
                  const active = current?.lessonId === l.id
                  const done = progress.completedLessons.includes(l.id)
                  return (
                    <button
                      key={l.id}
                      className={`sidebar-lesson ${active ? 'active' : ''}`}
                      onClick={() => { onNavigate(m.id, l.id); onClose() }}
                    >
                      <span className={`lesson-dot ${done ? 'dot-done' : ''}`}>{done ? '✓' : ''}</span>
                      {l.title}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </nav>
    </>
  )
}
