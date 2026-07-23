// Persistance tolérante : localStorage si dispo (fichier local), sinon mémoire.
const KEY = 'pylearn-nlp-progress-v1'

export interface Progress {
  completedLessons: string[]
  solvedExercises: string[]
  quizScores: Record<string, number>
}

const empty: Progress = { completedLessons: [], solvedExercises: [], quizScores: {} }
let memory: Progress = { ...empty }

function storageAvailable(): boolean {
  try {
    const t = '__t__'
    window.localStorage.setItem(t, t)
    window.localStorage.removeItem(t)
    return true
  } catch {
    return false
  }
}

const hasLS = typeof window !== 'undefined' && storageAvailable()

export function loadProgress(): Progress {
  if (hasLS) {
    try {
      const raw = window.localStorage.getItem(KEY)
      if (raw) return { ...empty, ...JSON.parse(raw) }
    } catch { /* ignore */ }
  }
  return memory
}

export function saveProgress(p: Progress) {
  memory = p
  if (hasLS) {
    try { window.localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ }
  }
}

export function exportProgress(p: Progress): string {
  return JSON.stringify(p, null, 2)
}

export function importProgress(json: string): Progress | null {
  try {
    const p = JSON.parse(json)
    if (Array.isArray(p.completedLessons)) return { ...empty, ...p }
  } catch { /* ignore */ }
  return null
}

export const persistent = hasLS

// --- Thème ---
const THEME_KEY = 'pylangue-theme'
let themeMemory: 'dark' | 'light' = 'dark'

export function loadTheme(): 'dark' | 'light' {
  if (hasLS) {
    try {
      const t = window.localStorage.getItem(THEME_KEY)
      if (t === 'light' || t === 'dark') return t
    } catch { /* ignore */ }
  }
  return themeMemory
}

export function saveTheme(t: 'dark' | 'light') {
  themeMemory = t
  if (hasLS) {
    try { window.localStorage.setItem(THEME_KEY, t) } catch { /* ignore */ }
  }
}
