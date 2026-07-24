import type { Module } from '@/lib/types'

export const m5: Module = {
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
            md: `# NumPy : penser en tableaux

PyTorch, TensorFlow, JAX… toutes les bibliothèques de deep learning sont des variations autour d'un même objet : le **tableau multidimensionnel** (array, ou *tenseur*). NumPy est l'original, et apprendre à *penser en arrays* est le vrai objectif de ce module — bien plus que de mémoriser des fonctions.

Pourquoi ça compte pour toi ? Parce qu'en NLP, un mot devient un **vecteur** (un embedding), une phrase une **matrice** (une ligne par token), un batch un **tenseur 3D**. Toute la suite du parcours — similarité, attention, transformers — n'est que de l'algèbre sur ces objets.

## Créer et inspecter

\`\`\`
import numpy as np

v = np.array([1.0, 2.0, 3.0])        # vecteur, shape (3,)
M = np.array([[1, 2], [3, 4]])       # matrice, shape (2, 2)
v.shape, M.shape, M.dtype
\`\`\`

Le réflexe numéro un du praticien : **imprimer les shapes**. La moitié des bugs de deep learning sont des erreurs de forme (« j'attendais (32, 128), j'ai (128, 32) »). Avant de chercher un bug de logique, vérifie tes shapes.

## La vectorisation : jamais de boucle

L'idée centrale : appliquer une opération à *tout* le tableau d'un coup, sans boucle Python.

\`\`\`
v * 2          # multiplie chaque élément
v + w          # addition élément par élément
v * w          # produit élément par élément (PAS le produit scalaire !)
v @ w          # produit scalaire (dot product) : un seul nombre
np.sqrt(v)     # fonction appliquée à chaque élément
v.sum(), v.mean(), v.max()
\`\`\`

Les opérations vectorisées sont des centaines de fois plus rapides que des boucles Python — mais surtout, elles *correspondent aux formules mathématiques* des articles de recherche. Écrire \`softmax(Q @ K.T / sqrt(d))\` en NumPy, c'est recopier presque à l'identique l'équation du papier.

## Le produit scalaire, star du NLP

\`v @ w = v₁w₁ + v₂w₂ + …\` mesure à quel point deux vecteurs « pointent dans la même direction ». C'est le cœur de la **similarité d'embeddings** ET des **scores d'attention** des transformers. Une seule idée à retenir pour tout le reste du cours : *produit scalaire = similarité brute*.

## La règle des shapes du produit matriciel

\`(n, k) @ (k, m) → (n, m)\` : les dimensions internes (\`k\`) doivent coïncider et disparaissent, les dimensions externes restent. C'est LA règle qui régit toutes les couches d'un réseau — apprends-la par cœur, tu la vérifieras mille fois.

## Pièges classiques

- **\`*\` n'est pas \`@\`.** \`v * w\` multiplie terme à terme (résultat : un vecteur) ; \`v @ w\` fait le produit scalaire (résultat : un nombre). La confusion la plus fréquente du débutant NumPy.
- **Les shapes incompatibles.** \`(32, 128) @ (64, 10)\` lève une erreur : \`128 ≠ 64\`. Lis toujours le message d'erreur de shape, il te dit exactement quelles dimensions ne collent pas.
- **\`(3,)\` n'est pas \`(3, 1)\`.** Un vecteur « plat » et une matrice colonne se comportent différemment en broadcasting (module 3 du palier) ; en cas de doute, imprime \`.shape\`.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm5l1e2',
              title: "Normes et distances",
              instructions: `Deux mesures que tu utiliseras sans cesse, à écrire une fois à la main pour ne plus jamais les confondre :

1. \`norme(v)\` — la norme L2 d'un vecteur : \`sqrt(v @ v)\` (sans np.linalg.norm !),
2. \`distance(u, v)\` — la distance euclidienne : la norme de \`u - v\`,
3. \`plus_proche(E, q)\` — l'indice de la ligne de \`E\` la plus proche de \`q\` **au sens de la distance** (np.argmin sur la liste des distances).

Note le contraste avec la leçon : cosinus = direction, distance = position. Les deux servent, selon que tes vecteurs sont normalisés ou non.`,
              starterCode: `import numpy as np

def norme(v):
    ...

def distance(u, v):
    ...

def plus_proche(E, q):
    ...

E = np.array([[0.0, 0.0], [3.0, 4.0], [1.0, 1.0]])
print(norme(np.array([3.0, 4.0])))
print(distance(np.array([0.0, 0.0]), np.array([3.0, 4.0])))
print(plus_proche(E, np.array([1.2, 0.9])))`,
              solution: `import numpy as np

def norme(v):
    return float(np.sqrt(v @ v))

def distance(u, v):
    return norme(u - v)

def plus_proche(E, q):
    distances = [distance(ligne, q) for ligne in E]
    return int(np.argmin(distances))

E = np.array([[0.0, 0.0], [3.0, 4.0], [1.0, 1.0]])
print(norme(np.array([3.0, 4.0])))
print(distance(np.array([0.0, 0.0]), np.array([3.0, 4.0])))
print(plus_proche(E, np.array([1.2, 0.9])))`,
              tests: `import numpy as np
assert abs(norme(np.array([3.0, 4.0])) - 5.0) < 1e-9, "sqrt(9+16) = 5 : le triangle 3-4-5"
assert abs(norme(np.array([0.0, 0.0]))) < 1e-9, "Vecteur nul : norme 0"
assert abs(distance(np.array([1.0, 1.0]), np.array([4.0, 5.0])) - 5.0) < 1e-9, "Même triangle, déplacé"
_E = np.array([[0.0, 0.0], [3.0, 4.0], [1.0, 1.0]])
assert plus_proche(_E, np.array([1.2, 0.9])) == 2, "Le point (1,1) est le plus proche"
assert plus_proche(_E, np.array([2.9, 4.1])) == 1, "Le point (3,4)"
print("TESTS_PASS")`,
              hints: [
                'v @ v est la somme des carrés — la racine donne la norme.',
                'distance : réutilise norme sur u - v (soustraction vectorisée).',
                'np.argmin donne l\'indice du minimum ; pense à convertir en int().',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm5l1e3',
              title: "Défi — Padding de séquences",
              instructions: `Les phrases n'ont pas toutes la même longueur, mais un batch GPU doit être une matrice rectangulaire : on complète avec des zéros (**padding**) — exactement ce que fait \`padding=True\` chez Hugging Face. Écris \`pad_sequences(sequences, longueur=None)\` :

1. si \`longueur\` est \`None\`, prends la longueur de la plus longue séquence,
2. renvoie une matrice numpy \`(n, longueur)\` d'entiers initialisée à 0, chaque ligne recevant les ids de sa séquence (tronquée si trop longue),
3. renvoie aussi le **masque** \`(n, longueur)\` : 1 sur les vraies positions, 0 sur le padding — le futur "attention mask".

Renvoie le tuple \`(matrice, masque)\`.`,
              starterCode: `import numpy as np

def pad_sequences(sequences, longueur=None):
    ...

seqs = [[5, 2, 9], [7], [1, 3, 4, 8]]
M, masque = pad_sequences(seqs)
print(M)
print(masque)`,
              solution: `import numpy as np

def pad_sequences(sequences, longueur=None):
    if longueur is None:
        longueur = max(len(s) for s in sequences)
    n = len(sequences)
    M = np.zeros((n, longueur), dtype=int)
    masque = np.zeros((n, longueur), dtype=int)
    for i, seq in enumerate(sequences):
        seq = seq[:longueur]
        M[i, :len(seq)] = seq
        masque[i, :len(seq)] = 1
    return M, masque

seqs = [[5, 2, 9], [7], [1, 3, 4, 8]]
M, masque = pad_sequences(seqs)
print(M)
print(masque)`,
              tests: `import numpy as np
_M, _m = pad_sequences([[5, 2, 9], [7], [1, 3, 4, 8]])
assert _M.shape == (3, 4), "3 séquences, longueur max 4"
assert list(_M[1]) == [7, 0, 0, 0], "Séquence courte complétée de zéros"
assert list(_m[1]) == [1, 0, 0, 0], "Le masque marque les vraies positions"
assert list(_M[2]) == [1, 3, 4, 8], "La plus longue remplit sa ligne"
_M2, _m2 = pad_sequences([[1, 2, 3]], longueur=2)
assert list(_M2[0]) == [1, 2], "Longueur imposée : troncature"
print("TESTS_PASS")`,
              hints: [
                'max(len(s) for s in sequences) pour la longueur automatique.',
                'M[i, :len(seq)] = seq remplit le début de la ligne — le slicing en écriture.',
                'Le masque suit exactement le même remplissage, avec des 1.',
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

Quand un système RAG (Retrieval-Augmented Generation) cherche « les passages les plus pertinents » pour une question, il calcule presque toujours une **similarité cosinus** entre l'embedding de la question et ceux des documents. Toute base vectorielle (Pinecone, Chroma, pgvector, FAISS…) repose là-dessus. Comprendre cette formule d'une ligne, c'est comprendre le cœur de la recherche sémantique moderne.

## L'intuition : comparer des directions

Imagine chaque embedding comme une flèche partant de l'origine. Deux textes de sens proche pointent dans des directions voisines, même si leurs flèches n'ont pas la même longueur. La similarité cosinus mesure précisément l'**angle** entre deux flèches, en ignorant leur longueur.

## La formule

\`\`\`
cos(u, v) = (u @ v) / (‖u‖ · ‖v‖)
\`\`\`

C'est le produit scalaire (leçon 1) divisé par le produit des deux normes. Le résultat vaut :

- **1** si les vecteurs pointent exactement dans la même direction,
- **0** s'ils sont orthogonaux (sans rapport),
- **-1** s'ils sont opposés.

Diviser par les normes rend la mesure **indépendante de la longueur** des vecteurs : seule la *direction* compte — et dans un espace d'embeddings, la direction encode le *sens*.

## Recherche sémantique en deux lignes

Avec une matrice \`E\` d'embeddings **normalisés** (norme 1), la similarité cosinus se réduit au simple produit scalaire :

\`\`\`
scores = E @ q          # q : embedding normalisé de la requête
meilleur = scores.argmax()
\`\`\`

C'est *exactement* ce que fait une base vectorielle, plus des structures d'index pour aller vite sur des millions de vecteurs. Le concept, lui, tient en deux lignes de NumPy — et beaucoup de modèles d'embeddings sortent d'ailleurs des vecteurs *déjà normalisés*, précisément pour transformer la similarité en un dot product.

## Pièges classiques

- **La division par zéro.** Un vecteur nul a une norme de 0 : la similarité cosinus n'est pas définie. En pratique, filtre les documents vides en amont ou ajoute un epsilon.
- **Confondre similarité et distance.** Cosinus proche de 1 = *très similaire* ; la distance euclidienne, elle, est proche de 0 pour des vecteurs similaires. Les deux vont dans des sens opposés — vérifie toujours si tu tries par ordre croissant ou décroissant.
- **Oublier de normaliser la requête aussi.** Si tu pré-normalises \`E\` mais pas \`q\`, ton \`E @ q\` n'est plus un cosinus. Normalise les deux côtés, ou aucun.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm5l2e2',
              title: "Top-k d'un vecteur de scores",
              instructions: `La brique de tout retrieval : \`top_k_indices(scores, k)\` renvoie les indices des \`k\` plus grands scores, du plus grand au plus petit (liste d'\`int\`).

L'outil : \`np.argsort(scores)\` trie en croissant → \`[::-1]\` inverse → \`[:k]\` tronque. Une ligne, à connaître par cœur.`,
              starterCode: `import numpy as np

def top_k_indices(scores, k):
    ...

s = np.array([0.1, 0.9, 0.4, 0.7])
print(top_k_indices(s, 2))`,
              solution: `import numpy as np

def top_k_indices(scores, k):
    return [int(i) for i in np.argsort(scores)[::-1][:k]]

s = np.array([0.1, 0.9, 0.4, 0.7])
print(top_k_indices(s, 2))`,
              tests: `import numpy as np
assert top_k_indices(np.array([0.1, 0.9, 0.4, 0.7]), 2) == [1, 3], "Les indices des 2 meilleurs, ordonnés"
assert top_k_indices(np.array([5.0]), 1) == [0], "Un seul élément"
assert top_k_indices(np.array([1.0, 2.0, 3.0]), 5) == [2, 1, 0], "k trop grand : tous les indices, triés"
assert all(isinstance(i, int) for i in top_k_indices(np.array([1.0, 2.0]), 2)), "Des int Python, pas des np.int64"
print("TESTS_PASS")`,
              hints: [
                'argsort → [::-1] → [:k], puis conversion int.',
                'np.argsort trie les INDICES par valeur croissante — c\'est l\'inversion qui donne le "top".',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm5l2e3',
              title: "Défi — Le retrieval complet, vectorisé",
              instructions: `Assemble le moteur final, celui d'une vraie base vectorielle : \`chercher_top_k(E, q, k)\` :

1. normalise les lignes de \`E\` et le vecteur \`q\` (norme L2),
2. calcule TOUS les cosinus en une opération (\`E_norm @ q_norm\`),
3. renvoie la liste des \`k\` indices les plus similaires, dans l'ordre.

Zéro boucle Python (sauf la conversion finale en int) : tout en vectorisé.`,
              starterCode: `import numpy as np

def chercher_top_k(E, q, k):
    ...

E = np.array([[0.9, 0.1, 0.0],
              [0.8, 0.3, 0.1],
              [0.0, 0.1, 0.9],
              [0.1, 0.0, 0.8]])
q = np.array([1.0, 0.2, 0.0])
print(chercher_top_k(E, q, 2))`,
              solution: `import numpy as np

def chercher_top_k(E, q, k):
    E_norm = E / np.linalg.norm(E, axis=1)[:, None]
    q_norm = q / np.linalg.norm(q)
    scores = E_norm @ q_norm
    return [int(i) for i in np.argsort(scores)[::-1][:k]]

E = np.array([[0.9, 0.1, 0.0],
              [0.8, 0.3, 0.1],
              [0.0, 0.1, 0.9],
              [0.1, 0.0, 0.8]])
q = np.array([1.0, 0.2, 0.0])
print(chercher_top_k(E, q, 2))`,
              tests: `import numpy as np
_E = np.array([[0.9, 0.1, 0.0], [0.8, 0.3, 0.1], [0.0, 0.1, 0.9], [0.1, 0.0, 0.8]])
_q = np.array([1.0, 0.2, 0.0])
_r = chercher_top_k(_E, _q, 2)
assert sorted(_r) == [0, 1], "Les deux vecteurs proches de la requête sortent en tête"
assert chercher_top_k(_E, np.array([0.0, 0.0, 1.0]), 1) == [2], "Requête orientée 3e dimension"
_r2 = chercher_top_k(_E * 100, _q * 7, 2)
assert _r2 == _r, "La normalisation rend le résultat insensible aux échelles"
print("TESTS_PASS")`,
              hints: [
                'La normalisation des lignes : E / normes[:, None] (le broadcasting du module).',
                'Puis argsort inversé tronqué, comme au top-k.',
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
      {
        id: 'm5l3',
        title: 'Broadcasting et matrices de similarité',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# Toutes les similarités d'un coup

Comparer une requête à \`n\` documents, tu sais faire. Mais comparer *chaque* document à *chaque* autre — pour dédupliquer un corpus, regrouper des questions similaires, construire un graphe de voisinage ? Il te faut la **matrice de similarité** complète, et c'est là que NumPy révèle toute sa puissance.

## L'astuce : normaliser, puis un seul produit matriciel

Pour des embeddings normalisés (norme 1 — la fonction de la leçon précédente), la similarité cosinus se réduit au produit scalaire. Donc *toutes* les paires se calculent en une seule opération :

\`\`\`
E_norm = normaliser_l2(E)        # (n, d)
S = E_norm @ E_norm.T            # (n, n) : S[i, j] = cos(doc_i, doc_j)
\`\`\`

Une ligne. Pour 10 000 documents, ça reste quasi instantané — c'est exactement ce que fait une base vectorielle en interne, avant d'ajouter des index approximatifs pour passer aux millions.

## Le broadcasting : diffuser une opération

NumPy sait combiner des tableaux de formes différentes en « diffusant » automatiquement le plus petit. Pour diviser une matrice \`(n, d)\` par un vecteur de \`n\` normes, il faut lui donner la forme \`(n, 1)\` :

\`\`\`
normes = np.linalg.norm(E, axis=1)   # (n,)
E_norm = E / normes[:, None]         # (n, 1) se diffuse sur les d colonnes
\`\`\`

Le \`[:, None]\` (ou \`.reshape(-1, 1)\`) transforme \`(n,)\` en \`(n, 1)\` : la division s'applique alors *ligne par ligne*. Maîtriser ce geste, c'est débloquer 90 % des manipulations de tenseurs.

## argsort : trouver les voisins

\`np.argsort(v)\` renvoie les **indices** qui trieraient le vecteur. Pour les k plus proches voisins du document \`i\` :

\`\`\`
ordre = np.argsort(S[i])[::-1]    # du plus similaire au moins
voisins = ordre[ordre != i][:k]   # on s'exclut soi-même !
\`\`\`

## Pièges classiques

- **Chaque document est son propre voisin n°1.** \`S[i, i] = 1\` (un document est identique à lui-même). Oublie de l'exclure, et ton « plus proche voisin » est toujours… lui-même. Filtre la diagonale.
- **\`(n,)\` divisé par \`(n,)\` ne fait pas ce que tu crois.** Sans le \`[:, None]\`, NumPy tente une division élément par élément ou lève une erreur de shape. Le broadcasting exige la forme \`(n, 1)\`.
- **La matrice \`(n, n)\` explose en mémoire.** À 100 000 documents, \`S\` fait 10 milliards de cases. Au-delà de quelques dizaines de milliers, on passe aux index approximatifs (FAISS) — mais le principe reste celui-ci.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm5l3e1',
              title: 'Détecteur de quasi-doublons',
              instructions: `Implémente :

1. \`matrice_similarite(E)\` — normalise les lignes (fourni : \`normaliser_l2\`) puis renvoie \`(n, n)\` des cosinus,
2. \`voisins(S, i, k)\` — les indices des \`k\` documents les plus similaires au document \`i\`, hors lui-même, du plus au moins similaire,
3. \`paires_suspectes(S, seuil)\` — la liste des paires \`(i, j)\` avec \`i < j\` dont la similarité dépasse \`seuil\` — le détecteur de doublons utilisé avant tout fine-tuning.`,
              starterCode: `import numpy as np

def normaliser_l2(M):
    return M / np.linalg.norm(M, axis=1)[:, None]

def matrice_similarite(E):
    ...

def voisins(S, i, k):
    ...

def paires_suspectes(S, seuil):
    ...

E = np.array([[1.0, 0.0], [0.99, 0.14], [0.0, 1.0], [1.0, 0.02]])
S = matrice_similarite(E)
print(np.round(S, 2))
print("voisins de 0 :", voisins(S, 0, 2))
print("doublons probables :", paires_suspectes(S, 0.99))`,
              solution: `import numpy as np

def normaliser_l2(M):
    return M / np.linalg.norm(M, axis=1)[:, None]

def matrice_similarite(E):
    En = normaliser_l2(E)
    return En @ En.T

def voisins(S, i, k):
    ordre = np.argsort(S[i])[::-1]
    ordre = ordre[ordre != i]
    return list(ordre[:k])

def paires_suspectes(S, seuil):
    n = S.shape[0]
    return [(i, j) for i in range(n) for j in range(i + 1, n) if S[i, j] > seuil]

E = np.array([[1.0, 0.0], [0.99, 0.14], [0.0, 1.0], [1.0, 0.02]])
S = matrice_similarite(E)
print(np.round(S, 2))
print("voisins de 0 :", voisins(S, 0, 2))
print("doublons probables :", paires_suspectes(S, 0.99))`,
              tests: `import numpy as np
_E = np.array([[1.0, 0.0], [0.99, 0.14], [0.0, 1.0], [1.0, 0.02]])
_S = matrice_similarite(_E)
assert _S.shape == (4, 4), "Matrice (n, n)"
assert np.allclose(np.diag(_S), 1.0), "La diagonale vaut 1 (chaque doc identique à lui-même)"
assert np.allclose(_S, _S.T), "La matrice est symétrique"
_v = voisins(_S, 0, 2)
assert 0 not in _v, "Un document ne doit pas être son propre voisin"
assert _v[0] == 3, "Le plus proche de 0 est 3 (quasi identiques)"
_p = paires_suspectes(_S, 0.99)
assert (0, 3) in _p, "0 et 3 sont des quasi-doublons"
assert all(i < j for i, j in _p), "Chaque paire une seule fois, avec i < j"
assert (0, 2) not in _p, "0 et 2 sont orthogonaux : pas suspects"
print("TESTS_PASS")`,
              hints: [
                'matrice_similarite : deux lignes — normaliser, puis En @ En.T.',
                'voisins : np.argsort(S[i])[::-1] inverse le tri (décroissant), puis filtre ordre != i.',
                'paires_suspectes : double boucle avec range(i + 1, n) pour ne compter chaque paire qu\'une fois.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm5l3e2',
              title: "Statistiques d'une matrice de similarité",
              instructions: `Avant de fixer un seuil de déduplication, on regarde la distribution des similarités. Écris \`similarite_moyenne(S)\` : la moyenne des similarités **hors diagonale** (la diagonale de 1 fausserait tout), en \`float\` arrondi à 3 décimales.

L'outil : \`np.eye(n, dtype=bool)\` crée le masque de la diagonale ; \`~masque\` l'inverse ; \`S[~masque]\` extrait tous les éléments hors diagonale d'un coup.`,
              starterCode: `import numpy as np

def similarite_moyenne(S):
    ...

S = np.array([[1.0, 0.8, 0.2],
              [0.8, 1.0, 0.4],
              [0.2, 0.4, 1.0]])
print(similarite_moyenne(S))`,
              solution: `import numpy as np

def similarite_moyenne(S):
    n = S.shape[0]
    hors_diag = S[~np.eye(n, dtype=bool)]
    return round(float(hors_diag.mean()), 3)

S = np.array([[1.0, 0.8, 0.2],
              [0.8, 1.0, 0.4],
              [0.2, 0.4, 1.0]])
print(similarite_moyenne(S))`,
              tests: `import numpy as np
_S = np.array([[1.0, 0.8, 0.2], [0.8, 1.0, 0.4], [0.2, 0.4, 1.0]])
assert similarite_moyenne(_S) == round((0.8 + 0.2 + 0.8 + 0.4 + 0.2 + 0.4) / 6, 3), "Moyenne des 6 valeurs hors diagonale"
_S2 = np.array([[1.0, 0.5], [0.5, 1.0]])
assert similarite_moyenne(_S2) == 0.5, "Cas 2x2"
assert isinstance(similarite_moyenne(_S2), float), "Un float Python"
print("TESTS_PASS")`,
              hints: [
                'np.eye(n, dtype=bool) → True sur la diagonale ; ~ inverse le masque booléen.',
                'S[masque_booleen] aplatit et extrait — l\'indexation booléenne de NumPy.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm5l3e3',
              title: "Défi — Grouper les doublons",
              instructions: `Le livrable final de la mission déduplication : des **groupes** de documents quasi identiques (pas juste des paires). Écris \`grouper_doublons(S, seuil)\` avec l'algorithme glouton :

1. parcours les indices dans l'ordre ; si \`i\` est déjà assigné, passe,
2. sinon crée un groupe avec \`i\` et **tous les j > i non assignés** tels que \`S[i, j] > seuil\`, et marque-les assignés,
3. renvoie la liste des groupes d'au moins 2 éléments (listes d'indices croissants).`,
              starterCode: `import numpy as np

def grouper_doublons(S, seuil):
    ...

S = np.array([
    [1.0, 0.99, 0.1, 0.98],
    [0.99, 1.0, 0.2, 0.97],
    [0.1, 0.2, 1.0, 0.15],
    [0.98, 0.97, 0.15, 1.0],
])
print(grouper_doublons(S, 0.95))`,
              solution: `import numpy as np

def grouper_doublons(S, seuil):
    n = S.shape[0]
    assigne = set()
    groupes = []
    for i in range(n):
        if i in assigne:
            continue
        groupe = [i]
        assigne.add(i)
        for j in range(i + 1, n):
            if j not in assigne and S[i, j] > seuil:
                groupe.append(j)
                assigne.add(j)
        if len(groupe) >= 2:
            groupes.append(groupe)
    return groupes

S = np.array([
    [1.0, 0.99, 0.1, 0.98],
    [0.99, 1.0, 0.2, 0.97],
    [0.1, 0.2, 1.0, 0.15],
    [0.98, 0.97, 0.15, 1.0],
])
print(grouper_doublons(S, 0.95))`,
              tests: `import numpy as np
_S = np.array([
    [1.0, 0.99, 0.1, 0.98],
    [0.99, 1.0, 0.2, 0.97],
    [0.1, 0.2, 1.0, 0.15],
    [0.98, 0.97, 0.15, 1.0],
])
assert grouper_doublons(_S, 0.95) == [[0, 1, 3]], "0, 1 et 3 forment un groupe ; 2 reste isolé"
assert grouper_doublons(_S, 0.999) == [], "Seuil trop haut : aucun doublon"
_S2 = np.array([[1.0, 0.99], [0.99, 1.0]])
assert grouper_doublons(_S2, 0.9) == [[0, 1]], "Une simple paire"
assert grouper_doublons(np.eye(3), 0.5) == [], "Identité : personne ne se ressemble"
print("TESTS_PASS")`,
              hints: [
                'Un set "assigne" évite qu\'un document apparaisse dans deux groupes.',
                'Le filtre final len(groupe) >= 2 écarte les documents isolés.',
                'range(i + 1, n) : seule la moitié supérieure de la matrice compte.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi normaliser AVANT le produit matriciel E @ E.T ?',
                options: [
                  'Pour éviter les nombres négatifs',
                  'Parce qu\'avec des lignes de norme 1, le produit scalaire EST le cosinus : une seule multiplication matricielle donne toutes les similarités',
                  'NumPy l\'exige',
                  'Pour réduire la taille de la matrice',
                ],
                correct: 1,
                explanation: 'C\'est pour ça que beaucoup de modèles d\'embeddings sortent des vecteurs pré-normalisés : le dot product devient directement la similarité, et le calcul en masse devient une simple multiplication de matrices — ce que les GPU adorent.',
              },
              {
                question: 'Pourquoi dédupliquer un corpus avant un fine-tuning ?',
                options: [
                  'Pour économiser du disque uniquement',
                  'Les doublons font sur-apprendre certains exemples, biaisent l\'évaluation (fuites train/test) et gaspillent du budget d\'entraînement',
                  'Les doublons font planter l\'entraînement',
                  'C\'est purement esthétique',
                ],
                correct: 1,
                explanation: 'La déduplication (souvent par similarité d\'embeddings, exactement comme ici) est une étape standard des pipelines de données des grands labos — un des facteurs les plus rentables de la qualité finale d\'un modèle.',
              },
            ],
          },
        ],
      },
    ],
  }
