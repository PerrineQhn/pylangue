import type { Module } from '@/lib/types'

export const m10: Module = {
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
      {
        id: 'm10l3',
        title: 'Générer du texte : greedy, température, top-k',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# Du modèle au texte : l'échantillonnage

Un transformer produit, pour chaque position, un vecteur de **logits** — un score par token du vocabulaire. Générer du texte, c'est choisir un token à partir de ces scores, l'ajouter à la séquence, et recommencer. La *manière* de choisir s'appelle la **stratégie d'échantillonnage**, et c'est elle que règlent les paramètres d'API que tu connais.

## Les trois stratégies fondamentales

**Greedy** — toujours le token le plus probable (\`argmax\`). Déterministe, mais répétitif : les boucles infinies « the the the » viennent de là.

**Échantillonnage avec température** — softmax(logits / T), puis tirage selon les probabilités. T faible → concentré sur les tokens sûrs ; T élevé → créatif mais risqué. Tu as implémenté ce softmax au module 9 !

**Top-k** — ne garder que les k tokens les plus probables, renormaliser, tirer parmi eux. Coupe la « longue traîne » de tokens absurdes qu'une température élevée pourrait atteindre. (Sa variante top-p, ou *nucleus sampling*, garde les tokens couvrant p % de probabilité cumulée — même esprit.)

## Le tirage pondéré en NumPy

\`\`\`
rng = np.random.RandomState(graine)
choix = rng.choice(len(probas), p=probas)   # tire un indice selon probas
\`\`\`

> Ces stratégies expliquent des comportements que tu observes tous les jours : pourquoi température 0 donne des réponses reproductibles, pourquoi une température très haute part en vrille, et pourquoi les API combinent temperature ET top_p.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm10l3e1',
              title: 'Implémenter les trois stratégies',
              instructions: `Implémente :

1. \`greedy(logits)\` — l'indice du logit maximal (\`int(np.argmax(...))\`),
2. \`echantillonner(logits, temperature, rng)\` — softmax avec température (fourni), puis \`rng.choice\` pondéré,
3. \`top_k(logits, k, temperature, rng)\` — repère les \`k\` meilleurs indices (\`np.argsort\`), met les logits des AUTRES à \`-np.inf\` (copie d'abord !), puis réutilise \`echantillonner\`.`,
              starterCode: `import numpy as np

def softmax_t(logits, temperature=1.0):
    z = logits / temperature
    e = np.exp(z - z.max())
    return e / e.sum()

def greedy(logits):
    ...

def echantillonner(logits, temperature, rng):
    ...

def top_k(logits, k, temperature, rng):
    ...

logits = np.array([3.0, 2.5, 1.0, -1.0, -3.0])
rng = np.random.RandomState(0)
print("greedy :", greedy(logits))
print("T=1.0  :", [echantillonner(logits, 1.0, rng) for _ in range(8)])
print("top-2  :", [top_k(logits, 2, 1.0, rng) for _ in range(8)])`,
              solution: `import numpy as np

def softmax_t(logits, temperature=1.0):
    z = logits / temperature
    e = np.exp(z - z.max())
    return e / e.sum()

def greedy(logits):
    return int(np.argmax(logits))

def echantillonner(logits, temperature, rng):
    probas = softmax_t(logits, temperature)
    return int(rng.choice(len(logits), p=probas))

def top_k(logits, k, temperature, rng):
    garder = np.argsort(logits)[::-1][:k]
    filtres = np.full_like(logits, -np.inf)
    filtres[garder] = logits[garder]
    return echantillonner(filtres, temperature, rng)

logits = np.array([3.0, 2.5, 1.0, -1.0, -3.0])
rng = np.random.RandomState(0)
print("greedy :", greedy(logits))
print("T=1.0  :", [echantillonner(logits, 1.0, rng) for _ in range(8)])
print("top-2  :", [top_k(logits, 2, 1.0, rng) for _ in range(8)])`,
              tests: `import numpy as np
_logits = np.array([3.0, 2.5, 1.0, -1.0, -3.0])
assert greedy(_logits) == 0, "L'indice du logit max"
_rng = np.random.RandomState(42)
_tirages_froids = [echantillonner(_logits, 0.05, _rng) for _ in range(20)]
assert all(t == 0 for t in _tirages_froids), "Température quasi nulle : quasi toujours le meilleur token"
_rng2 = np.random.RandomState(42)
_tirages = [echantillonner(_logits, 1.5, _rng2) for _ in range(50)]
assert len(set(_tirages)) >= 3, "Température élevée : de la diversité"
_rng3 = np.random.RandomState(7)
_tk = [top_k(_logits, 2, 2.0, _rng3) for _ in range(40)]
assert set(_tk) <= {0, 1}, "top-2 : SEULS les 2 meilleurs tokens peuvent sortir, même à haute température"
assert len(set(_tk)) == 2, "top-2 à haute température : les deux doivent apparaître"
_rng4 = np.random.RandomState(0)
assert top_k(_logits, 1, 1.0, _rng4) == 0, "top-1 == greedy"
assert np.allclose(_logits, np.array([3.0, 2.5, 1.0, -1.0, -3.0])), "top_k ne doit PAS modifier les logits d'origine (copie !)"
print("TESTS_PASS")`,
              hints: [
                'echantillonner : probas = softmax_t(...), puis int(rng.choice(len(logits), p=probas)).',
                'top_k : np.argsort(logits)[::-1][:k] donne les k meilleurs indices ; np.full_like(logits, -np.inf) crée le tableau filtré.',
                'Si le test de non-modification échoue : tu écris dans logits au lieu d\'un nouveau tableau.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi le décodage greedy produit-il souvent des répétitions en boucle ?',
                options: [
                  'Un bug des implémentations',
                  'Toujours prendre le token le plus probable peut créer un cycle stable : une phrase répétée redevient le contexte le plus probable pour elle-même',
                  'Les logits sont aléatoires',
                  'Le vocabulaire est trop petit',
                ],
                correct: 1,
                explanation: 'Le mode le plus probable localement n\'est pas la séquence la plus intéressante globalement. Un peu d\'aléa (température, top-k/top-p) casse ces cycles — c\'est pour ça que presque aucune API ne décode en pur greedy par défaut.',
              },
              {
                question: 'Que garantit top-k que la température seule ne garantit pas ?',
                options: [
                  'Des réponses plus longues',
                  'Les tokens de la longue traîne (absurdes mais de probabilité non nulle) ne peuvent JAMAIS être tirés, quelle que soit la température',
                  'Un texte déterministe',
                  'Une meilleure grammaire',
                ],
                correct: 1,
                explanation: 'Avec T élevée, même un token à 0.01 % finit par sortir sur des milliers de tirages — une hallucination flagrante suffit à ruiner une réponse. Top-k/top-p posent un plancher de qualité en tronquant la distribution.',
              },
            ],
          },
        ],
      },
    ],
  }
