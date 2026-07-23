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
    status: 'outline',
    lessons: [],
    outline: [
      'Bag of words : des textes aux matrices documents × mots',
      'TF-IDF : pondérer les mots rares et informatifs',
      'Construire un moteur de recherche complet sur un petit corpus',
      'Limites (synonymes, ordre des mots) → pourquoi les embeddings neuronaux',
    ],
  },
  {
    id: 'm7',
    tier: 2,
    title: 'Un neurone, puis un réseau',
    tagline: 'Régression logistique et descente de gradient from scratch : classification de sentiment.',
    status: 'outline',
    lessons: [],
    outline: [
      'Le neurone : produit scalaire + sigmoïde',
      'Fonction de perte et descente de gradient, à la main en NumPy',
      'Entraîner un classifieur de sentiment sur des critiques de films',
      'Du neurone au réseau : pourquoi empiler des couches (et le lien avec PyTorch)',
    ],
  },
  {
    id: 'm8',
    tier: 2,
    title: 'Tokenisation moderne : BPE',
    tagline: 'Implémenter l\'algorithme Byte-Pair Encoding utilisé par GPT, Llama et les autres.',
    status: 'outline',
    lessons: [],
    outline: [
      'Pourquoi les mots entiers ne suffisent pas (vocabulaire ouvert, langues, code)',
      'L\'algorithme BPE pas à pas : fusionner les paires fréquentes',
      'Implémenter un mini-BPE et le comparer au tokenizer de GPT',
      'Pièges concrets : espaces, nombres, langues non latines, coût en tokens',
    ],
  },
]
