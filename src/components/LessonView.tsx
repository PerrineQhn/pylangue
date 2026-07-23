import { useEffect, useMemo, useState } from 'react'
import { Markdown } from '@/lib/markdown'
import { RunnableExample, ExerciseRunner, CodeBlock } from './CodeRunner'
import { QuizBlock } from './QuizBlock'
import type { Lesson, Module, Section, Exercise, QuizQuestion } from '@/lib/types'
import { TIER_INFO } from '@/lib/types'
import type { Progress } from '@/lib/storage'
import { RECAPS } from '@/data/recaps'
import { TERRAIN } from '@/data/realworld'

type Step =
  | { type: 'lecon'; sections: Section[] }
  | { type: 'recap'; points: string[] }
  | { type: 'exercice'; exercise: Exercise; numero: number; total: number }
  | { type: 'quiz'; questions: QuizQuestion[]; quizId: string }

function construireEtapes(lesson: Lesson): Step[] {
  const theorie = lesson.sections.filter(s => s.kind === 'text' || s.kind === 'code')
  const exercices = lesson.sections.filter(s => s.kind === 'exercise') as Extract<Section, { kind: 'exercise' }>[]
  const quiz = lesson.sections.find(s => s.kind === 'quiz') as Extract<Section, { kind: 'quiz' }> | undefined
  const etapes: Step[] = [{ type: 'lecon', sections: theorie }]
  const points = RECAPS[lesson.id]
  if (points && points.length) etapes.push({ type: 'recap', points })
  exercices.forEach((s, i) => etapes.push({ type: 'exercice', exercise: s.exercise, numero: i + 1, total: exercices.length }))
  if (quiz) etapes.push({ type: 'quiz', questions: quiz.questions, quizId: `${lesson.id}-quiz` })
  return etapes
}

function labelEtape(s: Step): string {
  if (s.type === 'lecon') return 'Cours'
  if (s.type === 'recap') return 'Récap'
  if (s.type === 'exercice') return s.total > 1 ? `Exercice ${s.numero}` : 'Exercice'
  return 'Quiz'
}

export function LessonView({ module: mod, lesson, progress, onProgress, onNavigate, nextLesson }: {
  module: Module
  lesson: Lesson
  progress: Progress
  onProgress: (p: Progress) => void
  onNavigate: (moduleId: string, lessonId: string) => void
  nextLesson: { moduleId: string; lessonId: string; title: string } | null
}) {
  const etapes = useMemo(() => construireEtapes(lesson), [lesson])
  const [etape, setEtape] = useState(0)
  useEffect(() => { setEtape(0) }, [lesson.id])
  useEffect(() => { window.scrollTo(0, 0) }, [etape])

  const completed = progress.completedLessons.includes(lesson.id)
  const derniere = etape === etapes.length - 1
  const courante = etapes[etape]
  const terrain = TERRAIN[lesson.id]

  const markSolved = (exId: string) => {
    if (!progress.solvedExercises.includes(exId)) {
      onProgress({ ...progress, solvedExercises: [...progress.solvedExercises, exId] })
    }
  }

  const terminer = () => {
    if (!completed) {
      onProgress({ ...progress, completedLessons: [...progress.completedLessons, lesson.id] })
    }
    if (nextLesson) onNavigate(nextLesson.moduleId, nextLesson.lessonId)
  }

  return (
    <article className="lesson lesson-app">
      <header className="lesson-header">
        <div className={`tier-badge tier-badge-${mod.tier}`}>
          Palier {mod.tier} · {TIER_INFO[mod.tier].name}
        </div>
        <h1>{lesson.title}</h1>
        <div className="lesson-meta">{mod.title} · ~{lesson.minutes} min {completed && <span className="done-tag">✓ terminée</span>}</div>
        <nav className="steps" aria-label="Étapes de la leçon">
          {etapes.map((s, i) => (
            <button
              key={i}
              className={`step-pill ${i === etape ? 'step-active' : ''} ${i < etape ? 'step-done' : ''}`}
              onClick={() => setEtape(i)}
            >
              <span className="step-num">{i < etape ? '✓' : i + 1}</span>
              {labelEtape(s)}
            </button>
          ))}
        </nav>
      </header>

      <div className="step-content">
        {courante.type === 'lecon' && (
          <>
            {terrain && (
              <aside className="terrain">
                <div className="terrain-label">💼 Sur le terrain</div>
                <Markdown text={terrain} />
              </aside>
            )}
            {courante.sections.map((s, i) => {
              if (s.kind === 'text') return <Markdown key={i} text={s.md} />
              if (s.kind === 'code') return (
                <section key={i} className="section-block">
                  {s.title && <div className="section-label">⚡ {s.title}</div>}
                  {s.runnable
                    ? <RunnableExample code={s.code} needsNumpy={s.needsNumpy} />
                    : <CodeBlock code={s.code} />}
                </section>
              )
              return null
            })}
          </>
        )}

        {courante.type === 'recap' && (
          <div className="recap">
            <h2 className="recap-title">L'essentiel à retenir</h2>
            <p className="recap-sub">Si tu ne devais garder que {courante.points.length} choses de ce cours :</p>
            <ol className="recap-list">
              {courante.points.map((p, i) => (
                <li key={i} className="recap-item">
                  <span className="recap-check">✓</span>
                  <Markdown text={p} />
                </li>
              ))}
            </ol>
          </div>
        )}

        {courante.type === 'exercice' && (
          <section className="section-block exercise-block">
            <div className="section-label exercise-label">
              ✎ {courante.exercise.title}
              {progress.solvedExercises.includes(courante.exercise.id) && <span className="done-tag">✓ réussi</span>}
            </div>
            <Markdown text={courante.exercise.instructions} />
            <ExerciseRunner
              key={courante.exercise.id}
              exercise={courante.exercise}
              solved={progress.solvedExercises.includes(courante.exercise.id)}
              onSolved={() => markSolved(courante.exercise.id)}
            />
          </section>
        )}

        {courante.type === 'quiz' && (
          <section className="section-block">
            <QuizBlock
              key={courante.quizId}
              questions={courante.questions}
              onScore={score => onProgress({ ...progress, quizScores: { ...progress.quizScores, [courante.quizId]: score } })}
            />
          </section>
        )}
      </div>

      <footer className="lesson-nav">
        <button className="btn btn-ghost" disabled={etape === 0} onClick={() => setEtape(e => e - 1)}>
          ← Précédent
        </button>
        <span className="lesson-nav-pos">{etape + 1} / {etapes.length}</span>
        {!derniere ? (
          <button className="btn btn-check" onClick={() => setEtape(e => e + 1)}>
            Continuer →
          </button>
        ) : (
          <button className="btn btn-check" onClick={terminer}>
            {nextLesson ? '✓ Terminer · leçon suivante →' : '✓ Terminer la leçon'}
          </button>
        )}
      </footer>
    </article>
  )
}
