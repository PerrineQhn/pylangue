# PyLangue — Apprendre Python par le NLP & les LLM

Application d'apprentissage interactive : 13 modules en 3 paliers (Fondations Python,
ML/NLP classique, LLM moderne), exercices Python exécutables dans le navigateur via
Pyodide (WebAssembly), quiz et suivi de progression.

## Utilisation directe

Ouvre `PyLangue.html` dans un navigateur — aucune installation nécessaire.
(Connexion internet requise à la première exécution de code : chargement du moteur Python.)
La progression est sauvegardée dans le navigateur (localStorage), avec export/import JSON.

## Déploiement (GitHub Pages)

Le dossier `docs/` contient l'app compilée. Pour la mettre en ligne :

```bash
git remote add origin https://github.com/<ton-user>/pylangue.git
git push -u origin main
```

Puis sur GitHub : **Settings → Pages → Source : Deploy from a branch → Branch : main, dossier /docs → Save**.
L'app sera accessible sous `https://<ton-user>.github.io/pylangue/` en ~1 minute.
Après chaque modification : recompiler le bundle dans `docs/index.html`, commit, push.

## Développement

```bash
npm install        # ou pnpm install
npm run dev        # serveur de développement Vite
```

Pour reconstruire le fichier unique `PyLangue.html` : bundler avec Parcel + html-inline
(ou n'importe quel outil d'inlining d'assets sur le build Vite).

## Structure

- `src/data/tier{1,2,3}.ts` — tout le contenu pédagogique (leçons, exercices, tests, quiz)
- `src/hooks/usePyodide.ts` — chargement et exécution Python (Pyodide, CDN avec fallback)
- `src/components/` — Sidebar, Home, LessonView, CodeRunner (éditeur + coloration), QuizBlock
- `src/lib/` — types, markdown, coloration syntaxique, persistance

Pour ajouter un module : compléter un module `status: 'outline'` dans `src/data/`
avec ses `lessons` (le format est visible dans les modules existants).
