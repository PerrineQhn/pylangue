import { Markdown } from '@/lib/markdown'
import { RunnableExample, ExerciseRunner, CodeBlock } from './CodeRunner'
import { QuizBlock } from './QuizBlock'
import type { Lesson, Module } from '@/lib/types'
import { TIER_INFO } from '@/lib/types'
import type { Progress } from '@/lib/storage'

export function LessonView({ module: mod, lesson, progress, onProgress, onNavigate, nextLesson }: {
  module: Module
  lesson: Lesson
  progress: Progress
  onProgress: (p: Progress) => void
  onNavigate: (moduleId: string, lessonId: string) => void
  nextLesson: { moduleId: string; lessonId: string; title: string } | null
}) {
  const completed = progress.completedLessons.includes(lesson.id)

  const markSolved = (exId: string) => {
    if (!progress.solvedExercises.includes(exId)) {
      onProgress({ ...progress, solvedExercises: [...progress.solvedExercises, exId] })
    }
  }

  const markComplete = () => {
    if (!completed) {
      onProgress({ ...progress, completedLessons: [...progress.completedLessons, lesson.id] })
    }
  }

  return (
    <article className="lesson">
      <header className="lesson-header">
        <div className={`tier-badge tier-badge-${mod.tier}`}>
          Palier {mod.tier} · {TIER_INFO[mod.tier].name}
        </div>
        <h1>{lesson.title}</h1>
        <div className="lesson-meta">{mod.title} · ~{lesson.minutes} min {completed && <span className="done-tag">✓ terminée</span>}</div>
      </header>

      {lesson.sections.map((s, i) => {
        if (s.kind === 'text') return <Markdown key={i} text={s.md} />
        if (s.kind === 'code') return (
          <section key={i} className="section-block">
            {s.title && <div className="section-label">⚡ {s.title}</div>}
            {s.runnable
              ? <RunnableExample code={s.code} needsNumpy={s.needsNumpy} />
              : <CodeBlock code={s.code} />}
          </section>
        )
        if (s.kind === 'exercise') return (
          <section key={i} className="section-block exercise-block">
            <div className="section-label exercise-label">
              ✎ Exercice : {s.exercise.title}
              {progress.solvedExercises.includes(s.exercise.id) && <span className="done-tag">✓ réussi</span>}
            </div>
            <Markdown text={s.exercise.instructions} />
            <ExerciseRunner
              exercise={s.exercise}
              solved={progress.solvedExercises.includes(s.exercise.id)}
              onSolved={() => markSolved(s.exercise.id)}
            />
          </section>
        )
        return (
          <section key={i} className="section-block">
            <QuizBlock
              questions={s.questions}
              onScore={score => onProgress({ ...progress, quizScores: { ...progress.quizScores, [`${lesson.id}-q${i}`]: score } })}
            />
          </section>
        )
      })}

      <footer className="lesson-footer">
        {!completed && (
          <button className="btn btn-check" onClick={markComplete}>✓ Marquer la leçon comme terminée</button>
        )}
        {nextLesson && (
          <button className="btn btn-run" onClick={() => { markComplete(); onNavigate(nextLesson.moduleId, nextLesson.lessonId) }}>
            Leçon suivante : {nextLesson.title} →
          </button>
        )}
      </footer>
    </article>
  )
}
