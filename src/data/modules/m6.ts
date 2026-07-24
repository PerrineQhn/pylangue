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

Aucun algorithme ne travaille directement sur des mots : il lui faut des **vecteurs**. La méthode historique — toujours utilisée pour la recherche lexicale, les baselines et le monitoring — est le **bag of words** (sac de mots) : chaque document devient un vecteur de comptages, avec une dimension par mot du vocabulaire.

\`\`\`
Vocabulaire : ["chat", "chien", "dort", "mange"]
"le chat dort, le chat mange"  ->  [2, 0, 1, 1]
"le chien dort"                ->  [0, 1, 1, 0]
\`\`\`

## Pourquoi « sac » de mots ?

Parce que l'**ordre est perdu**, comme si on jetait tous les mots pêle-mêle dans un sac. « Le chat mange la souris » et « la souris mange le chat » produisent le *même* vecteur. C'est la grande limite de la méthode — et précisément la raison d'être des modèles séquentiels, puis des transformers, qui eux tiennent compte de la position.

## Construire la représentation

Deux étapes, que tu connais déjà par morceaux :

1. **le vocabulaire** : l'ensemble des mots du corpus, avec un index fixe par mot (le dictionnaire du module 2 !),
2. **la vectorisation** : pour chaque document, compter les occurrences de chaque mot du vocabulaire (le motif de comptage du module 1 !).

Empile les vecteurs, et tu obtiens une **matrice documents × mots** de forme \`(n_documents, taille_vocab)\`. C'est la structure de données de la recherche d'information classique, et l'entrée des premiers classifieurs de texte. Dans scikit-learn, tout ceci s'appelle \`CountVectorizer\` — aujourd'hui, tu l'écris toi-même.

## Le prix à payer : la sparsité

Pour un vocabulaire de 50 000 mots, le vecteur d'un tweet de 15 mots est un vecteur de dimension 50 000 rempli à 99,97 % de zéros. On parle de vecteurs **creux** (*sparse*). Ils sont énormes et peu informatifs — c'est exactement le problème que les embeddings neuronaux (denses, de dimension 300 à 4096) viennent résoudre.

## Pièges classiques

- **Vocabulaire local vs global.** Le vocabulaire doit être construit sur *tout* le corpus, puis appliqué à chaque document — sinon deux documents auraient des vecteurs de tailles différentes, incomparables.
- **Les mots hors vocabulaire.** À l'inférence, un mot jamais vu à l'entraînement n'a pas de colonne : on l'ignore (ou on prévoit une dimension \`<unk>\`). Ne plante pas dessus.
- **L'ordre des colonnes doit être fixe.** Trier le vocabulaire (alphabétiquement, par exemple) garantit des vecteurs reproductibles d'une exécution à l'autre — indispensable pour comparer ou sauvegarder un modèle.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm6l1e2',
              title: "Document frequency : dans combien de documents ?",
              instructions: `La brique qu'il te faudra pour l'IDF de la leçon suivante : \`document_frequency(documents)\` compte, pour chaque mot du corpus, **dans combien de documents** il apparaît (pas combien de fois au total !).

Un mot répété 10 fois dans un même document compte pour 1. L'astuce : convertir chaque document en \`set\` avant de compter.`,
              starterCode: `def document_frequency(documents):
    ...

docs = ["le chat dort le chat", "le chien dort", "un poisson"]
df = document_frequency(docs)
print(df)`,
              solution: `def document_frequency(documents):
    df = {}
    for doc in documents:
        for mot in set(doc.lower().split()):
            df[mot] = df.get(mot, 0) + 1
    return df

docs = ["le chat dort le chat", "le chien dort", "un poisson"]
df = document_frequency(docs)
print(df)`,
              tests: `_df = document_frequency(["le chat dort le chat", "le chien dort", "un poisson"])
assert _df["le"] == 2, "'le' apparaît dans 2 documents"
assert _df["chat"] == 1, "'chat' répété dans UN document : df = 1, pas 2 !"
assert _df["dort"] == 2, "'dort' dans 2 documents"
assert _df["poisson"] == 1, "'poisson' dans 1 document"
assert document_frequency([]) == {}, "Corpus vide"
print("TESTS_PASS")`,
              hints: [
                'set(doc.lower().split()) déduplique les mots AU SEIN du document.',
                'Puis le motif de comptage habituel sur ces sets.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm6l1e3',
              title: "Défi — La matrice documents × mots complète",
              instructions: `Assemble le vectoriseur de bout en bout, comme \`CountVectorizer.fit_transform\` : \`matrice_documents(documents)\` renvoie le tuple \`(vocab, matrice)\` où :

1. \`vocab\` est le dict \`mot → index\` trié alphabétiquement (ton exercice précédent),
2. \`matrice\` est la **liste de listes** \`(n_docs, taille_vocab)\` des comptages : \`matrice[d][vocab[mot]]\` = occurrences du mot dans le document d.

C'est la structure exacte sur laquelle tournaient les moteurs de recherche et les classifieurs avant le deep learning — et encore aujourd'hui les baselines.`,
              starterCode: `def matrice_documents(documents):
    ...

vocab, M = matrice_documents(["le chat dort", "le chien mange le os"])
print(vocab)
for ligne in M:
    print(ligne)`,
              solution: `def matrice_documents(documents):
    mots = set()
    for doc in documents:
        mots.update(doc.lower().split())
    vocab = {mot: i for i, mot in enumerate(sorted(mots))}
    matrice = []
    for doc in documents:
        ligne = [0] * len(vocab)
        for mot in doc.lower().split():
            ligne[vocab[mot]] += 1
        matrice.append(ligne)
    return vocab, matrice

vocab, M = matrice_documents(["le chat dort", "le chien mange le os"])
print(vocab)
for ligne in M:
    print(ligne)`,
              tests: `_v, _M = matrice_documents(["le chat dort", "le chien mange le os"])
assert _v == {"chat": 0, "chien": 1, "dort": 2, "le": 3, "mange": 4, "os": 5}, "Vocab global trié"
assert len(_M) == 2 and len(_M[0]) == 6, "Matrice (2 docs, 6 mots)"
assert _M[0][_v["chat"]] == 1 and _M[0][_v["os"]] == 0, "Comptages du doc 0"
assert _M[1][_v["le"]] == 2, "'le' apparaît 2 fois dans le doc 1"
_v2, _M2 = matrice_documents([])
assert _v2 == {} and _M2 == [], "Corpus vide"
print("TESTS_PASS")`,
              hints: [
                'Étape 1 : le vocab global (union des mots, trié, énuméré).',
                'Étape 2 : pour chaque doc, une ligne [0]*len(vocab) remplie par le motif de comptage.',
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

Dans un moteur de recherche bag of words, les mots « le », « de », « et » écrasent tous les scores : très fréquents, jamais informatifs. **TF-IDF** corrige ce défaut avec une idée d'une élégance rare : *un mot compte s'il est fréquent dans CE document mais rare dans LES autres*.

## L'intuition

Un mot qui apparaît partout ne distingue rien — il ne t'aide pas à choisir un document plutôt qu'un autre. Un mot rare, en revanche, est un signal fort : s'il est présent, c'est probablement le bon document. TF-IDF récompense donc la *rareté globale* autant que la *présence locale*.

## La formule

Pour un mot \`m\` dans un document \`d\`, sur un corpus de \`N\` documents :

\`\`\`
tf(m, d)   = nombre d'occurrences de m dans d
idf(m)     = log(N / df(m))          # df = nombre de documents contenant m
tfidf(m,d) = tf(m, d) × idf(m)
\`\`\`

- Un mot présent dans **tous** les documents : \`idf = log(N/N) = log(1) = 0\` → poids nul. « Le » disparaît *de lui-même*, sans aucune liste de stopwords, et de façon adaptée au domaine (dans un corpus médical, « patient » devient un quasi-stopword).
- Un mot rare : \`idf\` élevé → ses occurrences pèsent lourd.

## Le moteur de recherche

Le score d'un document pour une requête = la somme des TF-IDF des mots de la requête :

\`\`\`
score(d, requête) = Σ tfidf(m, d) pour chaque mot m de la requête
\`\`\`

Classe les documents par score décroissant, et tu as un moteur de recherche. Les vrais systèmes (Elasticsearch, et la moitié des pipelines RAG en mode « recherche hybride ») utilisent **BM25**, un raffinement direct de cette formule — le cœur conceptuel est identique à ce que tu vas coder.

## Pièges classiques

- **\`df = 0\` et la division par zéro.** Un mot absent du corpus donne \`df = 0\` : protège le \`log(N / df)\` en renvoyant \`0\` dans ce cas.
- **Fréquence de document, pas fréquence totale.** \`df(m)\` compte le nombre de *documents* contenant \`m\`, pas le nombre total d'occurrences. Un mot répété 50 fois dans un seul document a \`df = 1\`.
- **La limite lexicale.** TF-IDF ne voit aucun lien entre « voiture » et « automobile » : sans mot exact commun, le score est nul. C'est précisément ce que les embeddings sémantiques résolvent — d'où la recherche *hybride* (lexicale + sémantique) des meilleurs RAG.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm6l2e2',
              title: "TF relatif : normaliser par la longueur",
              instructions: `Un mot présent 3 fois dans un tweet pèse plus que 3 fois dans un roman. Le **TF relatif** corrige : \`tf_relatif(doc)\` renvoie le dict \`mot → fréquence / longueur du document\` (le doc est une liste de tokens ; dict vide si liste vide).

Arrondis chaque valeur à 4 décimales. C'est la variante de TF utilisée dans la plupart des formulations sérieuses de TF-IDF.`,
              starterCode: `def tf_relatif(doc):
    ...

print(tf_relatif(["le", "chat", "le"]))`,
              solution: `def tf_relatif(doc):
    if not doc:
        return {}
    tf = {}
    for mot in doc:
        tf[mot] = tf.get(mot, 0) + 1
    return {m: round(c / len(doc), 4) for m, c in tf.items()}

print(tf_relatif(["le", "chat", "le"]))`,
              tests: `_tf = tf_relatif(["le", "chat", "le"])
assert _tf == {"le": round(2/3, 4), "chat": round(1/3, 4)}, "Comptages divisés par la longueur"
assert tf_relatif([]) == {}, "Document vide : dict vide"
assert tf_relatif(["a"]) == {"a": 1.0}, "Un seul mot : fréquence 1.0"
assert abs(sum(tf_relatif(["a", "b", "b", "c"]).values()) - 1.0) < 0.001, "Les fréquences relatives somment à ~1"
print("TESTS_PASS")`,
              hints: [
                'Compter d\'abord, puis diviser dans une dict comprehension finale.',
                'Le cas vide en premier, comme toujours.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm6l2e3',
              title: "Défi — Classement complet des résultats",
              instructions: `Ton moteur renvoyait le meilleur document ; un vrai moteur renvoie une **page de résultats classée**. Avec \`idf\` et \`score\` fournis (ceux de la leçon), écris \`rechercher(requete, docs, k)\` qui renvoie la liste des \`k\` indices de documents, triés par score décroissant, **en excluant les documents à score nul** (aucun mot commun avec la requête — les afficher serait du bruit).`,
              starterCode: `import math

def idf(mot, docs):
    df = sum(1 for d in docs if mot in d)
    return math.log(len(docs) / df) if df else 0.0

def score(doc, requete, docs):
    return sum(doc.count(m) * idf(m, docs) for m in requete)

DOCS = [
    ["chat", "mange", "poisson"],
    ["chien", "mange", "os"],
    ["poisson", "nage", "lac"],
    ["voiture", "roule", "vite"],
]

def rechercher(requete, docs, k=3):
    ...

print(rechercher(["poisson", "mange"], DOCS, k=3))`,
              solution: `import math

def idf(mot, docs):
    df = sum(1 for d in docs if mot in d)
    return math.log(len(docs) / df) if df else 0.0

def score(doc, requete, docs):
    return sum(doc.count(m) * idf(m, docs) for m in requete)

DOCS = [
    ["chat", "mange", "poisson"],
    ["chien", "mange", "os"],
    ["poisson", "nage", "lac"],
    ["voiture", "roule", "vite"],
]

def rechercher(requete, docs, k=3):
    scores = [(i, score(d, requete, docs)) for i, d in enumerate(docs)]
    pertinents = [(i, sc) for i, sc in scores if sc > 0]
    pertinents.sort(key=lambda p: -p[1])
    return [i for i, _ in pertinents[:k]]

print(rechercher(["poisson", "mange"], DOCS, k=3))`,
              tests: `_r = rechercher(["poisson", "mange"], DOCS, k=3)
assert _r[0] == 0, "Le doc 0 (poisson ET mange) doit être premier"
assert 3 not in _r, "Le doc 'voiture' (score nul) ne doit PAS apparaître"
assert set(_r) == {0, 1, 2}, "Les trois documents pertinents"
assert rechercher(["dragon"], DOCS) == [], "Requête sans aucun match : liste vide"
assert rechercher(["nage"], DOCS, k=1) == [2], "Un seul résultat pertinent"
print("TESTS_PASS")`,
              hints: [
                'Construis les paires (indice, score) avec enumerate, filtre les scores > 0, trie par -score.',
                'La troncature [:k] vient APRÈS le tri.',
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

Tu as maintenant deux moteurs de recherche : comptage brut et TF-IDF. Lequel est meilleur ? *L'impression* ne suffit pas — en entreprise, les décisions se prennent sur des chiffres. Il te faut un **jeu de test** et une **métrique**. C'est le même réflexe que pour l'évaluation des LLM (module 13), et en recherche d'information, la métrique reine s'appelle **précision@k**.

## Le jeu de test de retrieval

Pour chaque requête, on annote *à la main* les documents réellement pertinents :

\`\`\`
jeu = [
    {"requête": "chat qui dort", "pertinents": {0, 4}},
    {"requête": "recette gâteau", "pertinents": {2}},
]
\`\`\`

Ces annotations sont la **vérité terrain** : elles doivent être indépendantes du système évalué, sinon on note le moteur avec sa propre copie.

## Précision@k et rappel@k

Le moteur renvoie ses \`k\` premiers résultats. Deux questions complémentaires :

\`\`\`
précision@k = |top_k ∩ pertinents| / k       # « ce que je montre est-il bon ? »
rappel@k    = |top_k ∩ pertinents| / |pertinents|  # « ai-je tout retrouvé ? »
\`\`\`

Exemple : top-3 = \`[4, 1, 0]\`, pertinents = \`{0, 4}\` → précision = 2/3, rappel = 2/2 = 1. On moyenne ensuite sur toutes les requêtes du jeu, et on compare les variantes **sur le même jeu de test**.

## Quelle métrique privilégier ?

Un RAG a surtout besoin de **rappel** : l'information *doit* figurer dans le contexte injecté, quitte à y ajouter un peu de bruit — le LLM se chargera d'ignorer le superflu. Un moteur affiché à l'utilisateur privilégie la **précision** : personne ne lit la page 3 des résultats.

## Pièges classiques

- **Comparer sur des jeux différents.** Deux moteurs ne se comparent que sur les *mêmes* requêtes annotées. Changer de jeu entre deux mesures rend le verdict absurde.
- **Se noter sur ses propres sorties.** Utiliser les résultats du moteur comme « pertinents » de référence est une erreur circulaire : le score sera parfait et ne voudra rien dire.
- **Croire qu'un petit jeu est inutile.** 20 à 50 requêtes bien annotées valent mieux que 5 000 bâclées. La qualité de l'annotation prime sur la quantité.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm6l3e2',
              title: "Le rappel@k, jumeau de la précision",
              instructions: `La précision dit « ce que je montre est-il bon ? », le **rappel** dit « ai-je retrouvé tout ce qui existe ? » :

\`rappel_at_k(resultats, pertinents, k)\` = |top-k ∩ pertinents| / |pertinents|.

Convention pour le cas limite : si \`pertinents\` est vide, renvoie \`1.0\` (il n'y avait rien à retrouver — mission trivialement accomplie).`,
              starterCode: `def rappel_at_k(resultats, pertinents, k):
    ...

print(rappel_at_k([4, 1, 0], {0, 4, 7}, 3))`,
              solution: `def rappel_at_k(resultats, pertinents, k):
    if not pertinents:
        return 1.0
    top = resultats[:k]
    return sum(1 for r in top if r in pertinents) / len(pertinents)

print(rappel_at_k([4, 1, 0], {0, 4, 7}, 3))`,
              tests: `assert abs(rappel_at_k([4, 1, 0], {0, 4, 7}, 3) - 2/3) < 1e-9, "2 des 3 pertinents retrouvés"
assert rappel_at_k([1, 2], {1, 2}, 2) == 1.0, "Tout retrouvé"
assert rappel_at_k([5, 6], {1, 2}, 2) == 0.0, "Rien retrouvé"
assert rappel_at_k([1], set(), 1) == 1.0, "Aucun pertinent : 1.0 par convention"
assert abs(rappel_at_k([1, 2, 3], {1, 2, 3, 4}, 2) - 2/4) < 1e-9, "Seul le top-k compte, même si k < nb pertinents"
print("TESTS_PASS")`,
              hints: [
                'Même structure que precision_at_k, mais on divise par len(pertinents).',
                'Le cas pertinents vide se traite avant la division.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm6l3e3',
              title: "Défi — La courbe précision selon k",
              instructions: `Pour choisir combien de chunks injecter dans ton RAG, on trace la précision moyenne **pour plusieurs valeurs de k** : \`courbe_precision(moteur, jeu, valeurs_k)\` renvoie le dict \`k → précision@k moyenne\` (arrondie à 3 décimales).

Le starter fournit \`precision_at_k\`, un moteur jouet et un jeu de test. Bonus d'interprétation : la précision **décroît** presque toujours quand k grandit — chaque résultat supplémentaire est moins sûr que le précédent.`,
              starterCode: `def precision_at_k(resultats, pertinents, k):
    top = resultats[:k]
    return sum(1 for r in top if r in pertinents) / k

def moteur(requete, k):
    return {"q1": [0, 4, 2], "q2": [2, 1, 0], "q3": [3, 0, 1]}[requete][:k]

JEU = [
    {"requete": "q1", "pertinents": {0, 4}},
    {"requete": "q2", "pertinents": {2}},
    {"requete": "q3", "pertinents": {3, 1}},
]

def courbe_precision(moteur, jeu, valeurs_k):
    ...

print(courbe_precision(moteur, JEU, [1, 2, 3]))`,
              solution: `def precision_at_k(resultats, pertinents, k):
    top = resultats[:k]
    return sum(1 for r in top if r in pertinents) / k

def moteur(requete, k):
    return {"q1": [0, 4, 2], "q2": [2, 1, 0], "q3": [3, 0, 1]}[requete][:k]

JEU = [
    {"requete": "q1", "pertinents": {0, 4}},
    {"requete": "q2", "pertinents": {2}},
    {"requete": "q3", "pertinents": {3, 1}},
]

def courbe_precision(moteur, jeu, valeurs_k):
    courbe = {}
    for k in valeurs_k:
        scores = [precision_at_k(moteur(cas["requete"], k), cas["pertinents"], k) for cas in jeu]
        courbe[k] = round(sum(scores) / len(scores), 3)
    return courbe

print(courbe_precision(moteur, JEU, [1, 2, 3]))`,
              tests: `_c = courbe_precision(moteur, JEU, [1, 2, 3])
assert set(_c.keys()) == {1, 2, 3}, "Une entrée par valeur de k"
assert _c[1] == 1.0, "À k=1, les trois moteurs mettent un pertinent en tête"
assert _c[2] == round((1.0 + 0.5 + 0.5) / 3, 3), "À k=2 : q1 parfait, q2 et q3 à moitié"
assert _c[3] == round((2/3 + 1/3 + 2/3) / 3, 3), "À k=3"
assert _c[1] >= _c[2] >= _c[3], "La précision décroît quand k grandit (sur ce jeu)"
print("TESTS_PASS")`,
              hints: [
                'Une boucle sur valeurs_k, et dedans la moyenne des précisions du jeu (comme evaluer_moteur).',
                'Arrondis chaque moyenne à 3 décimales avant de la ranger.',
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
