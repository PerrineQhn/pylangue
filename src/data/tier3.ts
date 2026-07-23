import type { Module } from '@/lib/types'

export const tier3: Module[] = [
  {
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
    ],
  },
  {
    id: 'm10',
    tier: 3,
    title: 'Anatomie complète d\'un transformer',
    tagline: 'Multi-têtes, résidus, layer norm : assembler le bloc qui, empilé, devient GPT.',
    status: 'ready',
    lessons: [
      {
        id: 'm10l1',
        title: 'Multi-head attention',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# Plusieurs regards en parallèle

Ton attention du module 9 calcule *une* pondération par paire de tokens. Mais une phrase mérite plusieurs lectures simultanées : qui fait quoi (syntaxe), qui désigne qui (coréférence), quel ton… L'idée du **multi-head** : découper la dimension en \`h\` « têtes », faire tourner une attention *indépendante* dans chaque sous-espace, puis concaténer.

## Le mécanisme

Pour des matrices \`Q, K, V\` de shape \`(n, d)\` et \`h\` têtes (avec \`d\` divisible par \`h\`) :

\`\`\`
1. Découpe Q, K, V en h tranches de largeur d/h (sur les colonnes)
2. Pour chaque tête i : sortie_i = attention(Q_i, K_i, V_i)   # ton module 9 !
3. Concatène les h sorties -> shape (n, d) à nouveau
\`\`\`

(Dans un vrai transformer s'ajoute une projection linéaire finale apprise — conceptuellement secondaire ici.)

## Pourquoi l'ordre des tokens n'existe pas encore

Surprise : l'attention est **insensible à l'ordre** — permuter les tokens permute juste les sorties. Or « le chat mord le chien » ≠ « le chien mord le chat ». Les transformers injectent donc l'information de position dans les embeddings : *positional encodings* appris (GPT-2), ou rotations RoPE appliquées à Q et K (Llama, la plupart des modèles récents). Retiens le principe : **la position est une information ajoutée, pas une propriété de l'architecture**.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm10l1e1',
              title: 'Implémenter le multi-head',
              instructions: `Le starter fournit \`attention(Q, K, V)\` (ton module 9). Implémente :

\`multi_head(Q, K, V, h)\` qui :

1. calcule \`dh = d // h\` (largeur d'une tête),
2. pour chaque tête \`i\` : extrait les colonnes \`[i*dh : (i+1)*dh]\` de Q, K et V, applique \`attention\`,
3. concatène les sorties avec \`np.concatenate(liste, axis=1)\` et la renvoie (shape \`(n, d)\`).`,
              starterCode: `import numpy as np

def softmax_lignes(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def attention(Q, K, V):
    d = Q.shape[1]
    return softmax_lignes(Q @ K.T / np.sqrt(d)) @ V

def multi_head(Q, K, V, h):
    ...

rng = np.random.RandomState(0)
Q = rng.randn(4, 8); K = rng.randn(4, 8); V = rng.randn(4, 8)
sortie = multi_head(Q, K, V, h=2)
print("shape :", sortie.shape)`,
              solution: `import numpy as np

def softmax_lignes(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def attention(Q, K, V):
    d = Q.shape[1]
    return softmax_lignes(Q @ K.T / np.sqrt(d)) @ V

def multi_head(Q, K, V, h):
    d = Q.shape[1]
    dh = d // h
    sorties = []
    for i in range(h):
        deb, fin = i * dh, (i + 1) * dh
        sorties.append(attention(Q[:, deb:fin], K[:, deb:fin], V[:, deb:fin]))
    return np.concatenate(sorties, axis=1)

rng = np.random.RandomState(0)
Q = rng.randn(4, 8); K = rng.randn(4, 8); V = rng.randn(4, 8)
sortie = multi_head(Q, K, V, h=2)
print("shape :", sortie.shape)`,
              tests: `import numpy as np
_rng = np.random.RandomState(0)
_Q = _rng.randn(4, 8); _K = _rng.randn(4, 8); _V = _rng.randn(4, 8)
_out = multi_head(_Q, _K, _V, 2)
assert _out.shape == (4, 8), "La shape de sortie doit être (n, d)"
assert np.allclose(multi_head(_Q, _K, _V, 1), attention(_Q, _K, _V)), "Avec h=1, multi_head == attention simple"
_t0 = attention(_Q[:, :4], _K[:, :4], _V[:, :4])
assert np.allclose(_out[:, :4], _t0), "Les 4 premières colonnes doivent venir de la tête 0 (colonnes 0-3)"
_t1 = attention(_Q[:, 4:], _K[:, 4:], _V[:, 4:])
assert np.allclose(_out[:, 4:], _t1), "Les 4 dernières colonnes doivent venir de la tête 1"
assert not np.allclose(_out, attention(_Q, _K, _V)), "h=2 doit donner un résultat différent d'une seule grande attention"
print("TESTS_PASS")`,
              hints: [
                'Q[:, deb:fin] extrait les colonnes deb à fin-1 — le slicing 2D de NumPy.',
                'Accumule les sorties de chaque tête dans une liste, puis np.concatenate(liste, axis=1).',
                'Vérifie avec h=1 : tu dois retrouver exactement ton attention simple.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Qu\'apporte le multi-head par rapport à une seule attention de même dimension totale ?',
                options: [
                  'Uniquement de la vitesse',
                  'Chaque tête peut se spécialiser sur un type de relation différent (syntaxe, coréférence, position…) dans son propre sous-espace',
                  'Plus de paramètres, rien d\'autre',
                  'Il supprime le coût quadratique',
                ],
                correct: 1,
                explanation: 'Les visualisations montrent des têtes spécialisées : l\'une suit le token précédent, une autre les accords, une autre les entités. Une attention unique moyennerait ces "regards" incompatibles.',
              },
              {
                question: 'Pourquoi les transformers ont-ils besoin de positional encodings ?',
                options: [
                  'Pour accélérer l\'entraînement',
                  'L\'attention seule est invariante à l\'ordre des tokens : sans position injectée, "chat mord chien" = "chien mord chat"',
                  'Pour compresser les embeddings',
                  'C\'est optionnel, GPT n\'en a pas',
                ],
                correct: 1,
                explanation: 'L\'attention est une opération sur des *ensembles*. La position doit être ajoutée explicitement — embeddings de position appris, ou rotations RoPE (Llama, Qwen, la norme actuelle).',
              },
            ],
          },
        ],
      },
      {
        id: 'm10l2',
        title: 'Le bloc transformer : résidus, layer norm, MLP',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# Les trois ingrédients restants

Un « bloc transformer » (répété 32 fois dans Llama-8B, ~100 fois dans les plus gros modèles) ajoute trois mécanismes autour de l'attention :

## 1. Les connexions résiduelles

Au lieu de \`x = f(x)\`, on écrit \`x = x + f(x)\` : chaque couche *ajoute une correction* au lieu de remplacer. C'est ce qui permet d'empiler des dizaines de couches sans que le gradient ne s'évanouisse — l'information a toujours un « raccourci » direct.

## 2. La layer normalization

Recentre et rééchelonne chaque vecteur de token (moyenne 0, variance 1) pour stabiliser l'entraînement :

\`\`\`
layer_norm(x) = (x - moyenne(x)) / sqrt(variance(x) + eps)
\`\`\`

(par ligne — chaque token est normalisé indépendamment ; les modèles récents utilisent la variante RMSNorm, encore plus simple.)

## 3. Le MLP (feed-forward)

Après l'attention (qui *mélange* les tokens entre eux), un petit réseau à deux couches traite chaque token *individuellement* : expansion ×4, non-linéarité, retour à la dimension d'origine. C'est là que résident ~2/3 des paramètres d'un LLM — on l'interprète souvent comme la « mémoire des connaissances » du modèle.

## Le bloc assemblé (version pré-norm, la moderne)

\`\`\`
x = x + attention(layer_norm(x))     # communication entre tokens
x = x + mlp(layer_norm(x))           # calcul par token
\`\`\`

Deux lignes. Empile-les N fois entre un embedding d'entrée et un softmax de sortie : tu as un GPT.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm10l2e1',
              title: 'Assembler le bloc complet',
              instructions: `Le starter fournit \`attention\`. Implémente :

1. \`layer_norm(X)\` — normalise **chaque ligne** : soustrais sa moyenne, divise par \`sqrt(variance + 1e-5)\` (utilise \`mean\` et \`var\` avec \`axis=1, keepdims=True\`),
2. \`mlp(X, W1, W2)\` — \`relu(X @ W1) @ W2\` où \`relu(z) = np.maximum(0, z)\`,
3. \`bloc_transformer(X, W1, W2)\` — les deux lignes du cours : résiduel + attention sur la norme (avec \`Q=K=V=layer_norm(X)\`), puis résiduel + MLP sur la norme.`,
              starterCode: `import numpy as np

def softmax_lignes(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def attention(Q, K, V):
    d = Q.shape[1]
    return softmax_lignes(Q @ K.T / np.sqrt(d)) @ V

def layer_norm(X):
    ...

def mlp(X, W1, W2):
    ...

def bloc_transformer(X, W1, W2):
    ...

rng = np.random.RandomState(1)
X = rng.randn(3, 4)          # 3 tokens, dim 4
W1 = rng.randn(4, 16) * 0.1  # expansion x4
W2 = rng.randn(16, 4) * 0.1
print(bloc_transformer(X, W1, W2).round(2))`,
              solution: `import numpy as np

def softmax_lignes(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def attention(Q, K, V):
    d = Q.shape[1]
    return softmax_lignes(Q @ K.T / np.sqrt(d)) @ V

def layer_norm(X):
    mu = X.mean(axis=1, keepdims=True)
    var = X.var(axis=1, keepdims=True)
    return (X - mu) / np.sqrt(var + 1e-5)

def mlp(X, W1, W2):
    return np.maximum(0, X @ W1) @ W2

def bloc_transformer(X, W1, W2):
    n = layer_norm(X)
    X = X + attention(n, n, n)
    n = layer_norm(X)
    X = X + mlp(n, W1, W2)
    return X

rng = np.random.RandomState(1)
X = rng.randn(3, 4)
W1 = rng.randn(4, 16) * 0.1
W2 = rng.randn(16, 4) * 0.1
print(bloc_transformer(X, W1, W2).round(2))`,
              tests: `import numpy as np
_X = np.array([[1.0, 2.0, 3.0, 4.0], [10.0, 10.0, 10.0, 10.0]])
_n = layer_norm(_X)
assert np.allclose(_n.mean(axis=1), 0, atol=1e-6), "Chaque ligne doit avoir une moyenne ~0"
assert np.allclose(_n[0].std(), 1, atol=1e-2), "Chaque ligne doit avoir un écart-type ~1"
assert not np.isnan(_n).any(), "Une ligne constante ne doit pas donner NaN — le +1e-5 sous la racine"
_rng = np.random.RandomState(1)
_Xr = _rng.randn(3, 4); _W1 = _rng.randn(4, 16) * 0.1; _W2 = _rng.randn(16, 4) * 0.1
assert mlp(np.zeros((2, 4)), _W1, _W2).shape == (2, 4), "Le MLP doit rendre la dimension d'origine"
_out = bloc_transformer(_Xr, _W1, _W2)
assert _out.shape == _Xr.shape, "Le bloc préserve la shape (empilable N fois !)"
assert not np.allclose(_out, _Xr), "Le bloc doit transformer l'entrée"
_corr = np.corrcoef(_out.flatten(), _Xr.flatten())[0, 1]
assert _corr > 0.5, "Grâce aux résidus, la sortie doit rester corrélée à l'entrée (x + correction)"
print("TESTS_PASS")`,
              hints: [
                'layer_norm : mean et var avec axis=1, keepdims=True pour que le broadcasting fonctionne ligne à ligne.',
                'relu = np.maximum(0, ·) — élément par élément.',
                'bloc : X = X + attention(n, n, n) puis X = X + mlp(layer_norm(X), W1, W2). L\'ordre pré-norm : on normalise AVANT chaque sous-couche.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi x = x + f(x) (résiduel) plutôt que x = f(x) ?',
                options: [
                  'C\'est plus rapide à calculer',
                  'Le gradient peut traverser directement l\'addition : on peut empiler des dizaines de couches sans que le signal d\'apprentissage ne s\'évanouisse',
                  'Ça économise de la mémoire',
                  'Pour éviter les nombres négatifs',
                ],
                correct: 1,
                explanation: 'Sans résidus, les réseaux au-delà de ~10 couches deviennent quasi inentraînables. Cette idée (ResNet, 2015) est l\'un des déblocages qui ont rendu possibles les architectures à 100+ couches des LLM.',
              },
              {
                question: 'Quelle est la division du travail entre attention et MLP dans un bloc ?',
                options: [
                  'Ils font la même chose en double',
                  'L\'attention fait circuler l\'information ENTRE les tokens ; le MLP transforme chaque token INDIVIDUELLEMENT',
                  'L\'attention gère le texte, le MLP les images',
                  'Le MLP corrige les erreurs de l\'attention',
                ],
                correct: 1,
                explanation: 'Communication puis calcul : c\'est la lecture standard du bloc. Les travaux d\'interprétabilité localisent d\'ailleurs beaucoup de "connaissances factuelles" dans les MLP, et les "relations" dans l\'attention.',
              },
              {
                question: 'Il te manque quoi, concrètement, pour transformer ton bloc en vrai GPT qui génère du texte ?',
                options: [
                  'Rien du tout',
                  'Les projections apprises (W_q, W_k, W_v), le masque causal, les embeddings (tokens + positions), l\'empilement de N blocs et le softmax final — puis un GROS entraînement',
                  'Un algorithme complètement différent',
                  'Une base de données de réponses',
                ],
                correct: 1,
                explanation: 'Tout le squelette y est ! Le masque causal (chaque token ne regarde que ses prédécesseurs) est la seule pièce conceptuelle nouvelle. Lecture recommandée maintenant : nanoGPT de Karpathy — ~300 lignes que tu peux désormais lire ligne à ligne.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'm11',
    tier: 3,
    title: 'Coder avec les API LLM',
    tagline: 'Messages, rôles, température, sorties structurées : les gestes professionnels de 2026.',
    status: 'ready',
    lessons: [
      {
        id: 'm11l1',
        title: 'Anatomie d\'un appel LLM',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Le format universel : une liste de messages

Toutes les API LLM modernes (Anthropic, OpenAI, Mistral, modèles locaux via Ollama…) partagent la même structure de requête : une **liste de messages**, chacun avec un \`role\` et un \`content\` :

\`\`\`
messages = [
    {"role": "user", "content": "Explique le RAG en une phrase."},
    {"role": "assistant", "content": "Le RAG combine..."},
    {"role": "user", "content": "Et en anglais ?"},
]
\`\`\`

- \`system\` (ou paramètre dédié) : les instructions de cadrage — ton, format, contraintes
- \`user\` / \`assistant\` : l'historique de conversation, en alternance
- Le modèle est **sans état** : à chaque appel, tu renvoies *tout* l'historique. La « mémoire » d'un chatbot, c'est toi qui la gères, dans cette liste.

## Les paramètres qui comptent

- \`model\` : le modèle choisi (compromis coût / capacité / latence)
- \`temperature\` : tu l'as implémentée au module 9 ! 0 → extraction fiable, ~1 → créativité
- \`max_tokens\` : borne de longueur de la réponse (et de la facture)

## S'entraîner sans clé d'API

Dans cette leçon, tu travailles avec \`MockLLM\`, un faux client qui reproduit fidèlement l'interface d'un vrai SDK. C'est une pratique professionnelle standard : on développe et on teste contre un *mock*, puis on branche le vrai client — l'interface étant identique, le reste du code ne change pas.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm11l1e1',
              title: 'Gérer une conversation multi-tours',
              instructions: `Le \`MockLLM\` du starter imite un vrai SDK : \`client.chat(messages, temperature=...)\` renvoie un dict \`{"role": "assistant", "content": "..."}\`.

Écris la classe \`Conversation\` :

- \`__init__(client, system)\` : stocke le client et initialise \`self.messages\` avec le message system
- \`demander(question)\` : ajoute le message user, appelle \`client.chat(self.messages)\`, **ajoute la réponse à l'historique** (sinon le modèle « oublie » !), et renvoie le \`content\` de la réponse

C'est le squelette de tout chatbot — celui que tu réécrirais avec le vrai SDK Anthropic ou OpenAI en changeant deux lignes.`,
              starterCode: `class MockLLM:
    """Faux client LLM, interface identique à un vrai SDK."""
    def chat(self, messages, temperature=0.7):
        assert messages[0]["role"] == "system", "Le premier message doit être system"
        n_users = sum(1 for m in messages if m["role"] == "user")
        dernier = messages[-1]["content"]
        return {"role": "assistant",
                "content": f"[Réponse au tour {n_users} à : {dernier}]"}

class Conversation:
    def __init__(self, client, system):
        ...

    def demander(self, question):
        ...

conv = Conversation(MockLLM(), "Tu es un tuteur Python concis.")
print(conv.demander("C'est quoi un embedding ?"))
print(conv.demander("Donne un exemple."))
print(f"Historique : {len(conv.messages)} messages")`,
              solution: `class MockLLM:
    def chat(self, messages, temperature=0.7):
        assert messages[0]["role"] == "system", "Le premier message doit être system"
        n_users = sum(1 for m in messages if m["role"] == "user")
        dernier = messages[-1]["content"]
        return {"role": "assistant",
                "content": f"[Réponse au tour {n_users} à : {dernier}]"}

class Conversation:
    def __init__(self, client, system):
        self.client = client
        self.messages = [{"role": "system", "content": system}]

    def demander(self, question):
        self.messages.append({"role": "user", "content": question})
        reponse = self.client.chat(self.messages)
        self.messages.append(reponse)
        return reponse["content"]

conv = Conversation(MockLLM(), "Tu es un tuteur Python concis.")
print(conv.demander("C'est quoi un embedding ?"))
print(conv.demander("Donne un exemple."))
print(f"Historique : {len(conv.messages)} messages")`,
              tests: `_c = Conversation(MockLLM(), "Tu es utile.")
_r1 = _c.demander("Question A")
assert "tour 1" in _r1, "Le premier appel doit être le tour 1"
_r2 = _c.demander("Question B")
assert "tour 2" in _r2, "Le mock doit voir 2 messages user : as-tu bien conservé l'historique ?"
assert len(_c.messages) == 5, "Après 2 tours : system + 2×(user + assistant) = 5 messages"
assert _c.messages[0]["role"] == "system", "Le message system doit rester en tête"
assert _c.messages[-1]["role"] == "assistant", "Le dernier message doit être la réponse de l'assistant"
print("TESTS_PASS")`,
              hints: [
                'self.messages démarre avec [{"role": "system", "content": system}].',
                'demander : append du user, appel au client, append de la réponse, return du content.',
                'Si le test "tour 2" échoue : tu n\'ajoutes pas la réponse assistant à l\'historique.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi doit-on renvoyer tout l\'historique à chaque appel d\'API ?',
                options: [
                  'Pour des raisons de facturation',
                  'Parce que les API LLM sont sans état : le modèle ne "se souvient" que de ce qu\'on lui envoie',
                  'C\'est optionnel, le serveur garde l\'historique',
                  'Pour chiffrer la conversation',
                ],
                correct: 1,
                explanation: 'Chaque appel est indépendant. C\'est aussi pour ça que les longues conversations coûtent de plus en plus cher en tokens d\'entrée — d\'où les stratégies de résumé d\'historique et le prompt caching.',
              },
              {
                question: 'Pour extraire des données structurées d\'un document, quelle température choisir ?',
                options: ['1.5', '0.9', '0 (ou proche de 0)', 'La température n\'a aucun effet'],
                correct: 2,
                explanation: 'L\'extraction demande de la reproductibilité, pas de la créativité : température minimale. Tu as vu au module 9 pourquoi : la distribution devient quasi déterministe.',
              },
            ],
          },
        ],
      },
      {
        id: 'm11l2',
        title: 'Sorties structurées et robustesse',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Le LLM comme composant logiciel

Dans une vraie application, la sortie du LLM n'est pas lue par un humain : elle alimente **du code**. Il faut donc des sorties *structurées* (JSON) et un code *robuste* face aux réponses imparfaites.

## Demander du JSON

Le geste de base : spécifier le schéma dans le prompt.

\`\`\`
prompt = """Extrais du texte suivant un JSON avec les clés
"nom" (str), "sentiment" ("positif"|"negatif"|"neutre") et "score" (float 0-1).
Réponds UNIQUEMENT avec le JSON, sans texte autour.

Texte : {texte}"""
\`\`\`

(Les API modernes offrent aussi des modes JSON garantis et le *function calling* / *tool use* — même principe, contraintes appliquées côté serveur.)

## Le problème : le modèle « déborde »

Malgré la consigne, un modèle peut répondre :

\`\`\`
Voici le JSON demandé :
{"nom": "produit X", "sentiment": "positif", "score": 0.9}
J'espère que cela vous aide !
\`\`\`

Un \`json.loads\` naïf explose. Le réflexe professionnel : **extraire** le JSON de la réponse (chercher le premier \`{\` et le dernier \`}\`), parser, **valider** les champs, et prévoir un plan B (nouvelle tentative, valeur par défaut, erreur explicite).

> Cette « couche de défiance » entre le LLM et ton code, c'est ce qui distingue une démo d'un produit. Les bibliothèques comme Pydantic ou Instructor industrialisent exactement ça.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm11l2e1',
              title: 'Parser robuste de réponses LLM',
              instructions: `Écris \`extraire_json(reponse)\` qui :

1. localise le premier \`{\` et le dernier \`}\` de la chaîne (méthodes \`.find()\` et \`.rfind()\`),
2. si l'un des deux est absent → renvoie \`None\`,
3. tente \`json.loads\` sur la sous-chaîne ; en cas de \`json.JSONDecodeError\` → renvoie \`None\`,
4. sinon renvoie le dictionnaire.

Puis \`extraire_sentiment(reponse)\` qui utilise la première et renvoie la valeur de \`"sentiment"\` si elle vaut \`"positif"\`, \`"negatif"\` ou \`"neutre"\` — sinon \`"inconnu"\`.`,
              starterCode: `import json

def extraire_json(reponse):
    ...

def extraire_sentiment(reponse):
    ...

brut = 'Voici : {"sentiment": "positif", "score": 0.9} Voilà !'
print(extraire_json(brut))
print(extraire_sentiment(brut))
print(extraire_sentiment("Désolé, je ne peux pas."))`,
              solution: `import json

def extraire_json(reponse):
    debut = reponse.find("{")
    fin = reponse.rfind("}")
    if debut == -1 or fin == -1:
        return None
    try:
        return json.loads(reponse[debut:fin + 1])
    except json.JSONDecodeError:
        return None

def extraire_sentiment(reponse):
    data = extraire_json(reponse)
    if data and data.get("sentiment") in ("positif", "negatif", "neutre"):
        return data["sentiment"]
    return "inconnu"

brut = 'Voici : {"sentiment": "positif", "score": 0.9} Voilà !'
print(extraire_json(brut))
print(extraire_sentiment(brut))
print(extraire_sentiment("Désolé, je ne peux pas."))`,
              tests: `assert extraire_json('{"a": 1}') == {"a": 1}, "JSON propre : doit être parsé"
assert extraire_json('bla {"a": 1} bla') == {"a": 1}, "JSON entouré de texte : doit être extrait"
assert extraire_json('pas de json ici') is None, "Aucun JSON : None"
assert extraire_json('{"cassé": ') is None, "JSON invalide : None, pas une exception !"
assert extraire_sentiment('ok {"sentiment": "negatif"}') == "negatif", "Doit extraire 'negatif'"
assert extraire_sentiment('{"sentiment": "euphorique"}') == "inconnu", "Valeur hors schéma : 'inconnu'"
assert extraire_sentiment('rien') == "inconnu", "Pas de JSON : 'inconnu'"
print("TESTS_PASS")`,
              hints: [
                '.find("{") renvoie -1 si absent — teste-le avant de découper.',
                'La tranche est reponse[debut:fin + 1] — le +1 pour inclure la dernière accolade.',
                'try/except json.JSONDecodeError autour de json.loads, return None dans le except.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi valider les champs du JSON même après un parsing réussi ?',
                options: [
                  'Par pur formalisme',
                  'Le modèle peut renvoyer un JSON valide mais avec des valeurs hors schéma (clé manquante, catégorie inventée)',
                  'json.loads valide déjà le schéma',
                  'Pour améliorer la vitesse',
                ],
                correct: 1,
                explanation: 'Syntaxe valide ≠ schéma respecté. Un LLM peut inventer "sentiment": "mitigé". Pydantic/Instructor automatisent cette validation — le principe reste identique.',
              },
              {
                question: 'Qu\'est-ce que le "tool use" (function calling) d\'une API LLM ?',
                options: [
                  'Le modèle exécute lui-même du code sur le serveur',
                  'On déclare des fonctions avec leur schéma ; le modèle répond par un appel structuré que NOTRE code exécute',
                  'Un plugin de l\'éditeur de code',
                  'Une technique de fine-tuning',
                ],
                correct: 1,
                explanation: 'Le modèle ne fait que produire une demande d\'appel structurée (nom + arguments JSON validés). C\'est ton code qui exécute et renvoie le résultat — c\'est la brique de base des agents (module 13).',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'm12',
    tier: 3,
    title: 'RAG de bout en bout',
    tagline: 'Chunking, retrieval, assemblage de prompt : construire le pattern le plus demandé en entreprise.',
    status: 'ready',
    lessons: [
      {
        id: 'm12l1',
        title: 'Chunking : découper intelligemment',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Pourquoi le RAG, et pourquoi le chunking d'abord

Un LLM ne connaît ni tes documents internes, ni rien de postérieur à son entraînement. Le **RAG** (Retrieval-Augmented Generation) répond en deux temps : *retrouver* les passages pertinents dans ta base documentaire, puis les *injecter* dans le prompt pour que le modèle réponde en s'appuyant dessus.

Tout commence par le **chunking** : découper les documents en morceaux indexables. C'est l'étape la plus sous-estimée — et celle qui fait le plus souvent la différence entre un RAG qui marche et un RAG qui hallucine.

## Les deux paramètres clés

- **Taille du chunk** : trop petit → le contexte est amputé (une phrase orpheline ne veut rien dire) ; trop grand → le retrieval devient imprécis et le prompt se remplit de bruit. Typiquement 200-800 tokens.
- **Chevauchement (overlap)** : les chunks consécutifs partagent une marge (10-20 %) pour qu'une information à cheval sur une frontière ne soit jamais coupée en deux moitiés inutilisables.

\`\`\`
Texte :   [ A B C D E F G H I J ]
taille=4, overlap=1 :
chunk 1 : [ A B C D ]
chunk 2 : [ D E F G ]      # D répété : le chevauchement
chunk 3 : [ G H I J ]
\`\`\`

## En production

Les découpages réels respectent la *structure* : paragraphes, titres, cellules de tableau — plutôt que des fenêtres aveugles. Mais la fenêtre glissante avec chevauchement reste la base de référence, et c'est elle que tu implémentes aujourd'hui.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm12l1e1',
              title: 'Fenêtre glissante avec chevauchement',
              instructions: `Implémente \`decouper(texte, taille, overlap)\` :

1. tokenise par espaces (\`.split()\`),
2. produit des chunks de \`taille\` mots, chaque chunk commençant \`taille - overlap\` mots après le précédent,
3. chaque chunk est la chaîne des mots re-joints par des espaces,
4. le dernier chunk peut être plus court, mais **ne produis pas** de chunk entièrement contenu dans le précédent.

Exemple : 10 mots, taille=4, overlap=1 → chunks aux positions 0, 3, 6, 9… non, 0, 3, 6 (le chunk partant de 9 serait couvert).`,
              starterCode: `def decouper(texte, taille, overlap):
    ...

texte = "a b c d e f g h i j"
for c in decouper(texte, taille=4, overlap=1):
    print(repr(c))`,
              solution: `def decouper(texte, taille, overlap):
    mots = texte.split()
    pas = taille - overlap
    chunks = []
    for debut in range(0, len(mots), pas):
        chunk = mots[debut:debut + taille]
        chunks.append(" ".join(chunk))
        if debut + taille >= len(mots):
            break
    return chunks

texte = "a b c d e f g h i j"
for c in decouper(texte, taille=4, overlap=1):
    print(repr(c))`,
              tests: `_c = decouper("a b c d e f g h i j", 4, 1)
assert _c == ["a b c d", "d e f g", "g h i j"], "Fenêtres de 4 avec 1 mot de chevauchement"
_c2 = decouper("a b c d e", 3, 0)
assert _c2 == ["a b c", "d e"], "Sans overlap : blocs disjoints, dernier incomplet"
_c3 = decouper("a b", 5, 2)
assert _c3 == ["a b"], "Texte plus court qu'un chunk : un seul chunk"
_c4 = decouper("a b c d e f", 4, 2)
assert _c4 == ["a b c d", "c d e f"], "taille=4, overlap=2 : pas de 2"
for _prev, _nxt in zip(_c[:-1], _c[1:]):
    assert _prev.split()[-1] == _nxt.split()[0], "Les chunks consécutifs doivent partager le mot de chevauchement"
print("TESTS_PASS")`,
              hints: [
                'Le pas d\'avancement est taille - overlap ; range(0, len(mots), pas) donne les débuts.',
                'mots[debut:debut + taille] — le slicing tronque tout seul en fin de liste.',
                'Le "break" quand debut + taille >= len(mots) évite un dernier chunk redondant entièrement couvert.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'À quoi sert le chevauchement entre chunks ?',
                options: [
                  'À augmenter artificiellement la taille de la base',
                  'À éviter qu\'une information à cheval sur une frontière de chunk devienne introuvable (coupée en deux moitiés)',
                  'À accélérer le retrieval',
                  'À compresser les documents',
                ],
                correct: 1,
                explanation: '"Le capital de la société [FRONTIÈRE] s\'élève à 2 M€" : sans overlap, aucun des deux chunks ne contient l\'information complète. Le chevauchement est une assurance peu coûteuse.',
              },
              {
                question: 'Quel symptôme typique produit un chunking avec des chunks beaucoup trop grands ?',
                options: [
                  'Le retrieval devient flou (un chunk mélange dix sujets) et le prompt se remplit de contenu non pertinent',
                  'Les réponses sont plus courtes',
                  'La base de données refuse l\'indexation',
                  'Aucun, plus grand est toujours mieux',
                ],
                correct: 0,
                explanation: 'L\'embedding d\'un chunk fourre-tout ne ressemble à rien de précis : il matche mal les questions pointues. Et injecter des pavés dilue l\'attention du modèle sur le passage utile.',
              },
            ],
          },
        ],
      },
      {
        id: 'm12l2',
        title: 'Retrieval et assemblage du prompt',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# Assembler le pipeline complet

Tu as *toutes* les briques : le chunking (leçon 1), la similarité (module 5), TF-IDF (module 6), la construction de prompts (module 11). Il ne reste qu'à les visser ensemble.

## Le pipeline canonique

\`\`\`
INDEXATION (une fois) :
  documents -> chunks -> vecteurs -> index

REQUÊTE (à chaque question) :
  1. vectoriser la question
  2. scorer tous les chunks, garder le top-k
  3. assembler le prompt : contexte numéroté + question + consignes
  4. appeler le LLM
\`\`\`

En production, les vecteurs viennent d'un modèle d'embeddings et l'index d'une base vectorielle — mais avec ta similarité TF, le *flux* est identique à 100 %.

## L'assemblage du prompt : là où tout se joue

Un bon prompt RAG contient trois choses : les passages **numérotés** (pour permettre les citations), la **question**, et des **consignes de fidélité** :

\`\`\`
Réponds UNIQUEMENT à partir des passages ci-dessous.
Cite le numéro du passage utilisé, au format [1].
Si la réponse ne s'y trouve pas, dis-le explicitement.

[1] <chunk 1>
[2] <chunk 2>

Question : <question>
\`\`\`

La consigne « dis-le si la réponse n'y est pas » est ta première défense contre les hallucinations — et le taux de réponses correctement *refusées* est une métrique d'évaluation à part entière (module 13).`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm12l2e1',
              title: 'Le pipeline RAG complet',
              instructions: `Le starter fournit \`score_tf\` (similarité par mots communs pondérés). Implémente :

1. \`top_k(question, chunks, k)\` — renvoie les indices des \`k\` chunks aux meilleurs scores, **triés du meilleur au moins bon** (indice : \`sorted(range(len(scores)), key=..., reverse=True)\`),
2. \`construire_prompt(question, chunks, indices)\` — assemble le prompt exactement au format :

\`\`\`
Réponds uniquement à partir des passages suivants. Cite tes sources au format [n].

[1] <premier chunk retenu>
[2] <second chunk retenu>

Question : <question>
\`\`\`

(numérotation [1], [2]… dans l'ordre des indices fournis, une ligne vide avant "Question").`,
              starterCode: `def score_tf(question, chunk):
    q = set(question.lower().split())
    c = chunk.lower().split()
    return sum(1 for mot in c if mot in q)

CHUNKS = [
    "Le RAG combine recherche documentaire et génération par LLM.",
    "La tour Eiffel mesure 330 mètres depuis 2022.",
    "Le chunking découpe les documents en passages indexables.",
    "Les embeddings encodent le sens des textes en vecteurs.",
]

def top_k(question, chunks, k):
    ...

def construire_prompt(question, chunks, indices):
    ...

q = "Comment le RAG combine recherche et génération ?"
idx = top_k(q, CHUNKS, 2)
print(idx)
print(construire_prompt(q, CHUNKS, idx))`,
              solution: `def score_tf(question, chunk):
    q = set(question.lower().split())
    c = chunk.lower().split()
    return sum(1 for mot in c if mot in q)

CHUNKS = [
    "Le RAG combine recherche documentaire et génération par LLM.",
    "La tour Eiffel mesure 330 mètres depuis 2022.",
    "Le chunking découpe les documents en passages indexables.",
    "Les embeddings encodent le sens des textes en vecteurs.",
]

def top_k(question, chunks, k):
    scores = [score_tf(question, c) for c in chunks]
    ordre = sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)
    return ordre[:k]

def construire_prompt(question, chunks, indices):
    lignes = ["Réponds uniquement à partir des passages suivants. Cite tes sources au format [n].", ""]
    for n, i in enumerate(indices, start=1):
        lignes.append(f"[{n}] {chunks[i]}")
    lignes.append("")
    lignes.append(f"Question : {question}")
    return "\\n".join(lignes)

q = "Comment le RAG combine recherche et génération ?"
idx = top_k(q, CHUNKS, 2)
print(idx)
print(construire_prompt(q, CHUNKS, idx))`,
              tests: `_idx = top_k("Comment le RAG combine recherche et génération ?", CHUNKS, 2)
assert _idx[0] == 0, "Le chunk 0 (RAG/recherche/génération) doit arriver premier"
assert len(_idx) == 2, "top_k doit renvoyer k indices"
assert 1 not in _idx, "La tour Eiffel n'a rien à faire dans le top-2"
_p = construire_prompt("Quoi ?", CHUNKS, [2, 0])
_lignes = _p.split("\\n")
assert _lignes[0].startswith("Réponds uniquement"), "La consigne d'abord"
assert _lignes[1] == "", "Ligne vide après la consigne"
assert _lignes[2] == "[1] " + CHUNKS[2], "Le premier indice fourni devient [1]"
assert _lignes[3] == "[2] " + CHUNKS[0], "Le second devient [2]"
assert _lignes[4] == "" and _lignes[5] == "Question : Quoi ?", "Ligne vide puis la question"
print("TESTS_PASS")`,
              hints: [
                'top_k : calcule la liste des scores, puis sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)[:k].',
                'construire_prompt : construis une liste de lignes puis "\\n".join(lignes) — plus propre que la concaténation.',
                'enumerate(indices, start=1) donne la numérotation [1], [2]… quel que soit l\'indice réel du chunk.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi numéroter les passages dans le prompt RAG ?',
                options: [
                  'Pour faire joli',
                  'Pour que le modèle puisse CITER ses sources ([2]) — traçabilité et vérifiabilité des réponses',
                  'Le LLM ne lit pas les passages non numérotés',
                  'Pour réduire le nombre de tokens',
                ],
                correct: 1,
                explanation: 'Une réponse RAG sans citation est invérifiable. Les citations permettent l\'audit humain ET l\'évaluation automatique (le passage cité contient-il vraiment l\'affirmation ?).',
              },
              {
                question: 'Ton RAG répond mal. Le premier réflexe de debug ?',
                options: [
                  'Changer de LLM',
                  'Regarder ce que le retrieval a réellement renvoyé : si les bons passages n\'y sont pas, aucun modèle ne peut bien répondre',
                  'Augmenter la température',
                  'Raccourcir la question',
                ],
                correct: 1,
                explanation: '"Garbage in, garbage out" : dans la majorité des RAG défaillants, le problème est en amont (chunking, retrieval) — pas dans le modèle. Toujours inspecter le top-k avant d\'accuser la génération.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'm13',
    tier: 3,
    title: 'Agents, tool use et évaluation',
    tagline: 'La boucle agentique et l\'art de mesurer qu\'un système à base de LLM fonctionne vraiment.',
    status: 'ready',
    lessons: [
      {
        id: 'm13l1',
        title: 'La boucle agent',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# Du chatbot à l'agent

Un chatbot répond. Un **agent** *agit* : il décide d'appeler des outils (recherche, calcul, code, API), observe les résultats, et recommence jusqu'à pouvoir répondre. Claude Code, les Deep Research, les agents d'entreprise : tous reposent sur la même boucle, étonnamment simple.

## La boucle canonique

\`\`\`
messages = [question]
tant que True :
    decision = llm(messages)
    si decision est une réponse finale :
        retourne-la
    sinon (c'est un appel d'outil) :
        resultat = executer_outil(decision.outil, decision.args)
        messages += [decision, resultat]     # l'agent VOIT le résultat
\`\`\`

Le point crucial : **le LLM ne fait que décider**. C'est ton code qui exécute les outils, contrôle ce qui est permis, et renvoie les résultats dans l'historique. Le modèle produit du texte structuré ; ton programme fait le reste.

## Les garde-fous non négociables

Une boucle pilotée par un modèle probabiliste *peut* ne jamais s'arrêter, appeler un outil avec des arguments invalides, ou tourner en rond. Tout agent de production a :

- un **budget d'itérations** (max_tours) — jamais de \`while True\` nu,
- une **validation des arguments** avant exécution,
- une gestion d'erreur qui renvoie l'échec *au modèle* (souvent il se corrige au tour suivant !).`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm13l1e1',
              title: 'Implémenter la boucle agent',
              instructions: `Le starter fournit un \`MockLLM\` scripté (il « décide » d'utiliser la calculatrice, puis répond) et un dict \`OUTILS\`. Implémente :

\`executer_agent(llm, question, outils, max_tours=5)\` :

1. initialise \`messages = [{"role": "user", "content": question}]\`,
2. boucle au plus \`max_tours\` fois : appelle \`llm.decider(messages)\`,
3. si la décision a le type \`"reponse"\` → renvoie \`(decision["contenu"], messages)\`,
4. si type \`"outil"\` → exécute \`outils[decision["nom"]](decision["args"])\`, puis ajoute à \`messages\` la décision (role \`"assistant"\`) et le résultat (\`{"role": "outil", "content": resultat}\`),
5. si le budget s'épuise → renvoie \`("[budget épuisé]", messages)\`.`,
              starterCode: `def calculatrice(args):
    return str(eval(args["expression"], {"__builtins__": {}}, {}))

OUTILS = {"calculatrice": calculatrice}

class MockLLM:
    """Scénario scripté : demande un calcul, puis répond avec le résultat."""
    def decider(self, messages):
        derniers = [m for m in messages if m["role"] == "outil"]
        if not derniers:
            return {"type": "outil", "nom": "calculatrice",
                    "args": {"expression": "127 * 43"}}
        return {"type": "reponse",
                "contenu": f"Le résultat est {derniers[-1]['content']}."}

def executer_agent(llm, question, outils, max_tours=5):
    ...

reponse, historique = executer_agent(MockLLM(), "Combien font 127 x 43 ?", OUTILS)
print(reponse)
print(f"{len(historique)} messages dans l'historique")`,
              solution: `def calculatrice(args):
    return str(eval(args["expression"], {"__builtins__": {}}, {}))

OUTILS = {"calculatrice": calculatrice}

class MockLLM:
    def decider(self, messages):
        derniers = [m for m in messages if m["role"] == "outil"]
        if not derniers:
            return {"type": "outil", "nom": "calculatrice",
                    "args": {"expression": "127 * 43"}}
        return {"type": "reponse",
                "contenu": f"Le résultat est {derniers[-1]['content']}."}

def executer_agent(llm, question, outils, max_tours=5):
    messages = [{"role": "user", "content": question}]
    for _ in range(max_tours):
        decision = llm.decider(messages)
        if decision["type"] == "reponse":
            return decision["contenu"], messages
        resultat = outils[decision["nom"]](decision["args"])
        messages.append({"role": "assistant", "content": str(decision)})
        messages.append({"role": "outil", "content": resultat})
    return "[budget épuisé]", messages

reponse, historique = executer_agent(MockLLM(), "Combien font 127 x 43 ?", OUTILS)
print(reponse)
print(f"{len(historique)} messages dans l'historique")`,
              tests: `_r, _h = executer_agent(MockLLM(), "Combien font 127 x 43 ?", OUTILS)
assert _r == "Le résultat est 5461.", "L'agent doit répondre avec le résultat du calcul"
assert len(_h) == 3, "user + assistant (appel d'outil) + outil (résultat) = 3 messages"
assert _h[0]["role"] == "user" and _h[1]["role"] == "assistant" and _h[2]["role"] == "outil", "Ordre des rôles"
assert _h[2]["content"] == "5461", "Le résultat de l'outil doit être dans l'historique"

class _Bavard:
    def decider(self, messages):
        return {"type": "outil", "nom": "calculatrice", "args": {"expression": "1+1"}}
_r2, _h2 = executer_agent(_Bavard(), "?", OUTILS, max_tours=3)
assert _r2 == "[budget épuisé]", "Un agent qui boucle doit être arrêté par le budget"
assert len(_h2) == 7, "1 user + 3 tours x 2 messages = 7"
print("TESTS_PASS")`,
              hints: [
                'La boucle : for _ in range(max_tours), avec le return à l\'intérieur dès qu\'une décision de type "reponse" arrive.',
                'outils[decision["nom"]] récupère la fonction ; appelle-la avec decision["args"].',
                'Le return final ("[budget épuisé]", messages) est APRÈS la boucle — il ne s\'exécute que si elle s\'épuise.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Dans la boucle agent, qui exécute réellement les outils ?',
                options: [
                  'Le LLM, sur les serveurs du fournisseur',
                  'Ton code : le modèle ne produit qu\'une DEMANDE structurée, ton programme décide de l\'exécuter et lui renvoie le résultat',
                  'Le navigateur',
                  'Personne, les outils sont simulés',
                ],
                correct: 1,
                explanation: 'C\'est la frontière de sécurité fondamentale : le modèle propose, ton code dispose. Tu peux valider, filtrer, sandboxer, journaliser — tout passe par toi.',
              },
              {
                question: 'Pourquoi renvoyer les ERREURS d\'outils au modèle plutôt que de crasher ?',
                options: [
                  'Pour cacher les bugs',
                  'Le modèle peut souvent se corriger au tour suivant (reformuler des arguments, essayer un autre outil)',
                  'Les erreurs n\'arrivent jamais',
                  'Pour économiser des tokens',
                ],
                correct: 1,
                explanation: '"File not found" renvoyé à l\'agent → il corrige le chemin et réessaie. C\'est un des comportements qui rendent les agents robustes — à condition que la boucle le permette.',
              },
            ],
          },
        ],
      },
      {
        id: 'm13l2',
        title: 'Évaluer un système LLM',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# La compétence la plus demandée de 2026

Construire une démo LLM prend une journée. Savoir **prouver qu'elle marche** — et qu'elle marche *encore* après un changement de prompt ou de modèle — est ce qui distingue l'ingénieur du bricoleur. Les evals sont devenues le nerf de la guerre.

## Les trois étages de l'évaluation

**1. Métriques exactes** — quand la sortie est vérifiable mécaniquement :

\`\`\`
exact_match : la réponse normalisée est-elle exactement l'attendue ?
inclusion   : la réponse contient-elle l'information clé ?
\`\`\`

Rapides, objectives, parfaites pour l'extraction, la classification, le calcul.

**2. LLM-as-judge** — quand la qualité est subjective (ton, clarté, fidélité à une source) : on demande à un *autre* modèle de noter la réponse selon une grille précise. Puissant mais à manier avec soin : biais de position, préférence pour les réponses longues, auto-complaisance. Règle d'or : **calibrer le juge sur un échantillon annoté par des humains** avant de lui faire confiance.

**3. Métriques métier** — taux de résolution des tickets, satisfaction, coût par requête. La seule vérité finale.

## Le jeu de test (golden set)

Un fichier de cas \`{entrée, sortie attendue}\`, construit à la main, versionné avec le code. À chaque modification du prompt ou du modèle, on rejoue tout et on compare les scores : c'est le *test de régression* du monde LLM. 50 bons exemples battent 5000 exemples médiocres.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm13l2e1',
              title: 'Un harnais d\'évaluation complet',
              instructions: `Implémente :

1. \`normaliser(texte)\` — minuscules, sans ponctuation \`.,!?\`, espaces compactés (tu l'as déjà écrite au module 1 — recommence de mémoire !),
2. \`exact_match(prediction, attendu)\` — \`True\` si les versions normalisées sont égales,
3. \`evaluer(systeme, jeu_de_test)\` — applique \`systeme(entree)\` à chaque cas, calcule le taux d'exact match, et renvoie le dict \`{"score": taux, "echecs": [liste des entrées ratées]}\`.

Le starter fournit un faux système à évaluer.`,
              starterCode: `import re

def systeme_a_evaluer(entree):
    """Un 'modèle' imparfait à évaluer."""
    reponses = {
        "capitale de la France": "Paris.",
        "2 + 2": "4",
        "auteur de 1984": "George Orwell",
        "capitale du Japon": "Kyoto",     # erreur volontaire !
    }
    return reponses.get(entree, "je ne sais pas")

JEU_DE_TEST = [
    {"entree": "capitale de la France", "attendu": "paris"},
    {"entree": "2 + 2", "attendu": "4"},
    {"entree": "auteur de 1984", "attendu": "george orwell"},
    {"entree": "capitale du Japon", "attendu": "tokyo"},
]

def normaliser(texte):
    ...

def exact_match(prediction, attendu):
    ...

def evaluer(systeme, jeu_de_test):
    ...

print(evaluer(systeme_a_evaluer, JEU_DE_TEST))`,
              solution: `import re

def systeme_a_evaluer(entree):
    reponses = {
        "capitale de la France": "Paris.",
        "2 + 2": "4",
        "auteur de 1984": "George Orwell",
        "capitale du Japon": "Kyoto",
    }
    return reponses.get(entree, "je ne sais pas")

JEU_DE_TEST = [
    {"entree": "capitale de la France", "attendu": "paris"},
    {"entree": "2 + 2", "attendu": "4"},
    {"entree": "auteur de 1984", "attendu": "george orwell"},
    {"entree": "capitale du Japon", "attendu": "tokyo"},
]

def normaliser(texte):
    texte = texte.lower()
    texte = re.sub(r"[.,!?]", "", texte)
    texte = re.sub(r"\\s+", " ", texte).strip()
    return texte

def exact_match(prediction, attendu):
    return normaliser(prediction) == normaliser(attendu)

def evaluer(systeme, jeu_de_test):
    echecs = []
    reussites = 0
    for cas in jeu_de_test:
        prediction = systeme(cas["entree"])
        if exact_match(prediction, cas["attendu"]):
            reussites += 1
        else:
            echecs.append(cas["entree"])
    return {"score": reussites / len(jeu_de_test), "echecs": echecs}

print(evaluer(systeme_a_evaluer, JEU_DE_TEST))`,
              tests: `assert normaliser("  Paris. ") == "paris", "Minuscules, sans ponctuation, sans espaces superflus"
assert exact_match("Paris.", "paris"), "'Paris.' et 'paris' doivent matcher après normalisation"
assert not exact_match("Lyon", "paris"), "Des réponses différentes ne matchent pas"
_r = evaluer(systeme_a_evaluer, JEU_DE_TEST)
assert _r["score"] == 0.75, "3 réussites sur 4 : score 0.75"
assert _r["echecs"] == ["capitale du Japon"], "Le seul échec : la capitale du Japon (Kyoto != Tokyo)"
_parfait = lambda e: {"a": "1", "b": "2"}[e]
assert evaluer(_parfait, [{"entree": "a", "attendu": "1"}])["score"] == 1.0, "Système parfait : score 1.0"
print("TESTS_PASS")`,
              hints: [
                'normaliser : lower(), puis re.sub(r"[.,!?]", "", …), puis compactage des espaces (module 3 !).',
                'evaluer : boucle sur les cas, compteur de réussites, liste des entrées en échec, division finale.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi normaliser avant de comparer prédiction et réponse attendue ?',
                options: [
                  'Pour tricher sur les scores',
                  '"Paris." et "paris" sont la même réponse : sans normalisation, on compterait des faux échecs de pure forme',
                  'La normalisation est obligatoire en Python',
                  'Pour accélérer la comparaison',
                ],
                correct: 1,
                explanation: 'Un harnais d\'éval trop strict sur la forme noie les vrais problèmes sous les faux positifs. La normalisation (et ses limites !) est une décision d\'évaluation à part entière.',
              },
              {
                question: 'Quel est le principal danger du LLM-as-judge utilisé sans précaution ?',
                options: [
                  'Il est trop lent',
                  'Ses biais (longueur, position, style) peuvent produire des scores systématiquement faussés — d\'où la calibration sur des annotations humaines',
                  'Il refuse de noter',
                  'Il coûte toujours trop cher',
                ],
                correct: 1,
                explanation: 'Un juge non calibré peut préférer les réponses verbeuses, ou noter différemment selon l\'ordre de présentation. On mesure d\'abord son accord avec des humains sur un échantillon, PUIS on l\'automatise.',
              },
              {
                question: 'Ton nouveau prompt fait passer le score d\'éval de 82 % à 79 %. Que fais-tu ?',
                options: [
                  'Je déploie quand même, 3 points ce n\'est rien',
                  'J\'inspecte les cas passés en échec : régression réelle, cas limites nouveaux, ou bruit d\'échantillonnage — le jeu de test sert exactement à ça',
                  'Je supprime les cas qui échouent du jeu de test',
                  'Je change de métrique',
                ],
                correct: 1,
                explanation: 'Le réflexe de l\'ingénieur : lire les échecs un par un avant toute décision. (Et jamais, jamais retirer les cas gênants — c\'est l\'équivalent LLM de supprimer les tests qui échouent.)',
              },
            ],
          },
        ],
      },
    ],
  },
]
