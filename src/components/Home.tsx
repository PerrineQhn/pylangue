import { useEffect, useRef, useState } from 'react'
import { MODULES, TOTAL_LESSONS } from '@/data'
import { TIER_INFO } from '@/lib/types'
import type { Progress } from '@/lib/storage'
import { exportProgress, importProgress, persistent, encodeProgress, loadSyncCode, saveSyncCode } from '@/lib/storage'
import { syncDisponible } from '@/lib/syncConfig'
import { genererCode, synchroniser } from '@/lib/sync'

function CloudPanel({ progress, onProgress }: { progress: Progress; onProgress: (p: Progress) => void }) {
  const [code, setCode] = useState(() => loadSyncCode())
  const [saisie, setSaisie] = useState(() => loadSyncCode())
  const [statut, setStatut] = useState('')
  const [occupe, setOccupe] = useState(false)

  const lancer = async () => {
    const c = saisie.trim()
    if (!c) { setStatut('Saisis ou génère un code d\'abord.'); return }
    setOccupe(true)
    setStatut('Synchronisation…')
    try {
      const fusion = await synchroniser(c, progress)
      onProgress(fusion)
      saveSyncCode(c)
      setCode(c)
      setStatut(`✓ Synchronisé (${fusion.completedLessons.length} leçons, ${fusion.solvedExercises.length} exercices)`)
    } catch (e) {
      setStatut(`✗ ${(e as Error).message}`)
    }
    setOccupe(false)
  }

  const deconnecter = () => {
    saveSyncCode('')
    setCode('')
    setStatut('Synchronisation désactivée sur cet appareil.')
  }

  return (
    <div className="transfer-panel">
      <div className="transfer-title">Synchronisation cloud</div>
      <p className="transfer-help">
        Ta progression est sauvegardée en ligne sous un code personnel. Utilise le même code
        sur chaque appareil : les progressions se fusionnent à chaque synchronisation
        (automatique à l'ouverture, et quelques secondes après chaque exercice réussi).
        Ce code fait office de clé d'accès — garde-le pour toi.
      </p>
      <div className="transfer-link-zone">
        <input
          className="transfer-input"
          placeholder="ton-code-personnel"
          value={saisie}
          onChange={e => setSaisie(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => setSaisie(genererCode())} disabled={occupe}>
            Générer un code
          </button>
          <button className="btn btn-check" onClick={lancer} disabled={occupe}>
            {code ? 'Synchroniser maintenant' : 'Activer la synchronisation'}
          </button>
          {code && (
            <button className="btn btn-ghost" onClick={deconnecter} disabled={occupe}>
              Désactiver
            </button>
          )}
        </div>
        {statut && <div className="muted-text">{statut}</div>}
      </div>
    </div>
  )
}

declare global {
  interface Window { QRCode?: any }
}

function TransferPanel({ progress }: { progress: Progress }) {
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const lien = (() => {
    try {
      const base = window.location.href.split('#')[0]
      return `${base}#p=${encodeProgress(progress)}`
    } catch {
      return `#p=${encodeProgress(progress)}`
    }
  })()

  useEffect(() => {
    let annule = false
    const dessiner = () => {
      if (annule || !qrRef.current || !window.QRCode) return
      qrRef.current.innerHTML = ''
      try {
        new window.QRCode(qrRef.current, { text: lien, width: 148, height: 148, correctLevel: 0 })
      } catch { /* lien trop long pour un QR : le lien texte reste utilisable */ }
    }
    if (window.QRCode) {
      dessiner()
    } else {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
      s.onload = dessiner
      document.head.appendChild(s)
    }
    return () => { annule = true }
  }, [lien])

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lien)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback : sélectionner le champ
      const input = document.getElementById('transfer-link') as HTMLInputElement | null
      input?.select()
    }
  }

  return (
    <div className="transfer-panel">
      <div className="transfer-title">Transférer ma progression sur un autre appareil</div>
      <p className="transfer-help">
        Scanne ce QR code avec ton téléphone, ou copie le lien et ouvre-le sur l'autre appareil :
        ta progression y sera fusionnée automatiquement (rien n'est envoyé sur un serveur —
        tout est contenu dans le lien).
      </p>
      <div className="transfer-body">
        <div ref={qrRef} className="transfer-qr" />
        <div className="transfer-link-zone">
          <input id="transfer-link" className="transfer-input" readOnly value={lien} onFocus={e => e.target.select()} />
          <button className="btn btn-check" onClick={copier}>{copied ? '✓ Copié !' : 'Copier le lien'}</button>
        </div>
      </div>
    </div>
  )
}

export function Home({ progress, onNavigate, onProgress }: {
  progress: Progress
  onNavigate: (moduleId: string, lessonId: string) => void
  onProgress: (p: Progress) => void
}) {
  const done = progress.completedLessons.length
  const solved = progress.solvedExercises.length
  const pct = TOTAL_LESSONS ? Math.round((done / TOTAL_LESSONS) * 100) : 0
  const [showTransfer, setShowTransfer] = useState(false)
  const [showCloud, setShowCloud] = useState(false)

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
          <button className="link-btn" onClick={() => setShowTransfer(s => !s)}>
            {showTransfer ? 'masquer le transfert' : '📲 transférer sur un autre appareil'}
          </button> ·{' '}
          {syncDisponible() && (
            <>
              <button className="link-btn" onClick={() => setShowCloud(s => !s)}>
                {showCloud ? 'masquer la synchronisation' : '☁ synchronisation cloud'}
              </button> ·{' '}
            </>
          )}
          <button className="link-btn" onClick={doExport}>exporter</button> ·{' '}
          <button className="link-btn" onClick={doImport}>importer</button>
        </div>
        {showTransfer && <TransferPanel progress={progress} />}
        {showCloud && syncDisponible() && <CloudPanel progress={progress} onProgress={onProgress} />}
        <div className="muted-text">
          Le code Python s'exécute via Pyodide (WebAssembly) — première exécution : ~10 s de chargement, puis instantané.
        </div>
      </footer>
    </div>
  )
}
