import type { Module } from '@/lib/types'

export const tier2: Module[] = [
  {
    id: 'm5',
    tier: 2,
    title: 'NumPy, le langage des tenseurs',
    tagline: 'Vecteurs, matrices et vectorisation : la grammaire de tout le deep learning.',
    status: 'ready',
    lessons: [
      {
        id: 'm5l1',
        title: 'Arrays, shapes et vectorisation',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# NumPy : pourquoi c'est incontournable

PyTorch, TensorFlow, JAX… toutes les bibliothèques de deep learning sont des variations autour du même objet : le **tableau multidimensionnel** (array/tenseur). NumPy est l'original — apprendre à *penser en arrays* est le vrai objectif de ce module.

## Créer et inspecter

\`\`\`
import numpy as np

v = np.array([1.0, 2.0, 3.0])        # vecteur, shape (3,)
M = np.array([[1, 2], [3, 4]])       # matrice, shape (2, 2)
v.shape, M.shape, M.dtype
\`\`\`

Le réflexe n°1 en debug de code ML : **imprimer les shapes**. La moitié des bugs de deep learning sont des erreurs de shape.

## La vectorisation : jamais de boucle

\`\`\`
v * 2          # multiplie chaque élément
v + w          # addition élément par élément
v * w          # produit élément par élément (PAS le produit scalaire !)
v @ w          # produit scalaire (dot product)
np.sqrt(v)     # fonction appliquée à chaque élément
v.sum(), v.mean(), v.max()
\`\`\`

En NLP, un mot devient un **vecteur** (embedding), une phrase une **matrice** (une ligne par token), un batch un **tenseur 3D**. Les opérations vectorisées sont des centaines de fois plus rapides que des boucles Python — et surtout, elles correspondent aux maths des articles de recherche.

## Le produit scalaire, star du NLP

\`v @ w = v₁w₁ + v₂w₂ + …\` mesure à quel point deux vecteurs « pointent dans la même direction ». C'est le cœur de la similarité d'embeddings **et** des scores d'attention des transformers (palier 3). Retiens : *produit scalaire = similarité brute*.`,
          },
          {
            kind: 'code',
            title: 'Penser en arrays — exécute et observe les shapes',
            runnable: true,
            needsNumpy: true,
            code: `import numpy as np

# 4 "embeddings" de dimension 3 (une ligne = un mot)
E = np.array([
    [0.9, 0.1, 0.0],   # chat
    [0.8, 0.2, 0.1],   # chien
    [0.0, 0.1, 0.9],   # voiture
    [0.1, 0.0, 0.8],   # camion
])
print("shape :", E.shape)

chat = E[0]
print("norme de 'chat' :", np.linalg.norm(chat))

# Produit scalaire de 'chat' avec TOUS les mots d'un coup :
scores = E @ chat          # (4,3) @ (3,) -> (4,)
print("similarités brutes :", scores)
print("mot le plus proche (hors lui-même) :", scores[1:].argmax() + 1)`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm5l1e1',
              title: 'Normaliser des vecteurs (norme L2)',
              instructions: `Les embeddings sont souvent **normalisés** : divisés par leur norme pour avoir une longueur de 1. Écris \`normaliser_l2(M)\` qui prend une matrice \`(n, d)\` et renvoie la matrice où **chaque ligne** a une norme de 1.

Indices : \`np.linalg.norm(M, axis=1)\` donne la norme de chaque ligne (shape \`(n,)\`) ; pour diviser une matrice \`(n, d)\` par un vecteur \`(n,)\`, il faut le remodeler en \`(n, 1)\` avec \`.reshape(-1, 1)\` ou \`[:, None]\` — c'est le *broadcasting*.`,
              starterCode: `import numpy as np

def normaliser_l2(M):
    ...

M = np.array([[3.0, 4.0], [0.0, 2.0]])
print(normaliser_l2(M))`,
              solution: `import numpy as np

def normaliser_l2(M):
    normes = np.linalg.norm(M, axis=1)
    return M / normes[:, None]

M = np.array([[3.0, 4.0], [0.0, 2.0]])
print(normaliser_l2(M))`,
              tests: `import numpy as np
_M = np.array([[3.0, 4.0], [0.0, 2.0]])
_R = normaliser_l2(_M)
assert _R.shape == (2, 2), "La shape doit être conservée"
assert np.allclose(_R[0], [0.6, 0.8]), "Ligne 0 : [3,4]/5 = [0.6, 0.8]"
assert np.allclose(np.linalg.norm(_R, axis=1), [1.0, 1.0]), "Chaque ligne doit avoir une norme de 1"
print("TESTS_PASS")`,
              hints: [
                'np.linalg.norm(M, axis=1) → normes de chaque ligne, shape (n,).',
                'normes[:, None] transforme (n,) en (n, 1) : la division se diffuse alors ligne par ligne.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Quelle est la shape du résultat de A @ B si A est (32, 128) et B est (128, 64) ?',
                options: ['(32, 64)', '(128, 128)', '(64, 32)', 'Erreur : shapes incompatibles'],
                correct: 0,
                explanation: '(n, k) @ (k, m) → (n, m) : les dimensions internes (128) doivent coïncider et disparaissent. C\'est LA règle à connaître par cœur — c\'est elle qui régit toutes les couches d\'un réseau.',
              },
              {
                question: 'Quelle est la différence entre v * w et v @ w pour deux vecteurs ?',
                options: [
                  'Aucune',
                  'v * w est élément par élément (renvoie un vecteur), v @ w est le produit scalaire (renvoie un nombre)',
                  'v @ w est plus lent',
                  'v * w n\'existe pas en NumPy',
                ],
                correct: 1,
                explanation: 'Confusion classique ! * multiplie terme à terme, @ somme ensuite ces produits. Le produit scalaire mesure la similarité — on le retrouvera dans l\'attention.',
              },
            ],
          },
        ],
      },
      {
        id: 'm5l2',
        title: 'Similarité cosinus et recherche sémantique',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# La similarité cosinus : le moteur du RAG

Quand un système RAG (Retrieval-Augmented Generation) cherche « les passages les plus pertinents » pour une question, il calcule presque toujours une **similarité cosinus** entre l'embedding de la question et ceux des documents. Toute base vectorielle (Pinecone, Chroma, pgvector, FAISS…) fait ça à grande échelle.

## La formule

\`\`\`
cos(u, v) = (u @ v) / (||u|| * ||v||)
\`\`\`

- Vaut **1** si les vecteurs pointent exactement dans la même direction
- **0** s'ils sont orthogonaux (sans rapport)
- **-1** s'ils sont opposés

Diviser par les normes rend la mesure **indépendante de la longueur** des vecteurs : seule la *direction* compte — et dans un espace d'embeddings, la direction encode le *sens*.

## Recherche sémantique en 3 lignes

Avec une matrice \`E\` d'embeddings normalisés (norme 1), la similarité cosinus se réduit au produit scalaire :

\`\`\`
scores = E @ q          # q : embedding normalisé de la requête
meilleur = scores.argmax()
\`\`\`

C'est *exactement* ce que fait une base vectorielle, plus des structures d'index pour aller vite sur des millions de vecteurs. Le concept tient en deux lignes de NumPy.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm5l2e1',
              title: 'Mini moteur de recherche sémantique',
              instructions: `Implémente :

1. \`cosinus(u, v)\` — la similarité cosinus entre deux vecteurs (utilise \`np.linalg.norm\`)
2. \`chercher(E, q)\` — renvoie l'**indice** de la ligne de \`E\` la plus similaire (au sens cosinus) au vecteur requête \`q\`

Pour \`chercher\`, une boucle sur les lignes avec \`cosinus\` est acceptable — ou la version vectorisée pour les ambitieux.`,
              starterCode: `import numpy as np

def cosinus(u, v):
    ...

def chercher(E, q):
    ...

# Embeddings jouets : chat, chien, voiture
E = np.array([[0.9, 0.1, 0.0],
              [0.8, 0.3, 0.1],
              [0.0, 0.1, 0.9]])
q = np.array([1.0, 0.2, 0.0])   # requête proche de "chat"
print(chercher(E, q))`,
              solution: `import numpy as np

def cosinus(u, v):
    return (u @ v) / (np.linalg.norm(u) * np.linalg.norm(v))

def chercher(E, q):
    scores = [cosinus(ligne, q) for ligne in E]
    return int(np.argmax(scores))

E = np.array([[0.9, 0.1, 0.0],
              [0.8, 0.3, 0.1],
              [0.0, 0.1, 0.9]])
q = np.array([1.0, 0.2, 0.0])
print(chercher(E, q))`,
              tests: `import numpy as np
assert abs(cosinus(np.array([1.0, 0.0]), np.array([1.0, 0.0])) - 1.0) < 1e-9, "Deux vecteurs identiques : cosinus = 1"
assert abs(cosinus(np.array([1.0, 0.0]), np.array([0.0, 1.0]))) < 1e-9, "Vecteurs orthogonaux : cosinus = 0"
assert abs(cosinus(np.array([2.0, 0.0]), np.array([5.0, 0.0])) - 1.0) < 1e-9, "La longueur ne doit pas compter, seulement la direction"
_E = np.array([[0.9, 0.1, 0.0], [0.8, 0.3, 0.1], [0.0, 0.1, 0.9]])
assert chercher(_E, np.array([1.0, 0.2, 0.0])) == 0, "La requête est la plus proche de la ligne 0"
assert chercher(_E, np.array([0.1, 0.0, 1.0])) == 2, "Cette requête est la plus proche de la ligne 2"
print("TESTS_PASS")`,
              hints: [
                'cosinus : (u @ v) divisé par le produit des deux normes.',
                'chercher : calcule la liste des similarités puis np.argmax. Pense à convertir en int().',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi la similarité cosinus plutôt que le simple produit scalaire ?',
                options: [
                  'Elle est plus rapide à calculer',
                  'Elle ignore la longueur des vecteurs et ne compare que leur direction',
                  'Elle donne toujours des valeurs positives',
                  'Le produit scalaire ne marche pas en dimension > 3',
                ],
                correct: 1,
                explanation: 'Un document long peut avoir un embedding de grande norme sans être plus pertinent. La normalisation rend la comparaison équitable. (Beaucoup de modèles d\'embeddings sortent d\'ailleurs des vecteurs déjà normalisés.)',
              },
              {
                question: 'Dans un pipeline RAG, à quel moment intervient la similarité cosinus ?',
                options: [
                  'Pendant la génération de la réponse par le LLM',
                  'Lors de la récupération (retrieval) des passages les plus proches de la question',
                  'Pendant le fine-tuning',
                  'Elle n\'intervient pas dans le RAG',
                ],
                correct: 1,
                explanation: 'RAG = retrieval puis génération. Le retrieval compare l\'embedding de la question à ceux des chunks de documents — par similarité cosinus — puis injecte les meilleurs passages dans le prompt.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
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
    ],
  },
  {
    id: 'm7',
    tier: 2,
    title: 'Un neurone, puis un réseau',
    tagline: 'Régression logistique et descente de gradient from scratch : les mécanismes qui entraînent aussi GPT.',
    status: 'ready',
    lessons: [
      {
        id: 'm7l1',
        title: 'Le neurone : produit scalaire + sigmoïde',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# L'unité de base de tout le deep learning

Un « neurone » artificiel n'a rien de mystérieux : c'est un **produit scalaire suivi d'une fonction non linéaire**. Tu as déjà tous les ingrédients.

## La prédiction

Pour un vecteur d'entrée \`x\` (par exemple : les features d'une critique de film), des poids \`w\` et un biais \`b\` :

\`\`\`
z = w @ x + b          # le "logit" : un score brut, de -inf à +inf
p = sigmoid(z)         # une probabilité, entre 0 et 1
\`\`\`

La **sigmoïde** écrase le score en probabilité :

\`\`\`
sigmoid(z) = 1 / (1 + exp(-z))
\`\`\`

- \`z\` très négatif → p ≈ 0 (classe « négatif »)
- \`z = 0\` → p = 0.5 (incertitude totale)
- \`z\` très positif → p ≈ 1 (classe « positif »)

## Ce que "apprendre" veut dire

Les poids \`w\` encodent l'importance de chaque feature : un poids positif pour « excellent », négatif pour « ennuyeux ». *Apprendre = trouver les bons poids* — c'est l'objet de la leçon suivante. Pour l'instant, on construit la machine à prédire.

> Un LLM entier n'est que ce motif répété : des produits matriciels (des milliards de « neurones ») entrecoupés de non-linéarités. La sortie finale — softmax sur le vocabulaire — est la cousine multiclasse de cette sigmoïde.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm7l1e1',
              title: 'Construire le neurone',
              instructions: `Implémente en NumPy :

1. \`sigmoid(z)\` — doit fonctionner sur un scalaire **ou** un array (np.exp est vectorisé, profites-en),
2. \`predire_proba(X, w, b)\` — pour une matrice \`X\` de shape \`(n, d)\` (n exemples, d features) : renvoie les \`n\` probabilités, soit \`sigmoid(X @ w + b)\`,
3. \`predire_classe(X, w, b)\` — renvoie 1 quand la probabilité dépasse 0.5, sinon 0 (astuce : \`(probas >= 0.5).astype(int)\`).`,
              starterCode: `import numpy as np

def sigmoid(z):
    ...

def predire_proba(X, w, b):
    ...

def predire_classe(X, w, b):
    ...

# 3 critiques, 2 features : [nb mots positifs, nb mots négatifs]
X = np.array([[3.0, 0.0], [0.0, 2.0], [1.0, 1.0]])
w = np.array([1.5, -1.5])   # poids "sensés" fixés à la main
b = 0.0
print(predire_proba(X, w, b).round(3))
print(predire_classe(X, w, b))`,
              solution: `import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def predire_proba(X, w, b):
    return sigmoid(X @ w + b)

def predire_classe(X, w, b):
    return (predire_proba(X, w, b) >= 0.5).astype(int)

X = np.array([[3.0, 0.0], [0.0, 2.0], [1.0, 1.0]])
w = np.array([1.5, -1.5])
b = 0.0
print(predire_proba(X, w, b).round(3))
print(predire_classe(X, w, b))`,
              tests: `import numpy as np
assert abs(sigmoid(0) - 0.5) < 1e-9, "sigmoid(0) = 0.5"
assert sigmoid(100) > 0.999 and sigmoid(-100) < 0.001, "Saturation aux extrêmes"
_z = sigmoid(np.array([-1.0, 0.0, 1.0]))
assert _z.shape == (3,), "sigmoid doit être vectorisée (marcher sur un array)"
_X = np.array([[3.0, 0.0], [0.0, 2.0], [1.0, 1.0]])
_w = np.array([1.5, -1.5])
_p = predire_proba(_X, _w, 0.0)
assert _p.shape == (3,), "Une probabilité par exemple"
assert _p[0] > 0.9, "3 mots positifs, 0 négatif : probabilité haute"
assert _p[1] < 0.1, "0 positif, 2 négatifs : probabilité basse"
assert list(predire_classe(_X, _w, 0.0)) == [1, 0, 1], "Seuil à 0.5 (1-1 avec poids symétriques donne z=0, p=0.5 -> classe 1)"
print("TESTS_PASS")`,
              hints: [
                'sigmoid : littéralement 1 / (1 + np.exp(-z)) — np.exp gère scalaires et arrays.',
                'X @ w donne un vecteur de n logits ; + b se diffuse tout seul (broadcasting).',
                '(probas >= 0.5) donne des booléens ; .astype(int) les convertit en 0/1.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Que représente le logit z = w @ x + b avant la sigmoïde ?',
                options: [
                  'Une probabilité',
                  'Un score brut non borné : son signe donne la classe penchée, sa magnitude la confiance',
                  'Le gradient',
                  'Le taux d\'erreur',
                ],
                correct: 1,
                explanation: 'Les LLM aussi produisent des logits (un par token du vocabulaire) que softmax convertit en probabilités. Le mot "logits" que tu vois dans les API vient exactement d\'ici.',
              },
              {
                question: 'Pourquoi une non-linéarité (sigmoïde, ReLU…) est-elle indispensable dans un réseau ?',
                options: [
                  'Pour ralentir l\'entraînement',
                  'Sans elle, empiler des couches linéaires équivaut à UNE seule couche linéaire : le réseau ne peut rien apprendre de complexe',
                  'Pour économiser de la mémoire',
                  'C\'est une convention historique sans importance',
                ],
                correct: 1,
                explanation: 'La composition de fonctions linéaires est linéaire : W2(W1x) = (W2W1)x. Les non-linéarités entre les couches sont ce qui donne aux réseaux profonds — et aux transformers — leur pouvoir d\'expression.',
              },
            ],
          },
        ],
      },
      {
        id: 'm7l2',
        title: 'La descente de gradient, à la main',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# Comment un modèle apprend

L'entraînement de *tous* les modèles — de la régression logistique à GPT — suit la même boucle :

1. **Prédire** avec les poids actuels,
2. **Mesurer l'erreur** avec une fonction de perte (*loss*),
3. **Calculer le gradient** : dans quelle direction bouger chaque poids pour réduire la perte,
4. **Mettre à jour** : \`w = w - lr * gradient\` (lr = *learning rate*),
5. Recommencer.

## La perte : entropie croisée binaire

Pour des probabilités \`p\` et des étiquettes \`y\` (0 ou 1) :

\`\`\`
loss = -moyenne( y*log(p) + (1-y)*log(1-p) )
\`\`\`

Elle punit sévèrement une prédiction *confiante et fausse* (log(petit) → très négatif). C'est la même famille de perte que celle qui entraîne les LLM (entropie croisée sur le prochain token).

## Le gradient (offert, pour cette fois)

Pour la régression logistique, le calcul donne des formules remarquablement simples :

\`\`\`
erreur = p - y                        # vecteur (n,)
grad_w = X.T @ erreur / n             # (d,)
grad_b = erreur.mean()                # scalaire
\`\`\`

L'intuition : chaque poids est corrigé proportionnellement à *(l'erreur) × (la feature qui y a contribué)*. En pratique, PyTorch calcule ces gradients automatiquement (\`loss.backward()\`) — mais les avoir écrits une fois à la main change ta compréhension de tout le reste.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm7l2e1',
              title: 'Entraîner un classifieur de sentiment',
              instructions: `Le starter fournit \`sigmoid\` et un mini-dataset (features : [mots positifs, mots négatifs, longueur]). Implémente :

1. \`perte(p, y)\` — l'entropie croisée binaire (utilise \`np.clip(p, 1e-10, 1 - 1e-10)\` avant les log pour éviter log(0)),
2. \`une_etape(X, y, w, b, lr)\` — calcule \`p\`, puis les gradients (formules ci-dessus), et renvoie les **nouveaux** \`(w, b)\`,
3. \`entrainer(X, y, epochs=300, lr=0.5)\` — initialise \`w\` à zéros et \`b\` à 0.0, boucle, et renvoie \`(w, b)\`.

Les tests vérifient que la perte diminue et que le modèle classe correctement le dataset.`,
              starterCode: `import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

# [mots_positifs, mots_negatifs, longueur/10]
X = np.array([[3, 0, 1.2], [2, 1, 0.8], [0, 3, 1.0], [1, 2, 1.5],
              [4, 1, 2.0], [0, 2, 0.5], [3, 1, 1.0], [1, 3, 1.2]], dtype=float)
y = np.array([1, 1, 0, 0, 1, 0, 1, 0], dtype=float)

def perte(p, y):
    ...

def une_etape(X, y, w, b, lr):
    ...

def entrainer(X, y, epochs=300, lr=0.5):
    ...

w, b = entrainer(X, y)
p_final = sigmoid(X @ w + b)
print("poids appris :", w.round(2), "biais :", round(b, 2))
print("perte finale :", round(perte(p_final, y), 4))`,
              solution: `import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

X = np.array([[3, 0, 1.2], [2, 1, 0.8], [0, 3, 1.0], [1, 2, 1.5],
              [4, 1, 2.0], [0, 2, 0.5], [3, 1, 1.0], [1, 3, 1.2]], dtype=float)
y = np.array([1, 1, 0, 0, 1, 0, 1, 0], dtype=float)

def perte(p, y):
    p = np.clip(p, 1e-10, 1 - 1e-10)
    return -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))

def une_etape(X, y, w, b, lr):
    p = sigmoid(X @ w + b)
    erreur = p - y
    grad_w = X.T @ erreur / len(y)
    grad_b = erreur.mean()
    return w - lr * grad_w, b - lr * grad_b

def entrainer(X, y, epochs=300, lr=0.5):
    w = np.zeros(X.shape[1])
    b = 0.0
    for _ in range(epochs):
        w, b = une_etape(X, y, w, b, lr)
    return w, b

w, b = entrainer(X, y)
p_final = sigmoid(X @ w + b)
print("poids appris :", w.round(2), "biais :", round(b, 2))
print("perte finale :", round(perte(p_final, y), 4))`,
              tests: `import numpy as np
_p = np.array([0.9, 0.1])
_y = np.array([1.0, 0.0])
assert perte(_p, _y) < 0.2, "Bonnes prédictions : perte faible"
assert perte(np.array([0.1]), np.array([1.0])) > 1.5, "Prédiction confiante et fausse : perte élevée"
assert np.isfinite(perte(np.array([0.0, 1.0]), np.array([1.0, 0.0]))), "p=0 ou 1 ne doit pas donner inf — pense à np.clip"
_w0 = np.zeros(3)
_w1, _b1 = une_etape(X, y, _w0, 0.0, 0.5)
_l0 = perte(sigmoid(X @ _w0 + 0.0), y)
_l1 = perte(sigmoid(X @ _w1 + _b1), y)
assert _l1 < _l0, "Une étape de gradient doit faire baisser la perte"
_w, _b = entrainer(X, y)
_pred = (sigmoid(X @ _w + _b) >= 0.5).astype(int)
assert (_pred == y.astype(int)).all(), "Après entraînement, les 8 exemples doivent être bien classés"
assert _w[0] > 0 and _w[1] < 0, "Le modèle doit apprendre : mots positifs -> poids positif, mots négatifs -> poids négatif"
print("TESTS_PASS")`,
              hints: [
                'perte : np.clip d\'abord, puis -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)).',
                'une_etape suit mot à mot les formules du cours : erreur = p - y, grad_w = X.T @ erreur / n.',
                'entrainer : w = np.zeros(X.shape[1]), puis une boucle qui réaffecte w, b = une_etape(...).',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Que fait concrètement w = w - lr * grad_w ?',
                options: [
                  'Elle remet les poids à zéro',
                  'Elle déplace chaque poids d\'un petit pas dans la direction qui réduit la perte',
                  'Elle normalise les poids',
                  'Elle ajoute du bruit aléatoire',
                ],
                correct: 1,
                explanation: 'Le gradient pointe vers la montée de la perte ; on va dans le sens opposé, à petits pas (lr). GPT-4 a été entraîné exactement ainsi — avec des optimiseurs plus raffinés (Adam), mais le principe est celui-ci.',
              },
              {
                question: 'Que risque-t-il de se passer avec un learning rate beaucoup trop grand ?',
                options: [
                  'L\'entraînement est juste plus rapide',
                  'La perte oscille ou diverge : les pas sont si grands qu\'on saute par-dessus le minimum',
                  'Rien, le lr n\'a pas d\'importance',
                  'Le modèle apprend par cœur',
                ],
                correct: 1,
                explanation: 'Le lr est L\'hyperparamètre le plus sensible de tout le deep learning. Trop petit : interminable. Trop grand : divergence. D\'où les "lr schedules" (warmup, décroissance) mentionnés dans tous les papiers de LLM.',
              },
              {
                question: 'Quel est le lien entre cette leçon et l\'entraînement d\'un LLM ?',
                options: [
                  'Aucun, les LLM utilisent une autre méthode',
                  'Identique dans le principe : entropie croisée + descente de gradient — sur des milliards de poids et de tokens',
                  'Les LLM n\'ont pas de fonction de perte',
                  'Les LLM sont entraînés sans données',
                ],
                correct: 1,
                explanation: 'Un LLM minimise l\'entropie croisée de sa prédiction du prochain token, par descente de gradient (via backpropagation automatique). Tu viens d\'écrire la version minimale exacte de ce processus.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'm8',
    tier: 2,
    title: 'Tokenisation moderne : BPE',
    tagline: 'Implémenter l\'algorithme Byte-Pair Encoding utilisé par GPT, Llama, Claude et les autres.',
    status: 'ready',
    lessons: [
      {
        id: 'm8l1',
        title: 'Pourquoi BPE, et comment ça marche',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Le problème du vocabulaire ouvert

Ton tokenizer du module 2 a une faille béante : tout mot jamais vu devient \`<unk>\`. Or la langue invente sans cesse (« rebasculer », noms propres, code, typos). À l'opposé, tokeniser caractère par caractère marche toujours… mais produit des séquences interminables que les modèles peinent à traiter.

**BPE (Byte-Pair Encoding)** est le compromis qui a gagné : partir des caractères, puis **fusionner itérativement la paire adjacente la plus fréquente** du corpus, jusqu'à la taille de vocabulaire voulue.

## L'algorithme d'entraînement

\`\`\`
1. Découpe chaque mot en caractères : "lower" -> l o w e r
2. Compte toutes les paires adjacentes dans le corpus
3. Fusionne la paire la plus fréquente partout : (l, o) -> "lo"
4. Retourne en 2, jusqu'à N fusions
\`\`\`

Les fusions apprises reflètent la statistique de la langue : \`er\`, \`ing\`, \`tion\` émergent tôt en anglais. Les mots fréquents finissent en un seul token ; les mots rares restent découpés en sous-unités — mais *jamais* en \`<unk>\`.

## Concrètement chez les LLM

GPT, Llama, Claude, Mistral : tous utilisent des variantes de BPE (souvent au niveau *octet*, d'où « byte »-pair). Le vocabulaire (~50k à 260k tokens) et la liste ordonnée des fusions **sont** le tokenizer. C'est pour ça qu'un mot rare ou une langue peu dotée « coûte » plus de tokens — et pourquoi compter les caractères d'un mot est difficile pour un LLM : il ne voit même pas les caractères.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm8l1e1',
              title: 'Compter et trouver la meilleure paire',
              instructions: `Un corpus BPE se représente comme un dict \`mot_découpé → fréquence\`, où le mot découpé est un **tuple** de symboles : \`("l","o","w"): 5\`.

Implémente :

1. \`compter_paires(corpus)\` — renvoie un dict \`(sym1, sym2) → fréquence totale\` de chaque paire *adjacente*, pondérée par la fréquence du mot,
2. \`meilleure_paire(paires)\` — renvoie la paire la plus fréquente (\`max\` avec \`key=paires.get\`) ; si le dict est vide, renvoie \`None\`.`,
              starterCode: `corpus = {
    ("l", "o", "w"): 5,
    ("l", "o", "w", "e", "r"): 2,
    ("n", "e", "w"): 6,
}

def compter_paires(corpus):
    ...

def meilleure_paire(paires):
    ...

p = compter_paires(corpus)
print(p)
print(meilleure_paire(p))`,
              solution: `corpus = {
    ("l", "o", "w"): 5,
    ("l", "o", "w", "e", "r"): 2,
    ("n", "e", "w"): 6,
}

def compter_paires(corpus):
    paires = {}
    for mot, freq in corpus.items():
        for i in range(len(mot) - 1):
            paire = (mot[i], mot[i + 1])
            paires[paire] = paires.get(paire, 0) + freq
    return paires

def meilleure_paire(paires):
    if not paires:
        return None
    return max(paires, key=paires.get)

p = compter_paires(corpus)
print(p)
print(meilleure_paire(p))`,
              tests: `_p = compter_paires({("a", "b", "c"): 3})
assert _p == {("a", "b"): 3, ("b", "c"): 3}, "Chaque paire adjacente, pondérée par la fréquence du mot"
_p2 = compter_paires(corpus)
assert _p2[("l", "o")] == 7, "(l,o) apparaît dans 'low' (5) et 'lower' (2) : 7"
assert _p2[("o", "w")] == 7, "(o,w) : 5 + 2 = 7"
assert _p2[("n", "e")] == 6 and _p2[("e", "w")] == 6, "Paires de 'new' : 6"
_best = meilleure_paire(_p2)
assert _best in [("l", "o"), ("o", "w")], "La meilleure paire a la fréquence 7"
assert meilleure_paire({}) is None, "Dict vide : None"
print("TESTS_PASS")`,
              hints: [
                'Pour chaque mot : for i in range(len(mot) - 1) donne les indices des paires (mot[i], mot[i+1]).',
                'Incrémente de freq (la fréquence du MOT), pas de 1.',
                'max(paires, key=paires.get) renvoie la clé de valeur maximale.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi BPE élimine-t-il le problème du token <unk> ?',
                options: [
                  'Il a un vocabulaire infini',
                  'Au pire, tout mot inconnu se décompose en ses caractères/octets de base, qui sont toujours dans le vocabulaire',
                  'Il remplace les mots inconnus par des synonymes',
                  'Il ignore les mots inconnus',
                ],
                correct: 1,
                explanation: 'Le vocabulaire BPE contient tous les symboles de base + les fusions. N\'importe quelle chaîne est donc toujours encodable — juste en plus ou moins de tokens.',
              },
              {
                question: 'Pourquoi demander à un LLM de compter les "r" dans "strawberry" est-il piégeux ?',
                options: [
                  'Les LLM ne savent pas compter du tout',
                  'Le mot arrive découpé en tokens BPE (ex : "straw"+"berry") : le modèle ne voit jamais les caractères individuels',
                  'C\'est un mot trop long',
                  'Les LLM confondent les lettres',
                ],
                correct: 1,
                explanation: 'La tokenisation est une vraie frontière perceptive : le modèle raisonne sur des sous-mots, pas des lettres. Comprendre BPE explique toute une famille de comportements surprenants des LLM.',
              },
            ],
          },
        ],
      },
      {
        id: 'm8l2',
        title: 'Implémenter les fusions : mini-BPE complet',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# La boucle d'entraînement BPE

Il te manque une seule brique : **appliquer** une fusion au corpus. Fusionner la paire \`("l","o")\` transforme \`("l","o","w")\` en \`("lo","w")\` — partout, dans tous les mots.

\`\`\`
def fusionner_mot(mot, paire):
    # ("l","o","w","e","r") + ("l","o") -> ("lo","w","e","r")
    nouveau = []
    i = 0
    while i < len(mot):
        if i < len(mot) - 1 and (mot[i], mot[i+1]) == paire:
            nouveau.append(mot[i] + mot[i+1])   # concatène les 2 symboles
            i += 2                               # saute la paire
        else:
            nouveau.append(mot[i])
            i += 1
    return tuple(nouveau)
\`\`\`

L'entraînement complet est alors une boucle de N itérations : compter les paires (leçon 1) → prendre la meilleure → l'appliquer partout → mémoriser la fusion dans une liste ordonnée. Cette **liste ordonnée de fusions** est le produit final : c'est elle qu'on rejoue, dans le même ordre, pour tokeniser un texte nouveau.

> Le vrai tokenizer de GPT-2 tient en ~300 lignes de Python et fait exactement ça (au niveau octet, avec une regex de pré-découpage — celle du module 3 !). Après cet exercice, tu peux le lire dans le texte.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm8l2e1',
              title: 'Entraîner un mini-BPE',
              instructions: `Le starter fournit \`compter_paires\` et \`fusionner_mot\`. Implémente :

1. \`appliquer_fusion(corpus, paire)\` — renvoie un **nouveau** dict corpus où chaque mot a subi \`fusionner_mot\` (attention : deux mots différents peuvent devenir identiques après fusion — additionne alors leurs fréquences),
2. \`entrainer_bpe(corpus, n_fusions)\` — répète : compter → meilleure paire → appliquer → enregistrer la paire dans \`fusions\`. S'arrête si plus aucune paire. Renvoie \`(corpus_final, fusions)\`.`,
              starterCode: `def compter_paires(corpus):
    paires = {}
    for mot, freq in corpus.items():
        for i in range(len(mot) - 1):
            paires[(mot[i], mot[i+1])] = paires.get((mot[i], mot[i+1]), 0) + freq
    return paires

def fusionner_mot(mot, paire):
    nouveau, i = [], 0
    while i < len(mot):
        if i < len(mot) - 1 and (mot[i], mot[i+1]) == paire:
            nouveau.append(mot[i] + mot[i+1]); i += 2
        else:
            nouveau.append(mot[i]); i += 1
    return tuple(nouveau)

def appliquer_fusion(corpus, paire):
    ...

def entrainer_bpe(corpus, n_fusions):
    fusions = []
    ...

corpus = {("l","o","w"): 5, ("l","o","w","e","r"): 2, ("n","e","w","e","r"): 6}
final, fusions = entrainer_bpe(corpus, 4)
print("fusions apprises :", fusions)
print("corpus final :", final)`,
              solution: `def compter_paires(corpus):
    paires = {}
    for mot, freq in corpus.items():
        for i in range(len(mot) - 1):
            paires[(mot[i], mot[i+1])] = paires.get((mot[i], mot[i+1]), 0) + freq
    return paires

def fusionner_mot(mot, paire):
    nouveau, i = [], 0
    while i < len(mot):
        if i < len(mot) - 1 and (mot[i], mot[i+1]) == paire:
            nouveau.append(mot[i] + mot[i+1]); i += 2
        else:
            nouveau.append(mot[i]); i += 1
    return tuple(nouveau)

def appliquer_fusion(corpus, paire):
    nouveau = {}
    for mot, freq in corpus.items():
        m = fusionner_mot(mot, paire)
        nouveau[m] = nouveau.get(m, 0) + freq
    return nouveau

def entrainer_bpe(corpus, n_fusions):
    fusions = []
    for _ in range(n_fusions):
        paires = compter_paires(corpus)
        if not paires:
            break
        best = max(paires, key=paires.get)
        corpus = appliquer_fusion(corpus, best)
        fusions.append(best)
    return corpus, fusions

corpus = {("l","o","w"): 5, ("l","o","w","e","r"): 2, ("n","e","w","e","r"): 6}
final, fusions = entrainer_bpe(corpus, 4)
print("fusions apprises :", fusions)
print("corpus final :", final)`,
              tests: `_c = appliquer_fusion({("a","b","c"): 2, ("a","b"): 1}, ("a","b"))
assert _c == {("ab","c"): 2, ("ab",): 1}, "La fusion s'applique à tous les mots"
_c2 = appliquer_fusion({("a","b"): 2, ("ab",): 3}, ("a","b"))
assert _c2 == {("ab",): 5}, "Deux mots devenus identiques : fréquences additionnées"
_corpus = {("l","o","w"): 5, ("l","o","w","e","r"): 2, ("n","e","w","e","r"): 6}
_final, _fusions = entrainer_bpe(_corpus, 4)
assert len(_fusions) == 4, "4 fusions demandées"
assert _fusions[0] in [("w", "e"), ("e", "r")], "La paire la plus fréquente du départ a une fréquence de 8 : (w,e) ou (e,r)"
_f2, _l2 = entrainer_bpe({("a","b"): 1}, 10)
assert _l2 == [("a", "b")] and _f2 == {("ab",): 1}, "Plus de paires à fusionner : arrêt anticipé"
print("TESTS_PASS")`,
              hints: [
                'appliquer_fusion : construit un dict neuf ; nouveau.get(m, 0) + freq gère les collisions de mots fusionnés.',
                'entrainer_bpe : la boucle réutilise exactement les briques — compter_paires, max(…, key=…), appliquer_fusion, fusions.append.',
                'Le "if not paires: break" évite de boucler quand tous les mots sont réduits à un seul symbole.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Que contient le "modèle" produit par l\'entraînement BPE ?',
                options: [
                  'Des poids de réseau de neurones',
                  'La liste ORDONNÉE des fusions apprises (+ le vocabulaire qui en découle)',
                  'Un dictionnaire de synonymes',
                  'Les fréquences de tous les mots',
                ],
                correct: 1,
                explanation: 'Aucun apprentissage "neuronal" ici : le tokenizer est un algorithme déterministe paramétré par sa liste de fusions. Pour tokeniser un texte neuf, on rejoue les fusions dans le même ordre.',
              },
              {
                question: 'Pourquoi une langue peu représentée dans le corpus d\'entraînement coûte-t-elle plus cher en tokens ?',
                options: [
                  'L\'API applique un tarif par langue',
                  'Ses séquences fréquentes n\'ont pas été apprises comme fusions : chaque mot se découpe en beaucoup plus de sous-unités',
                  'Ses caractères sont plus lourds',
                  'C\'est faux, toutes les langues coûtent pareil',
                ],
                correct: 1,
                explanation: 'Les fusions reflètent le corpus : l\'anglais domine → mots anglais compacts (1-2 tokens), tandis qu\'une langue rare explose en petits morceaux. Impact réel sur le coût, la latence ET la fenêtre de contexte effective.',
              },
            ],
          },
        ],
      },
    ],
  },
]
