# Activer la synchronisation cloud (optionnelle)

Par défaut, PyLangue fonctionne 100 % en local (localStorage + transfert par lien/QR).
Ce guide active en plus une **synchronisation par code personnel** entre tous tes
appareils, via un projet [Supabase](https://supabase.com) gratuit. Comptez ~10 minutes.

## 1. Créer le projet Supabase

1. Crée un compte sur supabase.com (gratuit) et un nouveau projet.
2. Note deux informations dans **Settings → API** :
   - **Project URL** (ex : `https://abcdefgh.supabase.co`)
   - la clé **anon public**

## 2. Créer la table

Dans **SQL Editor**, exécute :

```sql
create table public.progression (
  code text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.progression enable row level security;

-- Lecture/écriture ouvertes : le code (secret, généré aléatoirement)
-- fait office de clé d'accès.
create policy "acces_par_code" on public.progression
  for all using (true) with check (true);
```

## 3. Configurer l'app

Dans `src/lib/syncConfig.ts`, renseigne :

```ts
export const SYNC_CONFIG = {
  url: 'https://abcdefgh.supabase.co',
  anonKey: 'eyJ...',   // la clé anon public
}
```

Puis recompile le bundle et remplace `docs/index.html`.

## 4. Utiliser

Sur la page d'accueil, un lien **☁ synchronisation cloud** apparaît en bas :

- **Générer un code** crée un code personnel (ex : `menthe-vecteur-lotus-427`),
- **Activer la synchronisation** l'enregistre et pousse ta progression,
- sur un autre appareil : saisis le **même code** et synchronise — les progressions
  se **fusionnent** (union des leçons/exercices, meilleur score aux quiz).

Ensuite, tout est automatique : synchronisation à chaque ouverture de l'app, et
poussée en arrière-plan quelques secondes après chaque progrès.

## Sécurité — à savoir

Le code est l'unique clé d'accès : quiconque le connaît peut lire et modifier la
progression associée. C'est un compromis volontaire (pas de compte, pas de mot de
passe) adapté à des données non sensibles comme une progression d'apprentissage.
Utilise toujours un code **généré** (aléatoire), pas un mot devinable. La clé
`anon` de Supabase peut figurer dans le code du site : c'est son usage prévu,
la sécurité reposant sur les politiques RLS et le secret du code.
