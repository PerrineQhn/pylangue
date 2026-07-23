import { useState } from 'react'
import type { QuizQuestion } from '@/lib/types'

export function QuizBlock({ questions, onScore }: {
  questions: QuizQuestion[]
  onScore: (score: number) => void
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState(false)

  const allAnswered = questions.every((_, i) => answers[i] !== undefined)
  const score = questions.filter((q, i) => answers[i] === q.correct).length

  return (
    <div className="quiz">
      <div className="quiz-header">Quiz — vérifie ta compréhension</div>
      {questions.map((q, qi) => (
        <div key={qi} className="quiz-question">
          <div className="quiz-q-text">{qi + 1}. {q.question}</div>
          <div className="quiz-options">
            {q.options.map((opt, oi) => {
              let cls = 'quiz-option'
              if (checked) {
                if (oi === q.correct) cls += ' correct'
                else if (answers[qi] === oi) cls += ' incorrect'
              } else if (answers[qi] === oi) cls += ' selected'
              return (
                <button
                  key={oi}
                  className={cls}
                  disabled={checked}
                  onClick={() => setAnswers(a => ({ ...a, [qi]: oi }))}
                >
                  <span className="quiz-letter">{String.fromCharCode(65 + oi)}</span> {opt}
                </button>
              )
            })}
          </div>
          {checked && (
            <div className={`quiz-explanation ${answers[qi] === q.correct ? 'exp-ok' : 'exp-ko'}`}>
              {answers[qi] === q.correct ? '✓ ' : '✗ '}{q.explanation}
            </div>
          )}
        </div>
      ))}
      {!checked ? (
        <button
          className="btn btn-check"
          disabled={!allAnswered}
          onClick={() => { setChecked(true); onScore(score / questions.length) }}
        >
          Vérifier mes réponses
        </button>
      ) : (
        <div className="quiz-score">
          Score : {score}/{questions.length}
          <button className="btn btn-ghost" onClick={() => { setChecked(false); setAnswers({}) }} style={{ marginLeft: 12 }}>
            Recommencer
          </button>
        </div>
      )}
    </div>
  )
}
