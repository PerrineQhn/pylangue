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

Le papier de 2017 qui a donné naissance aux transformers — donc à GPT, Claude, Llama, Gemini — repose sur une idée qu'on peut implémenter en NumPy avec ce que tu sais déjà : des produits scalaires et une normalisation. Cette leçon pose la première pierre : le **softmax**, l'opération qui transforme des scores bruts en poids d'attention.

## L'intuition

Pour comprendre le mot « le » dans « le chat noir dort », un modèle doit savoir *quels autres mots regarder*. L'attention calcule, pour chaque token, une **moyenne pondérée** des autres tokens — où les poids reflètent la pertinence, mesurée par un produit scalaire (leçon du module 5 !). Mais un produit scalaire donne des scores quelconques : le softmax les convertit en poids propres à une moyenne.

## Étape 1 : softmax, des scores aux poids

Les produits scalaires donnent des scores comme \`[2.1, -0.3, 0.8]\`. Pour en faire des poids (positifs, de somme 1), on applique le softmax :

\`\`\`
softmax(x)ᵢ = exp(xᵢ) / Σⱼ exp(xⱼ)
\`\`\`

Chaque score passe par l'exponentielle (qui le rend positif), puis on divise par la somme (qui ramène le total à 1). Les scores élevés reçoivent la part du lion, les faibles presque rien.

## Le piège numérique (question d'entretien classique !)

\`exp(1000)\` déborde en \`inf\`. La solution, utilisée dans *toutes* les implémentations réelles : soustraire le maximum avant l'exponentielle. Mathématiquement identique (le facteur se simplifie dans la fraction), numériquement stable :

\`\`\`
def softmax(x):
    e = np.exp(x - x.max())
    return e / e.sum()
\`\`\`

## Le lien avec la température

Ce même softmax convertit les *logits* d'un LLM en probabilités sur le prochain token. C'est là qu'agit le paramètre \`temperature\` : on divise les scores par \`T\` avant le softmax. \`T\` petit → distribution piquée (déterministe) ; \`T\` grand → distribution plate (créatif). Tu implémenteras exactement ce mécanisme.

## Pièges classiques

- **Oublier de soustraire le max.** Sans cette stabilisation, de grands logits produisent \`inf\` puis \`NaN\`, et tout l'entraînement se corrompt en silence.
- **Diviser par la température au mauvais moment.** La température divise les logits *avant* le softmax, pas les probabilités après. L'ordre change tout.
- **Croire que softmax « choisit » un token.** Il produit une *distribution* ; c'est l'échantillonnage (module 10) qui choisit ensuite — greedy, température, top-p.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm9l1e2',
              title: "Softmax en batch",
              instructions: `Les modèles ne traitent jamais un vecteur à la fois : écris \`softmax_batch(M, temperature=1.0)\` qui applique le softmax à **chaque ligne** d'une matrice (chaque ligne est un vecteur de logits indépendant).

Les outils du broadcasting : \`M.max(axis=1, keepdims=True)\` et \`.sum(axis=1, keepdims=True)\` — le \`keepdims\` garde la shape \`(n, 1)\` pour que la division se diffuse ligne par ligne.`,
              starterCode: `import numpy as np

def softmax_batch(M, temperature=1.0):
    ...

M = np.array([[2.0, 1.0, 0.1], [0.0, 0.0, 5.0]])
print(softmax_batch(M).round(3))`,
              solution: `import numpy as np

def softmax_batch(M, temperature=1.0):
    Z = M / temperature
    e = np.exp(Z - Z.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

M = np.array([[2.0, 1.0, 0.1], [0.0, 0.0, 5.0]])
print(softmax_batch(M).round(3))`,
              tests: `import numpy as np
_P = softmax_batch(np.array([[2.0, 1.0, 0.1], [0.0, 0.0, 5.0]]))
assert _P.shape == (2, 3), "Shape préservée"
assert np.allclose(_P.sum(axis=1), [1.0, 1.0]), "Chaque LIGNE somme à 1"
assert _P[1, 2] > 0.98, "Le logit 5.0 domine sa ligne"
_S = softmax_batch(np.array([[1000.0, 999.0], [3.0, 3.0]]))
assert not np.isnan(_S).any(), "Stable même avec de grands logits (max par ligne soustrait)"
assert np.allclose(_S[1], [0.5, 0.5]), "Logits égaux : uniforme"
_F = softmax_batch(np.array([[2.0, 1.0, 0.1]]), temperature=0.05)
assert _F[0, 0] > 0.99, "Basse température : quasi one-hot, ligne par ligne"
print("TESTS_PASS")`,
              hints: [
                'Exactement ton softmax de l\'exercice 1, avec axis=1, keepdims=True partout.',
                'La division par la température se fait sur toute la matrice d\'un coup.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm9l1e3',
              title: "Défi — Calibrer la température",
              instructions: `Mission de réglage réelle : on veut que le modèle soit « confiant mais pas rigide » — que la probabilité du meilleur token soit proche d'une cible (ex : 0.8). Écris \`calibrer(logits, cible, temperatures)\` qui :

1. pour chaque température candidate, calcule \`softmax(logits / T)\` et regarde la probabilité max,
2. renvoie la température dont la proba max est **la plus proche** de la cible (au sens de l'écart absolu ; la première en cas d'égalité).

C'est une recherche par balayage (*grid search*) — la méthode de réglage la plus utilisée en pratique, ici appliquée au paramètre que tu connais le mieux.`,
              starterCode: `import numpy as np

def softmax_t(logits, temperature):
    z = logits / temperature
    e = np.exp(z - z.max())
    return e / e.sum()

def calibrer(logits, cible, temperatures):
    ...

logits = np.array([3.0, 2.0, 1.0, 0.0])
print(calibrer(logits, cible=0.8, temperatures=[0.3, 0.5, 1.0, 2.0, 5.0]))`,
              solution: `import numpy as np

def softmax_t(logits, temperature):
    z = logits / temperature
    e = np.exp(z - z.max())
    return e / e.sum()

def calibrer(logits, cible, temperatures):
    meilleure, ecart_min = None, float("inf")
    for T in temperatures:
        p_max = float(softmax_t(logits, T).max())
        ecart = abs(p_max - cible)
        if ecart < ecart_min:
            meilleure, ecart_min = T, ecart
    return meilleure

logits = np.array([3.0, 2.0, 1.0, 0.0])
print(calibrer(logits, cible=0.8, temperatures=[0.3, 0.5, 1.0, 2.0, 5.0]))`,
              tests: `import numpy as np
_logits = np.array([3.0, 2.0, 1.0, 0.0])
_r = calibrer(_logits, 0.99, [0.1, 1.0, 5.0])
assert _r == 0.1, "Cible quasi déterministe : la température la plus basse"
_r2 = calibrer(_logits, 0.25, [0.1, 1.0, 100.0])
assert _r2 == 100.0, "Cible uniforme (1/4) : la température la plus haute"
_r3 = calibrer(_logits, 0.8, [0.3, 0.5, 1.0, 2.0, 5.0])
_p = {T: float(softmax_t(_logits, T).max()) for T in [0.3, 0.5, 1.0, 2.0, 5.0]}
_attendue = min(_p, key=lambda T: abs(_p[T] - 0.8))
assert _r3 == _attendue, "La température dont la proba max approche le mieux 0.8"
print("TESTS_PASS")`,
              hints: [
                'Balayage : garde la meilleure candidate et son écart minimal au fil de la boucle.',
                'La proba max d\'un softmax : .max() tout simplement.',
                'La comparaison stricte < garde la PREMIÈRE en cas d\'égalité.',
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

La self-attention se décrit avec une métaphore de moteur de recherche interne à la phrase. Chaque token joue simultanément trois rôles :

- **Query (Q)** : ce que le token *cherche* (« je suis "le", je cherche mon nom »),
- **Key (K)** : ce que le token *offre* comme identité (« je suis un nom commun »),
- **Value (V)** : l'information que le token *transmet* si on décide de le regarder.

Chaque token est projeté en ces trois vecteurs par des matrices apprises \`W_q, W_k, W_v\` (ici, on les suppose déjà appliquées, pour se concentrer sur le mécanisme).

## La formule complète

\`\`\`
Attention(Q, K, V) = softmax(Q @ K.T / √d) @ V
\`\`\`

Décomposons-la pour \`n\` tokens de dimension \`d\`, étape par étape :

1. \`Q @ K.T\` → une matrice \`(n, n)\` : le score de chaque token envers chaque autre. **Un produit scalaire par paire de tokens** — et tu sais que produit scalaire = similarité.
2. \`/ √d\` : sans cette division, les scores grandissent avec la dimension et saturent le softmax (les gradients deviennent minuscules). C'est le « scaled » de *scaled dot-product attention*.
3. \`softmax\` **ligne par ligne** : chaque token convertit ses scores en poids qui somment à 1 (la leçon précédente).
4. \`@ V\` : chaque token repart avec une moyenne pondérée des valeurs des autres.

Trente lignes de NumPy, et tu tiens le cœur d'un LLM. Le reste d'un transformer (module 10) n'est qu'un habillage : plusieurs « têtes » en parallèle, des couches empilées, des MLP, des normalisations.

## Le coût quadratique

\`Q @ K.T\` est une matrice \`(n, n)\` : pour \`n\` tokens, c'est \`n²\` scores. C'est le fameux **coût quadratique** de l'attention, celui qui rend les longs contextes chers et motive le KV-cache, la flash attention et les variantes efficientes.

## Pièges classiques

- **Transposer la mauvaise matrice.** C'est \`K.T\` qu'il faut, pour obtenir \`(n, d) @ (d, n) → (n, n)\`. Une erreur de transposition donne une shape fausse — imprime-la pour vérifier.
- **Softmax sur le mauvais axe.** Le softmax s'applique *par ligne* (\`axis=1\`) : chaque token normalise SON attention. Sur les colonnes, le sens est perdu.
- **Oublier le \`√d\`.** Sans lui, en grande dimension le softmax devient quasi one-hot et les gradients s'évanouissent — le modèle n'apprend plus.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm9l2e2',
              title: "La carte d'attention",
              instructions: `Les fameuses « cartes d'attention » des papiers et des outils d'interprétabilité, ce sont exactement les poids AVANT la multiplication par V. Écris \`carte_attention(Q, K)\` qui renvoie la matrice \`(n, n)\` : \`softmax_lignes(Q @ K.T / sqrt(d))\`.

Puis \`token_le_plus_regarde(P)\` : l'indice du token qui reçoit le plus d'attention **en moyenne** (moyenne des colonnes, argmax).`,
              starterCode: `import numpy as np

def softmax_lignes(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def carte_attention(Q, K):
    ...

def token_le_plus_regarde(P):
    ...

Q = np.array([[1.0, 0.0], [0.9, 0.1], [0.0, 1.0]])
K = np.array([[1.0, 0.0], [1.0, 0.1], [0.0, 1.0]])
P = carte_attention(Q, K)
print(P.round(2))
print("le plus regardé :", token_le_plus_regarde(P))`,
              solution: `import numpy as np

def softmax_lignes(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def carte_attention(Q, K):
    d = Q.shape[1]
    return softmax_lignes(Q @ K.T / np.sqrt(d))

def token_le_plus_regarde(P):
    return int(P.mean(axis=0).argmax())

Q = np.array([[1.0, 0.0], [0.9, 0.1], [0.0, 1.0]])
K = np.array([[1.0, 0.0], [1.0, 0.1], [0.0, 1.0]])
P = carte_attention(Q, K)
print(P.round(2))
print("le plus regardé :", token_le_plus_regarde(P))`,
              tests: `import numpy as np
_Q = np.array([[1.0, 0.0], [0.9, 0.1], [0.0, 1.0]])
_K = np.array([[1.0, 0.0], [1.0, 0.1], [0.0, 1.0]])
_P = carte_attention(_Q, _K)
assert _P.shape == (3, 3), "Une carte (n, n)"
assert np.allclose(_P.sum(axis=1), 1.0), "Chaque ligne (chaque token qui regarde) somme à 1"
assert (_P >= 0).all(), "Des poids positifs"
assert _P[0, 2] < _P[0, 0], "Le token 0 regarde plus les tokens qui lui ressemblent"
assert token_le_plus_regarde(np.array([[0.1, 0.9], [0.2, 0.8]])) == 1, "La colonne 1 domine en moyenne"
print("TESTS_PASS")`,
              hints: [
                'C\'est la moitié de ton attention() — on s\'arrête avant le @ V.',
                'P.mean(axis=0) moyenne les colonnes : "à quel point chaque token est regardé".',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm9l2e3',
              title: "Défi — Attention avec masque de padding",
              instructions: `Retrouvailles avec ton exercice de padding (module 5) : dans un batch, les positions de remplissage ne doivent recevoir **aucune** attention. Écris \`attention_masquee(Q, K, V, masque)\` où \`masque\` est le vecteur 0/1 des positions réelles :

1. calcule les scores habituels,
2. mets à \`-np.inf\` les **colonnes** j où \`masque[j] == 0\` (\`np.where\` sur \`masque[None, :] == 0\`),
3. softmax par ligne, puis \`@ V\`.

C'est exactement le rôle de l'attention_mask que tu passeras aux modèles Hugging Face.`,
              starterCode: `import numpy as np

def softmax_lignes(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def attention_masquee(Q, K, V, masque):
    ...

rng = np.random.RandomState(0)
Q = rng.randn(4, 3); K = rng.randn(4, 3); V = rng.randn(4, 3)
masque = np.array([1, 1, 1, 0])   # le 4e token est du padding
print(attention_masquee(Q, K, V, masque).round(2))`,
              solution: `import numpy as np

def softmax_lignes(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def attention_masquee(Q, K, V, masque):
    d = Q.shape[1]
    scores = Q @ K.T / np.sqrt(d)
    scores = np.where(masque[None, :] == 0, -np.inf, scores)
    return softmax_lignes(scores) @ V

rng = np.random.RandomState(0)
Q = rng.randn(4, 3); K = rng.randn(4, 3); V = rng.randn(4, 3)
masque = np.array([1, 1, 1, 0])
print(attention_masquee(Q, K, V, masque).round(2))`,
              tests: `import numpy as np
_rng = np.random.RandomState(0)
_Q = _rng.randn(4, 3); _K = _rng.randn(4, 3); _V = _rng.randn(4, 3)
_masque = np.array([1, 1, 1, 0])
_out = attention_masquee(_Q, _K, _V, _masque)
assert _out.shape == (4, 3), "Shape préservée"
# Changer la valeur du token paddé ne doit RIEN changer
_V2 = _V.copy(); _V2[3] = 999.0
_K2 = _K.copy(); _K2[3] = 999.0
assert np.allclose(_out, attention_masquee(_Q, _K2, _V2, _masque)), "Le token paddé est invisible : le modifier ne change rien"
_plein = np.array([1, 1, 1, 1])
_d = _Q.shape[1]
_ref = softmax_lignes(_Q @ _K.T / np.sqrt(_d)) @ _V
assert np.allclose(attention_masquee(_Q, _K, _V, _plein), _ref), "Masque plein : attention normale"
print("TESTS_PASS")`,
              hints: [
                'masque[None, :] transforme (n,) en (1, n) : le broadcasting masque les COLONNES.',
                'Même mécanique que le masque causal : -inf avant le softmax, et la renormalisation est automatique.',
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

Ton attention laisse chaque token regarder *tous* les autres — y compris ceux qui viennent après. Pour un modèle qui **prédit le token suivant**, c'est de la triche : à l'entraînement, le token 3 verrait la réponse (le token 4) juste à côté de lui. Les modèles de type GPT sont dits **causaux** : chaque position ne peut regarder que le passé et le présent, jamais le futur.

## L'implémentation : un masque à -inf

L'astuce est d'une élégance rare. Avant le softmax, on remplace les scores des positions futures par \`-inf\` :

\`\`\`
scores[i, j] = -inf   pour tout j > i     (le futur, interdit)
\`\`\`

Or \`exp(-inf) = 0\` : après le softmax, les poids du futur sont **exactement zéro**, et les poids restants se renormalisent automatiquement entre eux. Aucune règle spéciale à écrire — la formule fait tout le travail.

\`\`\`
masque = np.triu(np.ones((n, n)), k=1)   # triangle supérieur strict = le futur
scores = np.where(masque == 1, -np.inf, scores)
\`\`\`

## Pourquoi c'est fondamental

C'est ce masque qui permet l'entraînement **massivement parallèle** des GPT. Une phrase de \`n\` tokens fournit \`n\` exercices de prédiction *simultanés* (chaque position prédit la suivante), calculés en un seul passage matriciel. Sans le masque, il faudrait un passage par position — c'est précisément l'avantage décisif des transformers sur les anciens RNN, qui avançaient token par token.

Le même masque explique le **KV-cache** à l'inférence : le passé ne changeant jamais, on le calcule une seule fois et on le réutilise pour chaque nouveau token.

## Pièges classiques

- **\`-inf\` avant le softmax, pas 0 après.** Mettre les poids à 0 *après* le softmax casserait la normalisation (la somme ne ferait plus 1). Le \`-inf\` *avant* laisse le softmax renormaliser proprement le passé.
- **Se tromper de triangle.** \`np.triu(..., k=1)\` désigne le triangle *strictement* supérieur — le futur. Avec \`k=0\`, on masquerait aussi la diagonale (le token lui-même), ce qui est faux.
- **Croire que la causalité concerne l'inférence seule.** Elle est surtout cruciale à l'entraînement : c'est elle qui garantit que le modèle apprend à *prédire* sans jamais copier la réponse.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm9l3e2',
              title: "Construire et vérifier le masque",
              instructions: `Deux utilitaires d'audit :

1. \`masque_causal(n)\` — la matrice booléenne \`(n, n)\` avec \`True\` sur les positions futures (\`np.triu(np.ones((n, n), dtype=bool), k=1)\`),
2. \`est_causale(P, tolerance=1e-9)\` — vérifie qu'une matrice de poids d'attention respecte la causalité : tous les poids aux positions futures sont ≤ tolérance. C'est un test unitaire qu'on écrit réellement quand on implémente un transformer.`,
              starterCode: `import numpy as np

def masque_causal(n):
    ...

def est_causale(P, tolerance=1e-9):
    ...

print(masque_causal(3))
P_ok = np.array([[1.0, 0.0], [0.5, 0.5]])
P_ko = np.array([[0.9, 0.1], [0.5, 0.5]])
print(est_causale(P_ok), est_causale(P_ko))`,
              solution: `import numpy as np

def masque_causal(n):
    return np.triu(np.ones((n, n), dtype=bool), k=1)

def est_causale(P, tolerance=1e-9):
    futur = masque_causal(P.shape[0])
    return bool((P[futur] <= tolerance).all())

print(masque_causal(3))
P_ok = np.array([[1.0, 0.0], [0.5, 0.5]])
P_ko = np.array([[0.9, 0.1], [0.5, 0.5]])
print(est_causale(P_ok), est_causale(P_ko))`,
              tests: `import numpy as np
_m = masque_causal(3)
assert _m.dtype == bool and _m.shape == (3, 3), "Matrice booléenne (n, n)"
assert _m.sum() == 3, "3 positions futures pour n=3 (au-dessus de la diagonale)"
assert not _m[1, 0] and _m[0, 1], "Le passé est False, le futur est True"
assert est_causale(np.array([[1.0, 0.0], [0.5, 0.5]])), "Triangulaire inférieure : causale"
assert not est_causale(np.array([[0.9, 0.1], [0.5, 0.5]])), "Un poids vers le futur : violation détectée"
assert est_causale(np.eye(4)), "L'identité est causale"
print("TESTS_PASS")`,
              hints: [
                'np.triu(..., k=1) : triangle STRICTEMENT supérieur.',
                'P[masque_booleen] extrait les positions futures ; .all() vérifie qu\'elles sont toutes ~nulles.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm9l3e3',
              title: "Défi — Simuler le KV-cache",
              instructions: `LE mécanisme qui rend la génération rapide : à chaque nouveau token, on ne recalcule pas l'attention de toute la séquence — on **ajoute** les K et V du nouveau token au cache et on ne calcule que SA ligne d'attention. Écris \`etape_generation(K_cache, V_cache, q, k, v)\` :

1. ajoute \`k\` et \`v\` au cache (\`np.vstack([cache, vecteur])\`),
2. calcule l'attention du seul nouveau token : \`softmax(q @ K_cache.T / sqrt(d)) @ V_cache\` (q est un vecteur, le softmax est un softmax simple),
3. renvoie \`(sortie, K_cache, V_cache)\`.

Les tests vérifient LA propriété magique : la sortie est identique à la dernière ligne d'une attention causale complète recalculée de zéro — pour une fraction du coût.`,
              starterCode: `import numpy as np

def softmax(x):
    e = np.exp(x - x.max())
    return e / e.sum()

def etape_generation(K_cache, V_cache, q, k, v):
    ...

K = np.zeros((0, 2)); V = np.zeros((0, 2))   # caches vides
rng = np.random.RandomState(0)
for t in range(3):
    q = rng.randn(2); k = rng.randn(2); v = rng.randn(2)
    sortie, K, V = etape_generation(K, V, q, k, v)
    print(f"token {t} : cache = {K.shape[0]} entrées, sortie = {sortie.round(2)}")`,
              solution: `import numpy as np

def softmax(x):
    e = np.exp(x - x.max())
    return e / e.sum()

def etape_generation(K_cache, V_cache, q, k, v):
    K_cache = np.vstack([K_cache, k])
    V_cache = np.vstack([V_cache, v])
    d = q.shape[0]
    poids = softmax(q @ K_cache.T / np.sqrt(d))
    return poids @ V_cache, K_cache, V_cache

K = np.zeros((0, 2)); V = np.zeros((0, 2))
rng = np.random.RandomState(0)
for t in range(3):
    q = rng.randn(2); k = rng.randn(2); v = rng.randn(2)
    sortie, K, V = etape_generation(K, V, q, k, v)
    print(f"token {t} : cache = {K.shape[0]} entrées, sortie = {sortie.round(2)}")`,
              tests: `import numpy as np
_rng = np.random.RandomState(7)
_Qs = _rng.randn(4, 2); _Ks = _rng.randn(4, 2); _Vs = _rng.randn(4, 2)
_K = np.zeros((0, 2)); _V = np.zeros((0, 2))
_sorties = []
for _t in range(4):
    _s, _K, _V = etape_generation(_K, _V, _Qs[_t], _Ks[_t], _Vs[_t])
    _sorties.append(_s)
assert _K.shape == (4, 2), "Le cache grandit d'une entrée par token"
# Référence : attention causale complète recalculée
def _softmax_l(S):
    e = np.exp(S - S.max(axis=1, keepdims=True)); return e / e.sum(axis=1, keepdims=True)
_S = _Qs @ _Ks.T / np.sqrt(2)
_S = np.where(np.triu(np.ones((4, 4)), 1) == 1, -np.inf, _S)
_ref = _softmax_l(_S) @ _Vs
for _t in range(4):
    assert np.allclose(_sorties[_t], _ref[_t]), f"La sortie du token {_t} via cache doit égaler l'attention causale complète"
print("TESTS_PASS")`,
              hints: [
                'np.vstack ajoute une ligne à une matrice (même à une matrice vide (0, d)).',
                'q @ K_cache.T donne un vecteur de scores (un par entrée du cache) : softmax simple, pas par lignes.',
                'La causalité est gratuite : le cache ne contient QUE le passé.',
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
