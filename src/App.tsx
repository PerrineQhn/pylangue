import { useEffect, useRef, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Home } from '@/components/Home'
import { LessonView } from '@/components/LessonView'
import { MODULES, moduleById } from '@/data'
import { loadProgress, saveProgress, loadTheme, saveTheme, decodeProgress, mergeProgress, loadSyncCode, type Progress } from '@/lib/storage'
import { syncDisponible } from '@/lib/syncConfig'
import { synchroniser, pousser } from '@/lib/sync'
import './index.css'

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [current, setCurrent] = useState<{ moduleId: string; lessonId: string } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => loadTheme())
  const [toast, setToast] = useState<string | null>(null)

  // Import automatique d'une progression transférée via l'URL (#p=...)
  useEffect(() => {
    try {
      const m = window.location.hash.match(/^#p=(.+)$/)
      if (m) {
        const importe = decodeProgress(m[1])
        if (importe) {
          setProgress(prev => mergeProgress(prev, importe))
          setToast('✓ Progression importée et fusionnée sur cet appareil')
          setTimeout(() => setToast(null), 6000)
        }
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    } catch { /* environnements restreints : on ignore */ }
  }, [])

  // Synchronisation cloud automatique à l'ouverture (si configurée + code enregistré)
  useEffect(() => {
    const code = loadSyncCode()
    if (!syncDisponible() || !code) return
    synchroniser(code, loadProgress())
      .then(fusion => {
        setProgress(prev => mergeProgress(prev, fusion))
        setToast('☁ Progression synchronisée')
        setTimeout(() => setToast(null), 4000)
      })
      .catch(() => { /* hors ligne : la version locale fait foi */ })
  }, [])

  // Sauvegarde locale + poussée cloud débouncée après chaque changement
  const syncTimer = useRef<number | null>(null)
  useEffect(() => {
    saveProgress(progress)
    const code = loadSyncCode()
    if (syncDisponible() && code) {
      if (syncTimer.current !== null) window.clearTimeout(syncTimer.current)
      syncTimer.current = window.setTimeout(() => {
        pousser(code, progress).catch(() => { /* réessaiera au prochain changement */ })
      }, 3000)
    }
  }, [progress])
  useEffect(() => { window.scrollTo(0, 0) }, [current])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    saveTheme(theme)
  }, [theme])

  const navigate = (moduleId: string, lessonId: string) => setCurrent({ moduleId, lessonId })

  const mod = current ? moduleById(current.moduleId) : null
  const lesson = mod?.lessons.find(l => l.id === current?.lessonId) ?? null

  // Leçon suivante (dans le module, sinon premier module "ready" suivant)
  let next: { moduleId: string; lessonId: string; title: string } | null = null
  if (mod && lesson) {
    const idx = mod.lessons.indexOf(lesson)
    if (idx < mod.lessons.length - 1) {
      const nl = mod.lessons[idx + 1]
      next = { moduleId: mod.id, lessonId: nl.id, title: nl.title }
    } else {
      const mi = MODULES.indexOf(mod)
      const nextMod = MODULES.slice(mi + 1).find(m => m.status === 'ready')
      if (nextMod) next = { moduleId: nextMod.id, lessonId: nextMod.lessons[0].id, title: nextMod.lessons[0].title }
    }
  }

  return (
    <div className="app">
      {!sidebarOpen && (
        <button className="menu-btn" aria-label="Ouvrir le sommaire" onClick={() => setSidebarOpen(true)}>☰</button>
      )}
      <button
        className="theme-btn"
        title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>
      <Sidebar
        current={current}
        onNavigate={navigate}
        onHome={() => { setCurrent(null); setSidebarOpen(false) }}
        progress={progress}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {toast && <div className="toast">{toast}</div>}
      <main className="main">
        {mod && lesson ? (
          <LessonView
            module={mod}
            lesson={lesson}
            progress={progress}
            onProgress={setProgress}
            onNavigate={navigate}
            nextLesson={next}
          />
        ) : (
          <Home progress={progress} onNavigate={navigate} onProgress={setProgress} />
        )}
      </main>
    </div>
  )
}
