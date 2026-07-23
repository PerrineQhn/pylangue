import { tier1 } from './tier1'
import { tier2 } from './tier2'
import { tier3 } from './tier3'
import type { Module } from '@/lib/types'

export const MODULES: Module[] = [...tier1, ...tier2, ...tier3]

export function moduleById(id: string): Module | undefined {
  return MODULES.find(m => m.id === id)
}

export const TOTAL_LESSONS = MODULES.reduce((n, m) => n + m.lessons.length, 0)
