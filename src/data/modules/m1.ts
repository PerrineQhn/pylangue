import type { Module } from '@/lib/types'

export const m1: Module = {
    id: 'm1',
    tier: 1,
    title: 'Premiers pas : Python par le texte',
    tagline: 'Variables, chaînes et premières manipulations de texte — le matériau de base du NLP.',
    status: 'ready',
    lessons: [
      {
        id: 'm1l1',
        title: 'Le texte comme donnée',
        minutes: 25,
        sections: [
          {
            kind: 'text',
            md: `# Pourquoi commencer par le texte ?

En NLP, en IA et avec les LLM, la donnée de base est **la chaîne de caractères**. Avant de parler de tokens, d'embeddings ou d'attention, il faut être à l'aise avec la manipulation de texte en Python — c'est le socle de *tout* le reste : nettoyage de corpus, construction de prompts, parsing de réponses de modèles.

## Variables et chaînes

Une variable se crée par simple affectation. Les chaînes (\`str\`) se délimitent par des guillemets simples ou doubles :

\`\`\`
phrase = "Les modèles de langage prédisent le prochain token."
auteur = 'un data scientist'
\`\`\`

Les **f-strings** sont la manière moderne d'insérer des valeurs dans du texte — tu les utiliseras en permanence pour construire des prompts :

\`\`\`
modele = "GPT"
prompt = f"Résume ce texte comme le ferait {auteur} avec {modele}."
\`\`\`

## Les méthodes de chaînes essentielles

- \`.lower()\` / \`.upper()\` — normaliser la casse
- \`.strip()\` — retirer les espaces (et sauts de ligne) en début/fin
- \`.replace(a, b)\` — remplacer une sous-chaîne
- \`.split(sep)\` — découper en liste (première étape vers la *tokenisation* !)
- \`.join(liste)\` — recoller une liste en chaîne
- \`in\` — tester la présence d'une sous-chaîne

> En nettoyage de corpus réel, ces six méthodes couvrent une part énorme du travail quotidien.`,
          },
          {
            kind: 'code',
            title: 'Exemple à exécuter — observe chaque sortie',
            runnable: true,
            code: `texte = "  Le Transformer a été introduit en 2017.  \\n"

propre = texte.strip()
print(repr(propre))          # repr() montre la chaîne exacte

minuscules = propre.lower()
print(minuscules)

mots = minuscules.split(" ")
print(mots)
print(f"Nombre de mots : {len(mots)}")

# .join() fait l'inverse de .split()
recolle = " ".join(mots)
print(recolle)`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm1l1e1',
              title: 'Normaliser un texte brut',
              instructions: `Écris une fonction \`normaliser(texte)\` qui :

1. retire les espaces et sauts de ligne en début/fin,
2. met tout en minuscules,
3. remplace les doubles espaces \`"  "\` par des espaces simples.

C'est littéralement la première étape de 90 % des pipelines NLP.`,
              starterCode: `def normaliser(texte):
    # À toi de jouer !
    ...

print(normaliser("  Bonjour  le MONDE \\n"))`,
              solution: `def normaliser(texte):
    texte = texte.strip()
    texte = texte.lower()
    texte = texte.replace("  ", " ")
    return texte

print(normaliser("  Bonjour  le MONDE \\n"))`,
              tests: `assert normaliser("  Bonjour  le MONDE \\n") == "bonjour le monde", "La normalisation de '  Bonjour  le MONDE ' devrait donner 'bonjour le monde'"
assert normaliser("IA") == "ia", "normaliser('IA') devrait donner 'ia'"
assert normaliser(" Un  deux  trois ") == "un deux trois", "Les doubles espaces doivent devenir simples"
print("TESTS_PASS")`,
              hints: [
                'Enchaîne les méthodes : strip() d\'abord, puis lower(), puis replace().',
                'N\'oublie pas le return ! Une fonction sans return renvoie None.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Que renvoie "Hello World".split(" ") ?',
                options: ['"HelloWorld"', '["Hello", "World"]', '("Hello", "World")', 'Une erreur'],
                correct: 1,
                explanation: 'split() découpe la chaîne selon le séparateur et renvoie une liste de sous-chaînes. C\'est l\'ancêtre conceptuel de la tokenisation.',
              },
              {
                question: 'Pourquoi les f-strings sont-elles importantes quand on travaille avec des LLM ?',
                options: [
                  'Elles rendent le code plus rapide',
                  'Elles servent à construire dynamiquement des prompts avec des variables',
                  'Elles sont obligatoires en Python 3',
                  'Elles compressent le texte',
                ],
                correct: 1,
                explanation: 'Un prompt est presque toujours un template avec des parties variables (contexte, question de l\'utilisateur, exemples). Les f-strings sont l\'outil de base pour ça.',
              },
            ],
          },
        ],
      },
      {
        id: 'm1l2',
        title: 'Listes, dictionnaires et fréquences de mots',
        minutes: 30,
        sections: [
          {
            kind: 'text',
            md: `# Compter les mots : ton premier modèle de langage (ou presque)

Avant les réseaux de neurones, le NLP reposait sur le **comptage**. Et même aujourd'hui, compter des fréquences reste partout : construction de vocabulaires, TF-IDF, statistiques de corpus, détection de mots-clés.

## Les listes

Une liste est une séquence ordonnée et modifiable :

\`\`\`
tokens = ["le", "chat", "dort"]
tokens.append("profondément")
premier = tokens[0]        # indexation
derniers = tokens[-2:]     # slicing : les 2 derniers
\`\`\`

## Les dictionnaires

Un dictionnaire associe des **clés** à des **valeurs**. C'est LA structure de données du NLP : vocabulaires (\`mot → id\`), comptages (\`mot → fréquence\`), embeddings (\`mot → vecteur\`)…

\`\`\`
comptes = {}
comptes["chat"] = 1
comptes["chat"] = comptes["chat"] + 1   # incrémenter
"chien" in comptes                       # tester une clé : False
comptes.get("chien", 0)                  # valeur par défaut : 0
\`\`\`

## Le motif fondamental : compter

\`\`\`
for token in tokens:
    comptes[token] = comptes.get(token, 0) + 1
\`\`\`

Ce petit motif de trois lignes, tu vas le réécrire des dizaines de fois dans ta carrière (ou utiliser \`collections.Counter\`, sa version standard).`,
          },
          {
            kind: 'code',
            title: 'Counter : le comptage version bibliothèque standard',
            runnable: true,
            code: `from collections import Counter

texte = "le chat dort et le chien dort aussi le chat rêve"
tokens = texte.split()

comptes = Counter(tokens)
print(comptes)
print(comptes.most_common(3))   # les 3 tokens les plus fréquents

# Un vrai vocabulaire NLP : mot -> identifiant entier
vocab = {mot: i for i, mot in enumerate(sorted(comptes))}
print(vocab)`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm1l2e1',
              title: 'Top-k des mots d\'un texte',
              instructions: `Écris une fonction \`top_mots(texte, k)\` qui renvoie la liste des \`k\` mots les plus fréquents du texte (en minuscules), du plus fréquent au moins fréquent.

Utilise \`Counter\` et sa méthode \`.most_common(k)\` — mais attention, elle renvoie des paires \`(mot, compte)\` et on ne veut que les mots.`,
              starterCode: `from collections import Counter

def top_mots(texte, k):
    # 1. minuscules, 2. split, 3. Counter, 4. extraire les mots
    ...

print(top_mots("Le chat dort le chat rêve le chien", 2))`,
              solution: `from collections import Counter

def top_mots(texte, k):
    tokens = texte.lower().split()
    comptes = Counter(tokens)
    return [mot for mot, _ in comptes.most_common(k)]

print(top_mots("Le chat dort le chat rêve le chien", 2))`,
              tests: `assert top_mots("Le chat dort le chat rêve le chien", 2) == ["le", "chat"], "Les 2 mots les plus fréquents sont 'le' puis 'chat'"
assert top_mots("a b b c c c", 1) == ["c"], "Le mot le plus fréquent est 'c'"
assert top_mots("x", 5) == ["x"], "Si k dépasse le nombre de mots, on renvoie ce qu'on a"
print("TESTS_PASS")`,
              hints: [
                'texte.lower().split() te donne la liste des tokens en minuscules.',
                'Counter(tokens).most_common(k) renvoie [(mot, compte), ...] — utilise une list comprehension pour ne garder que les mots.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Quelle structure de données représente naturellement un vocabulaire mot → identifiant ?',
                options: ['Une liste', 'Un tuple', 'Un dictionnaire', 'Une chaîne'],
                correct: 2,
                explanation: 'Le dictionnaire fait l\'association clé → valeur en temps constant. Les tokenizers de Hugging Face contiennent exactement ça : un dict token → id.',
              },
              {
                question: 'Que fait comptes.get("chien", 0) si "chien" n\'est pas dans le dictionnaire ?',
                options: ['Lève une KeyError', 'Renvoie None', 'Renvoie 0', 'Ajoute "chien" au dictionnaire'],
                correct: 2,
                explanation: 'get(clé, défaut) renvoie la valeur par défaut sans erreur ni modification. C\'est ce qui rend le motif de comptage si compact.',
              },
              {
                question: 'En NLP, pourquoi met-on généralement le texte en minuscules avant de compter ?',
                options: [
                  'Pour économiser de la mémoire',
                  'Pour que "Le" et "le" soient comptés comme le même mot',
                  'Python l\'exige',
                  'Pour accélérer le split',
                ],
                correct: 1,
                explanation: 'C\'est une forme de normalisation : sans elle, le vocabulaire explose avec des doublons. (Les tokenizers modernes comme BPE font des choix plus subtils, on le verra au palier 2.)',
              },
            ],
          },
        ],
      },
      {
        id: 'm1l3',
        title: 'Mini-projet : analyseur de corpus',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Assembler tout : ton premier outil NLP complet

Tu sais nettoyer, découper, compter. Il est temps d'assembler ces briques en un vrai outil : un **analyseur statistique de texte** — la première chose qu'on fait face à un corpus inconnu, avant tout entraînement ou toute indexation.

## Les statistiques qui comptent

- **Nombre de tokens** et **taille du vocabulaire** (mots uniques) : l'ordre de grandeur du corpus,
- **Richesse lexicale** = vocabulaire / tokens : proche de 1 → texte très varié ; proche de 0 → très répétitif. (Les linguistes l'appellent *type-token ratio*.)
- **Longueur moyenne des mots** : un indicateur de registre (langage courant vs technique),
- **Hapax** : les mots qui n'apparaissent qu'une seule fois — souvent 40-50 % du vocabulaire d'un corpus réel ! C'est la fameuse *loi de Zipf* : quelques mots très fréquents, une immense traîne de mots rares.

## Pourquoi c'est important en pratique

Ces statistiques guident des décisions très concrètes : la taille de vocabulaire d'un tokenizer, le choix d'une taille de chunk pour un RAG, la détection de corpus dupliqués ou anormaux avant un fine-tuning. Les rapports de qualité de données des grands labos commencent tous par ces chiffres.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm1l3e1',
              title: 'La fonction analyser()',
              instructions: `Écris \`analyser(texte)\` qui renvoie un dictionnaire avec exactement ces clés :

- \`"tokens"\` : nombre total de mots (après \`.lower().split()\`),
- \`"vocabulaire"\` : nombre de mots uniques,
- \`"richesse"\` : vocabulaire / tokens, arrondi à 3 décimales (\`round(x, 3)\`),
- \`"hapax"\` : liste **triée** des mots n'apparaissant qu'une fois,
- \`"top3"\` : les 3 mots les plus fréquents (utilise \`Counter.most_common\`).

Pour un texte vide, renvoie \`{"tokens": 0, "vocabulaire": 0, "richesse": 0.0, "hapax": [], "top3": []}\`.`,
              starterCode: `from collections import Counter

def analyser(texte):
    ...

resultat = analyser("le chat dort et le chien dort aussi le chat rêve")
for cle, valeur in resultat.items():
    print(f"{cle} : {valeur}")`,
              solution: `from collections import Counter

def analyser(texte):
    mots = texte.lower().split()
    if not mots:
        return {"tokens": 0, "vocabulaire": 0, "richesse": 0.0, "hapax": [], "top3": []}
    comptes = Counter(mots)
    return {
        "tokens": len(mots),
        "vocabulaire": len(comptes),
        "richesse": round(len(comptes) / len(mots), 3),
        "hapax": sorted(m for m, c in comptes.items() if c == 1),
        "top3": [m for m, _ in comptes.most_common(3)],
    }

resultat = analyser("le chat dort et le chien dort aussi le chat rêve")
for cle, valeur in resultat.items():
    print(f"{cle} : {valeur}")`,
              tests: `_r = analyser("le chat dort et le chien dort aussi le chat rêve")
assert _r["tokens"] == 11, "11 tokens au total"
assert _r["vocabulaire"] == 7, "7 mots uniques"
assert _r["richesse"] == round(7 / 11, 3), "richesse = vocabulaire / tokens, arrondie à 3 décimales"
assert _r["hapax"] == ["aussi", "chien", "et", "rêve"], "Les hapax, triés alphabétiquement"
assert _r["top3"][0] == "le", "'le' (3 occurrences) est le plus fréquent"
assert set(_r["top3"][1:]) == {"chat", "dort"}, "'chat' et 'dort' (2 occurrences chacun) complètent le top 3"
_v = analyser("")
assert _v == {"tokens": 0, "vocabulaire": 0, "richesse": 0.0, "hapax": [], "top3": []}, "Texte vide : le dict par défaut"
print("TESTS_PASS")`,
              hints: [
                'Counter(mots) te donne tout : len(comptes) est le vocabulaire, comptes.items() permet de filtrer les hapax.',
                'Les hapax : sorted(m for m, c in comptes.items() if c == 1).',
                'Traite le cas du texte vide en premier (if not mots) pour éviter la division par zéro.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Un corpus a une richesse lexicale de 0.05. Qu\'est-ce que ça suggère ?',
                options: [
                  'Un texte très créatif et varié',
                  'Un texte très répétitif (peu de mots uniques rapportés au total) — typique de logs, de spam ou de données dupliquées',
                  'Un corpus multilingue',
                  'Une erreur de calcul',
                ],
                correct: 1,
                explanation: 'Une richesse très basse est un signal d\'alerte avant un fine-tuning : données dupliquées ou dégénérées. Ce simple ratio détecte des problèmes que l\'œil ne voit pas sur 10 Go de texte.',
              },
              {
                question: 'Que dit la loi de Zipf sur les fréquences des mots ?',
                options: [
                  'Tous les mots ont à peu près la même fréquence',
                  'Une poignée de mots domine le corpus, et une immense traîne de mots est très rare',
                  'Les mots longs sont plus fréquents',
                  'La fréquence dépend de l\'alphabet',
                ],
                correct: 1,
                explanation: 'Le 1er mot est ~2× plus fréquent que le 2e, ~3× que le 3e… Cette distribution explique pourquoi les hapax pullulent, pourquoi TF-IDF fonctionne, et pourquoi les tokenizers BPE compressent si bien les mots fréquents.',
              },
            ],
          },
        ],
      },
    ],
  }
