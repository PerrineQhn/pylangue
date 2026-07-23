import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Home } from '@/components/Home'
import { LessonView } from '@/components/LessonView'
import { MODULES, moduleById } from '@/data'
import { loadProgress, saveProgress, loadTheme, saveTheme, type Progress } from '@/lib/storage'
import './index.css'

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [current, setCurrent] = useState<{ moduleId: string; lessonId: string } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => loadTheme())

  useEffect(() => { saveProgress(progress) }, [progress])
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
      <button className="menu-btn" onClick={() => setSidebarOpen(o => !o)}>☰ Sommaire</button>
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
