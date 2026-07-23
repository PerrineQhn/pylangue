import { useCallback, useRef, useState } from 'react'

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<any>
    __pyodidePromise?: Promise<any>
  }
}

const CDNS = [
  'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
  'https://cdnjs.cloudflare.com/ajax/libs/pyodide/0.26.2/',
]

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Échec de chargement : ${src}`))
    document.head.appendChild(s)
  })
}

async function bootPyodide(onStatus: (s: string) => void): Promise<any> {
  let lastErr: Error | null = null
  for (const base of CDNS) {
    try {
      onStatus('Chargement du moteur Python…')
      if (!window.loadPyodide) await injectScript(base + 'pyodide.js')
      onStatus('Initialisation de Python (WebAssembly)…')
      const py = await window.loadPyodide!({ indexURL: base })
      return py
    } catch (e) {
      lastErr = e as Error
    }
  }
  throw lastErr ?? new Error('Impossible de charger Pyodide')
}

export type RunResult = { ok: boolean; stdout: string; error: string | null }

export function usePyodide() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const numpyLoaded = useRef(false)

  const getPyodide = useCallback(async (): Promise<any> => {
    if (!window.__pyodidePromise) {
      setStatus('loading')
      window.__pyodidePromise = bootPyodide(setStatusMsg)
    }
    try {
      const py = await window.__pyodidePromise
      setStatus('ready')
      return py
    } catch (e) {
      setStatus('error')
      setStatusMsg((e as Error).message)
      throw e
    }
  }, [])

  const run = useCallback(async (code: string, opts?: { needsNumpy?: boolean }): Promise<RunResult> => {
    const py = await getPyodide()
    // Filet de sécurité explicite (drapeau posé dans le contenu)…
    if (opts?.needsNumpy && !numpyLoaded.current) {
      setStatusMsg('Chargement de numpy…')
      await py.loadPackage('numpy')
      numpyLoaded.current = true
      setStatusMsg('')
    }
    // …ET détection automatique : Pyodide scanne les imports du code
    // et charge les paquets de sa distribution qui manquent (numpy, etc.).
    try {
      setStatusMsg('Vérification des dépendances…')
      await py.loadPackagesFromImports(code)
    } catch { /* import inconnu : l'erreur claire sortira à l'exécution */ }
    setStatusMsg('')
    let out = ''
    py.setStdout({ batched: (s: string) => { out += s + '\n' } })
    py.setStderr({ batched: (s: string) => { out += s + '\n' } })
    try {
      // Espace de noms frais à chaque exécution
      await py.runPythonAsync(
        `import sys\n__ns = {}\n`
      )
      const escaped = JSON.stringify(code)
      await py.runPythonAsync(`exec(compile(${escaped}, "exercice.py", "exec"), __ns)`)
      return { ok: true, stdout: out, error: null }
    } catch (e) {
      const msg = (e as Error).message || String(e)
      // Nettoyer la stacktrace Pyodide pour ne garder que la partie utile
      const cut = msg.split('\n').filter(l =>
        !l.includes('pyodide') && !l.includes('_pyodide') && !l.includes('File "<exec>"')
      ).join('\n')
      return { ok: false, stdout: out, error: cut.trim() || msg }
    }
  }, [getPyodide])

  return { status, statusMsg, run, getPyodide }
}
