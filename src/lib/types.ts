export interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

export interface Exercise {
  id: string
  title: string
  instructions: string
  starterCode: string
  solution: string
  tests: string
  hints: string[]
  needsNumpy?: boolean
}

export type Section =
  | { kind: 'text'; md: string }
  | { kind: 'code'; title?: string; code: string; runnable?: boolean; needsNumpy?: boolean }
  | { kind: 'exercise'; exercise: Exercise }
  | { kind: 'quiz'; questions: QuizQuestion[] }

export interface Lesson {
  id: string
  title: string
  minutes: number
  sections: Section[]
}

export interface Module {
  id: string
  tier: 1 | 2 | 3
  title: string
  tagline: string
  status: 'ready' | 'outline'
  lessons: Lesson[]
  outline?: string[]
}

export const TIER_INFO: Record<number, { name: string; color: string }> = {
  1: { name: 'Fondations Python', color: 'tier1' },
  2: { name: 'ML & NLP classique', color: 'tier2' },
  3: { name: 'LLM moderne', color: 'tier3' },
}
