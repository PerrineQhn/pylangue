import type { Module } from '@/lib/types'

export const m6: Module = {
    id: 'm6',
    tier: 2,
    title: 'TF-IDF et moteur de recherche from scratch',
    tagline: 'Vectoriser des documents sans réseau de neurones — et comprendre ce que les embeddings ont amélioré.',
    status: 'ready',
    lessons: [
      {
        id: 'm6l1',
        title: 'Bag of words : des textes aux vecteurs',
        minutes: 30,
        sections: [
          {
            kind: 'text',
            md: `# Transformer du texte en nombres, première méthode

Aucun algorithme ne travaille sur des mots : il faut des **vecteurs**. La méthode historique, toujours utilisée (recherche lexicale, baselines, features), est le **bag of words** (sac de mots) : chaque document devient un vecteur de comptages, une dimension par mot du vocabulaire.

\`\`\`
Vocabulaire : ["chat", "chien", "dort", "mange"]
"le chat dort, le chat mange"  ->  [2, 0, 1, 1]
"le chien dort"                ->  [0, 1, 1, 0]
\`\`\`

L'*ordre des mots est perdu* (d'où le nom : un « sac ») — c'est la grande limite, et la raison d'être des modèles séquentiels puis des transformers.

## Construire la représentation

Deux étapes, que tu connais déjà par morceaux :

1. **Vocabulaire** : l'ensemble des mots du corpus, avec un index fixe par mot (module 2 !),
2. **Vectorisation** : pour chaque document, compter les occurrences de chaque mot du vocabulaire (module 1 !).

## La matrice documents × mots

Empile les vecteurs : tu obtiens une matrice \`(n_documents, taille_vocab)\`. C'est la structure de données de la recherche d'information classique — et l'entrée des premiers classifieurs de texte. Dans scikit-learn, tout ceci s'appelle \`CountVectorizer\` ; aujourd'hui tu l'écris toi-même.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm6l1e1',
              title: 'Vectoriseur bag of words complet',
              instructions: `Implémente :

1. \`construire_vocab(documents)\` — renvoie le dict \`mot → index\` des mots (minuscules, split espace) de tous les documents, **triés alphabétiquement** (pour des index reproductibles),
2. \`vectoriser(document, vocab)\` — renvoie la liste de comptages, de longueur \`len(vocab)\`, où la position \`vocab[mot]\` contient le nombre d'occurrences du mot (mots hors vocab : ignorés).`,
              starterCode: `def construire_vocab(documents):
    ...

def vectoriser(document, vocab):
    ...

docs = ["le chat dort", "le chien mange le os"]
vocab = construire_vocab(docs)
print(vocab)
print(vectoriser("le chat mange le chat", vocab))`,
              solution: `def construire_vocab(documents):
    mots = set()
    for doc in documents:
        mots.update(doc.lower().split())
    return {mot: i for i, mot in enumerate(sorted(mots))}

def vectoriser(document, vocab):
    vecteur = [0] * len(vocab)
    for mot in document.lower().split():
        if mot in vocab:
            vecteur[vocab[mot]] += 1
    return vecteur

docs = ["le chat dort", "le chien mange le os"]
vocab = construire_vocab(docs)
print(vocab)
print(vectoriser("le chat mange le chat", vocab))`,
              tests: `_v = construire_vocab(["b a", "c a"])
assert _v == {"a": 0, "b": 1, "c": 2}, "Vocab trié alphabétiquement avec index 0, 1, 2"
_vocab = construire_vocab(["le chat dort", "le chien mange le os"])
assert vectoriser("le chat mange le chat", _vocab) == [2, 0, 0, 2, 1, 0], "Comptages aux bons index"
assert vectoriser("un mot inconnu", _vocab) == [0, 0, 0, 0, 0, 0], "Mots hors vocabulaire ignorés"
assert len(vectoriser("", _vocab)) == len(_vocab), "Toujours la longueur du vocabulaire"
print("TESTS_PASS")`,
              hints: [
                'Un set() pour collecter les mots uniques, puis sorted() + enumerate pour les index.',
                'vectoriser : commence par [0] * len(vocab), puis incrémente vecteur[vocab[mot]] pour chaque mot connu.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Quelle information le bag of words perd-il complètement ?',
                options: [
                  'La fréquence des mots',
                  'L\'ordre des mots (et donc la syntaxe : "le chat mord le chien" = "le chien mord le chat")',
                  'La casse',
                  'La langue du document',
                ],
                correct: 1,
                explanation: 'Les deux phrases donnent exactement le même vecteur. Cette limite a motivé les n-grammes, puis les RNN, puis les transformers — qui traitent la séquence, pas le sac.',
              },
              {
                question: 'Pour un vocabulaire de 50 000 mots, à quoi ressemble le vecteur d\'un tweet de 15 mots ?',
                options: [
                  'Un vecteur dense de dimension 15',
                  'Un vecteur de dimension 50 000, presque entièrement rempli de zéros',
                  'Une matrice 15 × 50 000',
                  'Un dictionnaire de 50 000 clés',
                ],
                correct: 1,
                explanation: 'C\'est le problème de la *sparsité* : d\'immenses vecteurs creux. Les embeddings neuronaux (dimension 300-4096, denses) sont précisément la réponse moderne à ce problème.',
              },
            ],
          },
        ],
      },
      {
        id: 'm6l2',
        title: 'TF-IDF : pondérer ce qui compte',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Le problème des comptages bruts

Dans un moteur de recherche bag of words, « le » et « de » dominent tous les scores : très fréquents, jamais informatifs. **TF-IDF** corrige ça avec une idée simple : *un mot compte s'il est fréquent dans CE document mais rare dans LES AUTRES*.

## La formule

Pour un mot \`m\` dans un document \`d\` :

\`\`\`
tf(m, d)   = nombre d'occurrences de m dans d
idf(m)     = log(N / df(m))          # N = nb docs, df = nb docs contenant m
tfidf(m,d) = tf(m, d) * idf(m)
\`\`\`

- Un mot présent dans **tous** les documents : \`idf = log(N/N) = 0\` → poids nul. « Le » disparaît de lui-même, sans liste de stopwords !
- Un mot rare : \`idf\` élevé → ses occurrences pèsent lourd.

## Le moteur de recherche

Score d'un document pour une requête = somme des tf-idf des mots de la requête :

\`\`\`
score(d, requete) = somme des tfidf(m, d) pour chaque mot m de la requête
\`\`\`

Classe les documents par score décroissant : c'est un moteur de recherche. Les vrais systèmes (Elasticsearch, et la moitié des pipelines RAG en mode « recherche hybride ») utilisent **BM25**, un raffinement direct de cette formule — le cœur conceptuel est identique.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm6l2e1',
              title: 'Moteur de recherche TF-IDF',
              instructions: `À partir de \`docs\` (liste de listes de tokens), implémente :

1. \`idf(mot, docs)\` — \`log(N / df)\` avec \`math.log\` ; si le mot n'apparaît dans aucun doc, renvoie \`0.0\`,
2. \`score(doc, requete, docs)\` — somme, pour chaque mot de la requête (liste de tokens), de \`tf * idf\` où \`tf\` est le comptage du mot dans \`doc\`,
3. \`chercher(requete, docs)\` — renvoie l'indice du document au meilleur score.`,
              starterCode: `import math

docs = [
    ["le", "chat", "mange", "le", "poisson"],
    ["le", "chien", "mange", "le", "os"],
    ["le", "poisson", "nage", "dans", "le", "lac"],
]

def idf(mot, docs):
    ...

def score(doc, requete, docs):
    ...

def chercher(requete, docs):
    ...

print(round(idf("poisson", docs), 3))
print(chercher(["poisson", "mange"], docs))`,
              solution: `import math

docs = [
    ["le", "chat", "mange", "le", "poisson"],
    ["le", "chien", "mange", "le", "os"],
    ["le", "poisson", "nage", "dans", "le", "lac"],
]

def idf(mot, docs):
    df = sum(1 for d in docs if mot in d)
    if df == 0:
        return 0.0
    return math.log(len(docs) / df)

def score(doc, requete, docs):
    total = 0.0
    for mot in requete:
        tf = doc.count(mot)
        total += tf * idf(mot, docs)
    return total

def chercher(requete, docs):
    scores = [score(d, requete, docs) for d in docs]
    return scores.index(max(scores))

print(round(idf("poisson", docs), 3))
print(chercher(["poisson", "mange"], docs))`,
              tests: `import math
assert abs(idf("le", docs)) < 1e-9, "'le' est dans tous les docs : idf = log(3/3) = 0"
assert abs(idf("chat", docs) - math.log(3)) < 1e-9, "'chat' dans 1 doc sur 3 : idf = log(3)"
assert idf("dragon", docs) == 0.0, "Mot absent partout : 0.0 (pas de division par zéro !)"
assert chercher(["poisson", "mange"], docs) == 0, "Doc 0 contient 'poisson' ET 'mange'"
assert chercher(["nage"], docs) == 2, "'nage' n'est que dans le doc 2"
_s0 = score(docs[0], ["le", "le", "le"], docs)
assert abs(_s0) < 1e-9, "Une requête de stopwords doit donner un score nul — c'est la magie du TF-IDF"
print("TESTS_PASS")`,
              hints: [
                'df = sum(1 for d in docs if mot in d) — le nombre de documents contenant le mot.',
                'tf = doc.count(mot) — les listes Python ont une méthode count.',
                'chercher : calcule tous les scores puis scores.index(max(scores)).',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi idf("le") vaut-il 0 si "le" apparaît dans tous les documents ?',
                options: [
                  'C\'est un bug de la formule',
                  'log(N/N) = log(1) = 0 : un mot présent partout ne discrimine rien, son poids s\'annule naturellement',
                  'Parce que "le" est dans une liste de stopwords',
                  'Parce que tf vaut 0',
                ],
                correct: 1,
                explanation: 'C\'est l\'élégance de TF-IDF : le filtrage des mots vides émerge de la statistique du corpus, sans aucune liste manuelle — et il s\'adapte au domaine (dans un corpus médical, "patient" devient un quasi-stopword).',
              },
              {
                question: 'Quelle limite de TF-IDF les embeddings neuronaux résolvent-ils ?',
                options: [
                  'La lenteur de calcul',
                  'TF-IDF ne voit aucun lien entre "voiture" et "automobile" : sans mot exact commun, score nul',
                  'TF-IDF ne gère pas les corpus de plus de 1000 documents',
                  'TF-IDF nécessite un GPU',
                ],
                correct: 1,
                explanation: 'TF-IDF est purement lexical : synonymes et paraphrases lui échappent. Les embeddings capturent la *sémantique* — "voiture" et "automobile" ont des vecteurs proches. Les meilleurs systèmes RAG combinent d\'ailleurs les deux (recherche hybride).',
              },
            ],
          },
        ],
      },
      {
        id: 'm6l3',
        title: 'Évaluer un moteur de recherche : précision@k',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# « Mon moteur est-il bon ? » — prouve-le

Tu as deux moteurs (comptage brut et TF-IDF). Lequel est meilleur ? *L'impression* ne suffit pas : il faut un **jeu de test** et une **métrique**. C'est le même réflexe que le module 13 côté LLM — et en recherche d'information, la métrique reine s'appelle **précision@k**.

## Le jeu de test de retrieval

Pour chaque requête, on annote à la main les documents *réellement pertinents* :

\`\`\`
jeu = [
    {"requete": "chat qui dort", "pertinents": {0, 4}},
    {"requete": "recette gateau", "pertinents": {2}},
]
\`\`\`

## Précision@k

Le moteur renvoie ses k premiers résultats. Quelle fraction est pertinente ?

\`\`\`
precision@k = |top_k ∩ pertinents| / k
\`\`\`

Exemple : top-3 = [4, 1, 0], pertinents = {0, 4} → 2/3 ≈ 0.67. On moyenne ensuite sur toutes les requêtes du jeu. (Sa jumelle, le **rappel@k**, divise par le nombre de pertinents — « en ai-je retrouvé la totalité ? ». Les deux se lisent ensemble.)

## Pourquoi c'est LE réflexe à avoir

Chunking différent, embeddings différents, TF-IDF vs sémantique, hybride… chaque variante de ton RAG se compare **sur les mêmes requêtes annotées**. Sans ça, on « améliore » à l'aveugle. Avec ça, chaque changement a un chiffre.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm6l3e1',
              title: 'Benchmark de deux moteurs',
              instructions: `Le starter fournit deux moteurs jouets (\`moteur_naif\` et \`moteur_tfidf\`, interface : \`moteur(requete, k)\` → liste d'indices) et un jeu de test. Implémente :

1. \`precision_at_k(resultats, pertinents, k)\` — la fraction des \`k\` premiers résultats qui sont dans l'ensemble \`pertinents\`,
2. \`evaluer_moteur(moteur, jeu, k)\` — la précision@k **moyenne** sur le jeu de test,
3. \`comparer(m1, m2, jeu, k)\` — renvoie \`"moteur1"\`, \`"moteur2"\` ou \`"egalite"\`.`,
              starterCode: `JEU = [
    {"requete": "q1", "pertinents": {0, 4}},
    {"requete": "q2", "pertinents": {2}},
    {"requete": "q3", "pertinents": {1, 3}},
]

def moteur_naif(requete, k):
    return {"q1": [1, 0, 2], "q2": [2, 0, 1], "q3": [0, 2, 4]}[requete][:k]

def moteur_tfidf(requete, k):
    return {"q1": [4, 0, 1], "q2": [2, 1, 0], "q3": [3, 1, 0]}[requete][:k]

def precision_at_k(resultats, pertinents, k):
    ...

def evaluer_moteur(moteur, jeu, k):
    ...

def comparer(m1, m2, jeu, k):
    ...

print("naïf  :", evaluer_moteur(moteur_naif, JEU, 2))
print("tfidf :", evaluer_moteur(moteur_tfidf, JEU, 2))
print("gagnant :", comparer(moteur_naif, moteur_tfidf, JEU, 2))`,
              solution: `JEU = [
    {"requete": "q1", "pertinents": {0, 4}},
    {"requete": "q2", "pertinents": {2}},
    {"requete": "q3", "pertinents": {1, 3}},
]

def moteur_naif(requete, k):
    return {"q1": [1, 0, 2], "q2": [2, 0, 1], "q3": [0, 2, 4]}[requete][:k]

def moteur_tfidf(requete, k):
    return {"q1": [4, 0, 1], "q2": [2, 1, 0], "q3": [3, 1, 0]}[requete][:k]

def precision_at_k(resultats, pertinents, k):
    top = resultats[:k]
    return sum(1 for r in top if r in pertinents) / k

def evaluer_moteur(moteur, jeu, k):
    scores = [precision_at_k(moteur(cas["requete"], k), cas["pertinents"], k) for cas in jeu]
    return sum(scores) / len(scores)

def comparer(m1, m2, jeu, k):
    s1, s2 = evaluer_moteur(m1, jeu, k), evaluer_moteur(m2, jeu, k)
    if s1 > s2:
        return "moteur1"
    if s2 > s1:
        return "moteur2"
    return "egalite"

print("naïf  :", evaluer_moteur(moteur_naif, JEU, 2))
print("tfidf :", evaluer_moteur(moteur_tfidf, JEU, 2))
print("gagnant :", comparer(moteur_naif, moteur_tfidf, JEU, 2))`,
              tests: `assert precision_at_k([4, 1, 0], {0, 4}, 3) == 2/3, "2 pertinents sur 3 résultats"
assert precision_at_k([4, 1, 0], {0, 4}, 1) == 1.0, "Le premier résultat est pertinent"
assert precision_at_k([1, 2], {0, 4}, 2) == 0.0, "Aucun pertinent : 0"
_s_naif = evaluer_moteur(moteur_naif, JEU, 2)
_s_tfidf = evaluer_moteur(moteur_tfidf, JEU, 2)
assert abs(_s_naif - (0.5 + 0.5 + 0.0) / 3) < 1e-9, "Moteur naïf : moyenne de 0.5, 0.5, 0.0"
assert abs(_s_tfidf - (1.0 + 0.5 + 1.0) / 3) < 1e-9, "Moteur tfidf : moyenne de 1.0, 0.5, 1.0"
assert comparer(moteur_naif, moteur_tfidf, JEU, 2) == "moteur2", "Le tfidf doit gagner"
assert comparer(moteur_naif, moteur_naif, JEU, 2) == "egalite", "Un moteur contre lui-même : égalité"
print("TESTS_PASS")`,
              hints: [
                'precision_at_k : sum(1 for r in resultats[:k] if r in pertinents) / k.',
                'evaluer_moteur : une list comprehension des précisions par cas, puis la moyenne.',
                'comparer : calcule les deux moyennes et compare — attention au cas d\'égalité.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Précision@k = 0.9 mais rappel@k = 0.2. Qu\'est-ce que ça signifie ?',
                options: [
                  'Le moteur est mauvais sur toute la ligne',
                  'Ce qu\'il renvoie est presque toujours pertinent, mais il RATE 80 % des documents pertinents existants',
                  'Les deux métriques se contredisent, il y a un bug',
                  'Le moteur est parfait',
                ],
                correct: 1,
                explanation: 'Précision = pureté du top-k ; rappel = couverture des pertinents. Un RAG a surtout besoin de rappel (l\'info doit ÊTRE dans le contexte) — le LLM se charge d\'ignorer le superflu.',
              },
              {
                question: 'Pourquoi annoter les documents pertinents À LA MAIN plutôt que de faire confiance au moteur ?',
                options: [
                  'Par tradition',
                  'La vérité terrain doit être indépendante du système évalué — sinon on note le moteur avec sa propre copie',
                  'C\'est plus rapide',
                  'Les moteurs refusent de s\'auto-évaluer',
                ],
                correct: 1,
                explanation: 'Utiliser les sorties du système comme référence, c\'est l\'erreur circulaire classique. La valeur d\'un jeu de test vient précisément de son indépendance — même 20 requêtes bien annotées valent de l\'or.',
              },
            ],
          },
        ],
      },
    ],
  }
