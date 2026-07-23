import { useRef, useState } from 'react'
import { usePyodide } from '@/hooks/usePyodide'
import { highlightPython } from '@/lib/highlight'
import type { Exercise } from '@/lib/types'

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="md-codeblock">
      <code dangerouslySetInnerHTML={{ __html: highlightPython(code) }} />
    </pre>
  )
}

function Editor({ value, onChange, minRows = 8 }: { value: string; onChange: (v: string) => void; minRows?: number }) {
  const preRef = useRef<HTMLPreElement>(null)
  const rows = Math.max(minRows, value.split('\n').length + 1)
  const sync = (t: HTMLTextAreaElement) => {
    if (preRef.current) {
      preRef.current.scrollLeft = t.scrollLeft
      preRef.current.scrollTop = t.scrollTop
    }
  }
  return (
    <div className="editor-wrap">
      <pre ref={preRef} aria-hidden className="editor-highlight">
        <code dangerouslySetInnerHTML={{ __html: highlightPython(value) + '\n' }} />
      </pre>
      <textarea
        className="code-editor"
        spellCheck={false}
        wrap="off"
        value={value}
        rows={rows}
        onChange={e => { onChange(e.target.value); sync(e.currentTarget) }}
        onScroll={e => sync(e.currentTarget)}
        onKeyDown={e => {
          if (e.key === 'Tab') {
            e.preventDefault()
            const t = e.currentTarget
            const start = t.selectionStart
            const next = value.slice(0, start) + '    ' + value.slice(t.selectionEnd)
            onChange(next)
            requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = start + 4 })
          }
        }}
      />
    </div>
  )
}

function Output({ result, running, statusMsg }: { result: { ok: boolean; stdout: string; error: string | null } | null; running: boolean; statusMsg: string }) {
  if (running) return <div className="output output-running"><span className="spinner" />{statusMsg || 'Exécution…'}</div>
  if (!result) return null
  return (
    <div className={`output ${result.error ? 'output-error' : ''}`}>
      {result.stdout && <pre>{result.stdout}</pre>}
      {result.error && <pre className="error-text">{result.error}</pre>}
      {!result.stdout && !result.error && <pre className="muted-text">(aucune sortie)</pre>}
    </div>
  )
}

export function RunnableExample({ code, needsNumpy }: { code: string; needsNumpy?: boolean }) {
  const [src, setSrc] = useState(code)
  const [result, setResult] = useState<{ ok: boolean; stdout: string; error: string | null } | null>(null)
  const [running, setRunning] = useState(false)
  const { run, statusMsg } = usePyodide()

  const exec = async () => {
    setRunning(true)
    setResult(null)
    try {
      const r = await run(src, { needsNumpy })
      setResult(r)
    } catch (e) {
      setResult({ ok: false, stdout: '', error: (e as Error).message })
    }
    setRunning(false)
  }

  return (
    <div className="runner">
      <Editor value={src} onChange={setSrc} minRows={4} />
      <div className="runner-bar">
        <button className="btn btn-run" onClick={exec} disabled={running}>
          {running ? '…' : '▶ Exécuter'}
        </button>
        {src !== code && (
          <button className="btn btn-ghost" onClick={() => { setSrc(code); setResult(null) }}>Réinitialiser</button>
        )}
      </div>
      <Output result={result} running={running} statusMsg={statusMsg} />
    </div>
  )
}

export function ExerciseRunner({ exercise, solved, onSolved }: {
  exercise: Exercise
  solved: boolean
  onSolved: () => void
}) {
  const [src, setSrc] = useState(exercise.starterCode)
  const [result, setResult] = useState<{ ok: boolean; stdout: string; error: string | null } | null>(null)
  const [verdict, setVerdict] = useState<'none' | 'pass' | 'fail'>('none')
  const [running, setRunning] = useState(false)
  const [hintIdx, setHintIdx] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const { run, statusMsg } = usePyodide()

  const exec = async (withTests: boolean) => {
    setRunning(true)
    setResult(null)
    if (withTests) setVerdict('none')
    try {
      const code = withTests ? src + '\n\n# --- Tests ---\n' + exercise.tests : src
      const r = await run(code, { needsNumpy: exercise.needsNumpy })
      const passed = withTests && r.ok && r.stdout.includes('TESTS_PASS')
      setResult({ ...r, stdout: r.stdout.replace('TESTS_PASS\n', '').replace('TESTS_PASS', '') })
      if (withTests) {
        setVerdict(passed ? 'pass' : 'fail')
        if (passed) onSolved()
      }
    } catch (e) {
      setResult({ ok: false, stdout: '', error: (e as Error).message })
      if (withTests) setVerdict('fail')
    }
    setRunning(false)
  }

  return (
    <div className="runner exercise-runner">
      <Editor value={src} onChange={setSrc} />
      <div className="runner-bar">
        <button className="btn btn-run" onClick={() => exec(false)} disabled={running}>▶ Exécuter</button>
        <button className="btn btn-check" onClick={() => exec(true)} disabled={running}>✓ Valider</button>
        {hintIdx < exercise.hints.length && (
          <button className="btn btn-ghost" onClick={() => setHintIdx(i => i + 1)}>
            Indice ({hintIdx + 1}/{exercise.hints.length})
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => { setSrc(exercise.starterCode); setResult(null); setVerdict('none') }}>
          Réinitialiser
        </button>
        {(solved || verdict === 'pass') && (
          <button className="btn btn-ghost" onClick={() => setShowSolution(s => !s)}>
            {showSolution ? 'Masquer la solution' : 'Voir la solution'}
          </button>
        )}
      </div>
      {exercise.hints.slice(0, hintIdx).map((h, i) => (
        <div key={i} className="hint">💡 {h}</div>
      ))}
      <Output result={result} running={running} statusMsg={statusMsg} />
      {verdict === 'pass' && <div className="verdict verdict-pass">✓ Tous les tests passent — exercice réussi !</div>}
      {verdict === 'fail' && <div className="verdict verdict-fail">✗ Les tests ne passent pas encore. Lis le message d'erreur ci-dessus : il te dit précisément ce qui est attendu.</div>}
      {showSolution && (
        <div className="solution">
          <div className="solution-label">Solution de référence</div>
          <CodeBlock code={exercise.solution} />
        </div>
      )}
    </div>
  )
}
