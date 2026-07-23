import type { Module } from '@/lib/types'

export const m9: Module = {
    id: 'm9',
    tier: 3,
    title: "L'attention, from scratch",
    tagline: 'Le mécanisme au cœur de tous les LLM, implémenté en NumPy en une trentaine de lignes.',
    status: 'ready',
    lessons: [
      {
        id: 'm9l1',
        title: 'Softmax et scores d\'attention',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# « Attention Is All You Need »

Le papier de 2017 qui a donné naissance aux transformers — donc à GPT, Claude, Llama, Gemini — repose sur une idée qu'on peut implémenter en NumPy avec ce que tu sais déjà : des produits scalaires et une normalisation.

## L'intuition

Pour comprendre le mot « le » dans « le chat noir dort », un modèle doit savoir **quels autres mots regarder**. L'attention calcule, pour chaque token, une **moyenne pondérée** des autres tokens — où les poids reflètent la *pertinence*, mesurée par… un produit scalaire (module 5 !).

## Étape 1 : softmax, transformer des scores en poids

Les produits scalaires donnent des scores quelconques : \`[2.1, -0.3, 0.8]\`. Pour en faire des **poids de moyenne** (positifs, somme = 1), on applique softmax :

\`\`\`
softmax(x)ᵢ = exp(xᵢ) / Σⱼ exp(xⱼ)
\`\`\`

## Le piège numérique (classique en entretien !)

\`exp(1000)\` déborde en \`inf\`. La solution, utilisée dans *toutes* les implémentations réelles : soustraire le max avant l'exponentielle. Mathématiquement identique (ça se simplifie dans la fraction), numériquement stable :

\`\`\`
def softmax(x):
    e = np.exp(x - x.max())
    return e / e.sum()
\`\`\`

> Ce même softmax sert aussi à convertir les *logits* d'un LLM en probabilités sur le prochain token — c'est là qu'agit le paramètre \`temperature\` : on divise les scores par T avant le softmax. T petit → distribution piquée (déterministe) ; T grand → distribution plate (créatif).`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm9l1e1',
              title: 'Softmax stable, avec température',
              instructions: `Implémente \`softmax(x, temperature=1.0)\` :

1. divise \`x\` par \`temperature\`,
2. soustrais le max (stabilité numérique),
3. exponentielle puis normalisation par la somme.

Vérifie ensuite ton intuition : que devient la distribution quand la température baisse ?`,
              starterCode: `import numpy as np

def softmax(x, temperature=1.0):
    ...

logits = np.array([2.0, 1.0, 0.1])
print("T=1.0 :", softmax(logits))
print("T=0.1 :", softmax(logits, temperature=0.1))
print("T=10  :", softmax(logits, temperature=10))`,
              solution: `import numpy as np

def softmax(x, temperature=1.0):
    x = x / temperature
    e = np.exp(x - x.max())
    return e / e.sum()

logits = np.array([2.0, 1.0, 0.1])
print("T=1.0 :", softmax(logits))
print("T=0.1 :", softmax(logits, temperature=0.1))
print("T=10  :", softmax(logits, temperature=10))`,
              tests: `import numpy as np
_p = softmax(np.array([2.0, 1.0, 0.1]))
assert abs(_p.sum() - 1.0) < 1e-9, "Les probabilités doivent sommer à 1"
assert (_p > 0).all(), "Toutes les probabilités doivent être positives"
assert _p[0] > _p[1] > _p[2], "L'ordre des scores doit être préservé"
_stable = softmax(np.array([1000.0, 999.0]))
assert not np.isnan(_stable).any(), "softmax([1000, 999]) ne doit pas produire de NaN — soustrais le max !"
_froid = softmax(np.array([2.0, 1.0, 0.1]), temperature=0.1)
assert _froid[0] > 0.99, "À basse température, la distribution doit devenir quasi déterministe"
_chaud = softmax(np.array([2.0, 1.0, 0.1]), temperature=100)
assert abs(_chaud[0] - 1/3) < 0.01, "À très haute température, la distribution tend vers l'uniforme"
print("TESTS_PASS")`,
              hints: [
                'Divise par la température AVANT de soustraire le max.',
                'np.exp(x - x.max()) puis division par la somme : trois lignes suffisent.',
                'Si le test des NaN échoue : tu as oublié de soustraire x.max().',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi soustrait-on le max avant l\'exponentielle dans softmax ?',
                options: [
                  'Pour accélérer le calcul',
                  'Pour éviter le débordement numérique (exp de grands nombres → inf)',
                  'Pour changer le résultat final',
                  'C\'est une convention sans raison',
                ],
                correct: 1,
                explanation: 'exp(x - max) borne les valeurs entre 0 et 1 avant normalisation, sans changer le résultat mathématique. Question d\'entretien ML très fréquente !',
              },
              {
                question: 'Que fait temperature=0.2 sur la génération d\'un LLM ?',
                options: [
                  'Rend les réponses plus longues',
                  'Rend l\'échantillonnage plus déterministe : le token le plus probable est presque toujours choisi',
                  'Rend les réponses plus créatives et variées',
                  'Désactive le softmax',
                ],
                correct: 1,
                explanation: 'Basse température → distribution piquée → sorties reproductibles (bon pour l\'extraction de données). Haute température → plus de diversité (brainstorming, créativité).',
              },
            ],
          },
        ],
      },
      {
        id: 'm9l2',
        title: 'Self-attention complète en NumPy',
        minutes: 45,
        sections: [
          {
            kind: 'text',
            md: `# Q, K, V : requêtes, clés, valeurs

La self-attention se décrit avec une métaphore de moteur de recherche interne à la phrase :

- **Query (Q)** : ce que chaque token *cherche* (« je suis "le", je cherche mon nom »)
- **Key (K)** : ce que chaque token *offre* comme identité (« je suis un nom commun »)
- **Value (V)** : l'information que chaque token *transmet* si on le regarde

Chaque token est projeté en trois vecteurs (par des matrices apprises \`W_q, W_k, W_v\` — ici on les suppose déjà appliquées).

## La formule complète

\`\`\`
Attention(Q, K, V) = softmax(Q @ K.T / sqrt(d)) @ V
\`\`\`

Décomposons pour \`n\` tokens de dimension \`d\` :

1. \`Q @ K.T\` → matrice \`(n, n)\` : le score de chaque token envers chaque autre. **Un produit scalaire par paire de tokens** — tu sais déjà que produit scalaire = similarité.
2. \`/ sqrt(d)\` : sans cette division, les scores grandissent avec la dimension et saturent le softmax (gradients minuscules). C'est le « scaled » de *scaled dot-product attention*.
3. \`softmax\` **ligne par ligne** : chaque token convertit ses scores en poids qui somment à 1.
4. \`@ V\` : chaque token repart avec une moyenne pondérée des valeurs des autres.

Trente lignes de NumPy, et tu as le cœur d'un LLM. Le reste d'un transformer (module 10) : plusieurs « têtes » d'attention en parallèle, des couches empilées, des MLP, des normalisations.`,
          },
          {
            kind: 'code',
            title: 'Softmax par ligne — brique nécessaire pour l\'exercice',
            runnable: true,
            needsNumpy: true,
            code: `import numpy as np

def softmax_lignes(S):
    """Softmax appliqué à chaque ligne d'une matrice."""
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

S = np.array([[1.0, 2.0], [3.0, 0.0]])
P = softmax_lignes(S)
print(P)
print("sommes par ligne :", P.sum(axis=1))   # [1, 1]`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm9l2e1',
              title: 'Implémenter la scaled dot-product attention',
              instructions: `Implémente \`attention(Q, K, V)\` pour des matrices de shape \`(n, d)\` :

1. scores \`= Q @ K.T / sqrt(d)\` (récupère \`d\` avec \`Q.shape[1]\`)
2. poids \`= softmax\` ligne par ligne (fourni dans le starter)
3. renvoie \`poids @ V\`

C'est la formule exacte du papier de 2017 — celle qui tourne, en version optimisée GPU, à chaque token généré par un LLM.`,
              starterCode: `import numpy as np

def softmax_lignes(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def attention(Q, K, V):
    ...

# 3 tokens, dimension 4
Q = np.array([[1.0, 0.0, 0.0, 0.0],
              [0.0, 1.0, 0.0, 0.0],
              [1.0, 1.0, 0.0, 0.0]])
K = Q.copy()
V = np.array([[10.0, 0.0, 0.0, 0.0],
              [0.0, 10.0, 0.0, 0.0],
              [0.0, 0.0, 10.0, 0.0]])
sortie = attention(Q, K, V)
print(np.round(sortie, 2))`,
              solution: `import numpy as np

def softmax_lignes(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def attention(Q, K, V):
    d = Q.shape[1]
    scores = Q @ K.T / np.sqrt(d)
    poids = softmax_lignes(scores)
    return poids @ V

Q = np.array([[1.0, 0.0, 0.0, 0.0],
              [0.0, 1.0, 0.0, 0.0],
              [1.0, 1.0, 0.0, 0.0]])
K = Q.copy()
V = np.array([[10.0, 0.0, 0.0, 0.0],
              [0.0, 10.0, 0.0, 0.0],
              [0.0, 0.0, 10.0, 0.0]])
sortie = attention(Q, K, V)
print(np.round(sortie, 2))`,
              tests: `import numpy as np
_Q = np.array([[1.0, 0.0], [0.0, 1.0]])
_K = _Q.copy()
_V = np.array([[1.0, 0.0], [0.0, 1.0]])
_out = attention(_Q, _K, _V)
assert _out.shape == (2, 2), "La sortie doit avoir la même shape que V"
assert _out[0, 0] > _out[0, 1], "Le token 0 doit s'accorder plus de poids à lui-même qu'au token 1"
# Vérification numérique exacte contre la formule de référence
_d = _Q.shape[1]
_S = _Q @ _K.T / np.sqrt(_d)
_e = np.exp(_S - _S.max(axis=1, keepdims=True))
_P = _e / _e.sum(axis=1, keepdims=True)
assert np.allclose(_out, _P @ _V), "Le résultat ne correspond pas à softmax(QK^T/√d)V — vérifie l'ordre des opérations"
_rows = attention(np.random.RandomState(0).randn(5, 8), np.random.RandomState(1).randn(5, 8), np.random.RandomState(2).randn(5, 8))
assert _rows.shape == (5, 8), "Avec 5 tokens de dim 8, la sortie doit être (5, 8)"
print("TESTS_PASS")`,
              hints: [
                'd = Q.shape[1], puis scores = Q @ K.T / np.sqrt(d).',
                'K.T transpose la matrice : (n, d) @ (d, n) → (n, n), un score par paire de tokens.',
                'Trois lignes dans le corps de la fonction suffisent.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Que représente la matrice softmax(QKᵀ/√d) de shape (n, n) ?',
                options: [
                  'Les embeddings finaux des tokens',
                  'Pour chaque token (ligne), les poids d\'attention qu\'il porte à chaque autre token',
                  'Les probabilités du prochain token',
                  'La matrice des gradients',
                ],
                correct: 1,
                explanation: 'La ligne i dit « à quel point le token i regarde chaque token j ». C\'est cette matrice qu\'on visualise dans les fameuses "cartes d\'attention".',
              },
              {
                question: 'Pourquoi divise-t-on par √d ?',
                options: [
                  'Pour normaliser les embeddings',
                  'Parce que les produits scalaires grandissent avec la dimension, ce qui saturerait le softmax',
                  'Pour réduire le coût mémoire',
                  'C\'est une erreur historique du papier',
                ],
                correct: 1,
                explanation: 'En dimension d, un produit scalaire de vecteurs aléatoires a un écart-type ~√d. Sans la division, le softmax devient quasi one-hot et les gradients s\'évanouissent.',
              },
              {
                question: 'Quel est le coût de la self-attention pour une séquence de n tokens ?',
                options: [
                  'O(n) — linéaire',
                  'O(n²) — chaque token regarde tous les autres',
                  'O(log n)',
                  'O(1) grâce au GPU',
                ],
                correct: 1,
                explanation: 'QKᵀ est une matrice (n, n) : c\'est le fameux coût quadratique qui rend les longs contextes chers, et motive KV-cache, flash attention et les variantes efficientes.',
              },
            ],
          },
        ],
      },
      {
        id: 'm9l3',
        title: 'Le masque causal : ne pas voir le futur',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# La pièce qui fait de l'attention un GPT

Ton attention laisse chaque token regarder *tous* les autres — y compris ceux qui viennent après. Pour un modèle qui **prédit le token suivant**, c'est de la triche : à l'entraînement, le token 3 verrait la réponse (le token 4) juste à côté. Les modèles de type GPT sont dits **causaux** : chaque position ne peut regarder que le passé.

## L'implémentation : un masque à -inf

L'astuce est d'une élégance rare. Avant le softmax, on remplace les scores des positions futures par \`-inf\` :

\`\`\`
scores[i, j] = -inf   pour j > i     (le futur, interdit)
\`\`\`

Or \`exp(-inf) = 0\` : après softmax, les poids du futur sont **exactement zéro**, et les poids restants se renormalisent tout seuls entre eux. Aucune règle spéciale, la formule fait tout.

\`\`\`
masque = np.triu(np.ones((n, n)), k=1)   # triangle supérieur strict
scores = np.where(masque == 1, -np.inf, scores)
\`\`\`

## Pourquoi c'est fondamental

C'est ce masque qui permet l'entraînement massivement parallèle des GPT : une phrase de n tokens fournit n exercices de prédiction *simultanés* (chaque position prédit la suivante), calculés en un seul passage de matrices. Sans le masque, il faudrait un passage par position. Le même masque explique aussi le KV-cache à l'inférence : le passé ne changeant jamais, on le calcule une seule fois.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm9l3e1',
              title: 'Attention causale',
              instructions: `Implémente \`attention_causale(Q, K, V)\` :

1. scores \`Q @ K.T / sqrt(d)\` comme d'habitude,
2. construis le masque du futur avec \`np.triu(np.ones((n, n)), k=1)\`,
3. applique \`np.where(masque == 1, -np.inf, scores)\`,
4. softmax ligne par ligne (fourni), puis \`@ V\`.

Les tests vérifient la propriété clé : la sortie du token i ne doit dépendre QUE des tokens 0..i.`,
              starterCode: `import numpy as np

def softmax_lignes(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def attention_causale(Q, K, V):
    ...

rng = np.random.RandomState(0)
Q = rng.randn(4, 3); K = rng.randn(4, 3); V = rng.randn(4, 3)
print(np.round(attention_causale(Q, K, V), 2))`,
              solution: `import numpy as np

def softmax_lignes(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def attention_causale(Q, K, V):
    n, d = Q.shape
    scores = Q @ K.T / np.sqrt(d)
    masque = np.triu(np.ones((n, n)), k=1)
    scores = np.where(masque == 1, -np.inf, scores)
    return softmax_lignes(scores) @ V

rng = np.random.RandomState(0)
Q = rng.randn(4, 3); K = rng.randn(4, 3); V = rng.randn(4, 3)
print(np.round(attention_causale(Q, K, V), 2))`,
              tests: `import numpy as np
_rng = np.random.RandomState(0)
_Q = _rng.randn(4, 3); _K = _rng.randn(4, 3); _V = _rng.randn(4, 3)
_out = attention_causale(_Q, _K, _V)
assert _out.shape == (4, 3), "Shape préservée"
assert np.allclose(_out[0], _V[0]), "Le token 0 ne voit que lui-même : sa sortie est exactement V[0]"
# Propriété causale : modifier le FUTUR ne change pas les sorties passées
_V2 = _V.copy(); _V2[3] = 999.0
_K2 = _K.copy(); _K2[3] = 999.0
_out2 = attention_causale(_Q, _K2, _V2)
assert np.allclose(_out[:3], _out2[:3]), "Modifier le token 3 ne doit PAS changer les sorties des tokens 0-2 !"
assert not np.allclose(_out[3], _out2[3]), "La sortie du token 3, elle, doit changer"
_p = softmax_lignes(np.where(np.triu(np.ones((3, 3)), 1) == 1, -np.inf, np.zeros((3, 3))))
assert np.allclose(_p.sum(axis=1), 1.0), "Les poids restent normalisés malgré le masque"
print("TESTS_PASS")`,
              hints: [
                'np.triu(matrice, k=1) garde le triangle STRICTEMENT au-dessus de la diagonale — exactement les positions futures.',
                'np.where(condition, -np.inf, scores) remplace sans boucle.',
                'Le softmax fourni gère -inf proprement (exp(-inf) = 0).',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi -inf plutôt que simplement mettre les poids du futur à 0 après softmax ?',
                options: [
                  'C\'est équivalent',
                  'Mettre 0 APRÈS softmax casserait la normalisation (la somme ne ferait plus 1) ; -inf AVANT laisse le softmax renormaliser proprement le passé',
                  '-inf est plus rapide à calculer',
                  'Pour éviter les divisions',
                ],
                correct: 1,
                explanation: 'exp(-inf)=0 entre dans le calcul de la somme : les poids du passé se répartissent automatiquement 100 % de l\'attention. Zéroter après coup exigerait une re-normalisation manuelle — source de bugs.',
              },
              {
                question: 'En quoi le masque causal permet-il l\'entraînement parallèle des GPT ?',
                options: [
                  'Il réduit la mémoire',
                  'Chaque position prédit son token suivant sans voir la réponse : une séquence de n tokens = n exemples d\'entraînement traités en UN passage matriciel',
                  'Il supprime le softmax',
                  'Il divise le corpus en morceaux',
                ],
                correct: 1,
                explanation: 'C\'est l\'avantage décisif des transformers sur les RNN, qui devaient avancer token par token. Tout le pré-entraînement des LLM repose sur ce parallélisme massif.',
              },
            ],
          },
        ],
      },
    ],
  }
