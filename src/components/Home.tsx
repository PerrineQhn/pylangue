import { MODULES, TOTAL_LESSONS } from '@/data'
import { TIER_INFO } from '@/lib/types'
import type { Progress } from '@/lib/storage'
import { exportProgress, importProgress, persistent } from '@/lib/storage'

export function Home({ progress, onNavigate, onProgress }: {
  progress: Progress
  onNavigate: (moduleId: string, lessonId: string) => void
  onProgress: (p: Progress) => void
}) {
  const done = progress.completedLessons.length
  const solved = progress.solvedExercises.length
  const pct = TOTAL_LESSONS ? Math.round((done / TOTAL_LESSONS) * 100) : 0

  // Reprendre : première leçon non terminée
  let resume: { moduleId: string; lessonId: string; title: string } | null = null
  outer: for (const m of MODULES) {
    for (const l of m.lessons) {
      if (!progress.completedLessons.includes(l.id)) {
        resume = { moduleId: m.id, lessonId: l.id, title: l.title }
        break outer
      }
    }
  }

  const doExport = () => {
    const blob = new Blob([exportProgress(progress)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'pylangue-progression.json'
    a.click()
  }

  const doImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const f = input.files?.[0]
      if (!f) return
      const p = importProgress(await f.text())
      if (p) onProgress(p)
    }
    input.click()
  }

  return (
    <div className="home">
      <header className="home-hero">
        <h1>Apprendre Python <em>par</em> le NLP et les LLM</h1>
        <p className="home-lede">
          Un parcours progressif où chaque concept Python est enseigné à travers un vrai problème
          du traitement du langage : de la première chaîne de caractères jusqu'à l'implémentation
          de l'attention et aux patterns professionnels des API LLM. Tout le code s'exécute
          directement ici, dans ton navigateur.
        </p>
        <div className="home-stats">
          <div className="stat"><span className="stat-num">{done}</span> / {TOTAL_LESSONS} leçons terminées</div>
          <div className="stat"><span className="stat-num">{solved}</span> exercices réussis</div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        </div>
        {resume && (
          <button className="btn btn-run btn-big" onClick={() => onNavigate(resume!.moduleId, resume!.lessonId)}>
            {done === 0 ? 'Commencer le parcours' : `Reprendre : ${resume.title}`} →
          </button>
        )}
      </header>

      {( [1, 2, 3] as const ).map(t => (
        <section key={t} className="home-tier">
          <h2 className={`tier-text-${t}`}>Palier {t} — {TIER_INFO[t].name}</h2>
          <div className="module-grid">
            {MODULES.filter(m => m.tier === t).map(m => {
              const mDone = m.lessons.filter(l => progress.completedLessons.includes(l.id)).length
              return (
                <div key={m.id} className={`module-card ${m.status === 'outline' ? 'card-outline' : ''}`}>
                  <div className="module-card-title">{m.title}</div>
                  <p className="module-card-tagline">{m.tagline}</p>
                  {m.status === 'ready' ? (
                    <>
                      <div className="module-card-meta">{mDone}/{m.lessons.length} leçons</div>
                      <button className="btn btn-run" onClick={() => onNavigate(m.id, m.lessons[0].id)}>
                        {mDone === 0 ? 'Commencer' : mDone === m.lessons.length ? 'Revoir' : 'Continuer'}
                      </button>
                    </>
                  ) : (
                    <ul className="outline-list">
                      {m.outline?.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}

      <footer className="home-footer">
        <div>
          Progression {persistent ? 'sauvegardée dans ce navigateur' : 'en mémoire (session uniquement)'} ·{' '}
          <button className="link-btn" onClick={doExport}>exporter</button> ·{' '}
          <button className="link-btn" onClick={doImport}>importer</button>
        </div>
        <div className="muted-text">
          Le code Python s'exécute via Pyodide (WebAssembly) — première exécution : ~10 s de chargement, puis instantané.
        </div>
      </footer>
    </div>
  )
}
