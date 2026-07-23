// Configuration de la synchronisation cloud (optionnelle).
//
// Par défaut (champs vides), la fonctionnalité est invisible et l'app
// fonctionne 100 % en local. Pour l'activer, suis le guide SYNC_SETUP.md
// à la racine du projet, puis renseigne ici l'URL et la clé "anon" de
// ton projet Supabase, et recompile le bundle.

export const SYNC_CONFIG = {
  url: 'https://odhkqbtkopvrweltuwdh.supabase.co',      // ex : 'https://abcdefgh.supabase.co'
  anonKey: 'sb_publishable_aX4ZzWHUcS-jj19_qFLOcA_t8OWQVBO',  // la clé "anon public" du projet
}

export function syncDisponible(): boolean {
  return SYNC_CONFIG.url.length > 0 && SYNC_CONFIG.anonKey.length > 0
}
