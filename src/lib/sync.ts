// Synchronisation cloud par code personnel, via l'API REST de Supabase.
// Le code joue le rôle de clé d'accès : quiconque le connaît peut lire
// et fusionner cette progression — ne le partage qu'entre tes appareils.

import { SYNC_CONFIG } from './syncConfig'
import { mergeProgress, type Progress } from './storage'

const TABLE = 'progression'

function entetes(): Record<string, string> {
  const h: Record<string, string> = {
    apikey: SYNC_CONFIG.anonKey,
    'Content-Type': 'application/json',
  }
  // Les clés legacy sont des JWT (eyJ...) et passent aussi par Authorization ;
  // les nouvelles clés sb_publishable_... ne doivent PAS y figurer.
  if (SYNC_CONFIG.anonKey.startsWith('eyJ')) {
    h.Authorization = `Bearer ${SYNC_CONFIG.anonKey}`
  }
  return h
}

const MOTS = [
  'chat', 'vecteur', 'token', 'corpus', 'neurone', 'tenseur', 'gradient',
  'softmax', 'lexique', 'syntaxe', 'prompt', 'modele', 'zephyr', 'quartz',
  'lotus', 'nuage', 'fjord', 'lueur', 'pixel', 'astre', 'delta', 'menthe',
  'ambre', 'cobalt', 'safran', 'onyx', 'topaze', 'lichen', 'granit', 'saule',
]

export function genererCode(): string {
  const alea = new Uint32Array(4)
  crypto.getRandomValues(alea)
  const mots = [0, 1, 2].map(i => MOTS[alea[i] % MOTS.length])
  const nombre = 100 + (alea[3] % 900)
  return `${mots[0]}-${mots[1]}-${mots[2]}-${nombre}`
}

export async function tirer(code: string): Promise<Progress | null> {
  const url = `${SYNC_CONFIG.url}/rest/v1/${TABLE}?code=eq.${encodeURIComponent(code)}&select=data`
  const rep = await fetch(url, { headers: entetes() })
  if (!rep.ok) throw new Error(`Lecture impossible (HTTP ${rep.status})`)
  const lignes = await rep.json()
  if (!Array.isArray(lignes) || lignes.length === 0) return null
  return lignes[0].data as Progress
}

export async function pousser(code: string, progression: Progress): Promise<void> {
  const url = `${SYNC_CONFIG.url}/rest/v1/${TABLE}?on_conflict=code`
  const rep = await fetch(url, {
    method: 'POST',
    headers: { ...entetes(), Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{ code, data: progression, updated_at: new Date().toISOString() }]),
  })
  if (!rep.ok) throw new Error(`Écriture impossible (HTTP ${rep.status})`)
}

/** Tire la version distante, fusionne avec la locale, repousse le résultat. */
export async function synchroniser(code: string, locale: Progress): Promise<Progress> {
  const distante = await tirer(code)
  const fusion = distante ? mergeProgress(locale, distante) : locale
  await pousser(code, fusion)
  return fusion
}
