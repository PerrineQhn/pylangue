import type { Module } from '@/lib/types'

export const m7: Module = {
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

Un « neurone » artificiel n'a rien de mystérieux : c'est un **produit scalaire suivi d'une fonction non linéaire**. Tu as déjà tous les ingrédients de la leçon sur NumPy. Et le vertige de cette leçon, c'est qu'un LLM à 100 milliards de paramètres n'est *rien d'autre* que ce motif, répété à l'échelle industrielle.

## La prédiction

Pour un vecteur d'entrée \`x\` (par exemple les features d'une critique de film), des poids \`w\` et un biais \`b\` :

\`\`\`
z = w @ x + b          # le "logit" : un score brut, de -inf à +inf
p = sigmoid(z)         # une probabilité, entre 0 et 1
\`\`\`

La **sigmoïde** écrase le score brut en une probabilité :

\`\`\`
sigmoid(z) = 1 / (1 + exp(-z))
\`\`\`

- \`z\` très négatif → \`p ≈ 0\` (classe « négatif »),
- \`z = 0\` → \`p = 0.5\` (incertitude totale),
- \`z\` très positif → \`p ≈ 1\` (classe « positif »).

## Ce que « apprendre » veut dire

Les poids \`w\` encodent l'importance de chaque feature : un poids positif pour « excellent », négatif pour « ennuyeux ». *Apprendre = trouver les bons poids* — c'est l'objet de la leçon suivante. Pour l'instant, on construit la machine à prédire.

Retiens le vocabulaire : le mot **logit** que tu vois dans les API de LLM vient exactement d'ici — c'est le score brut *avant* la transformation en probabilité. La sortie finale d'un LLM (un softmax sur le vocabulaire) est simplement la cousine multiclasse de cette sigmoïde binaire.

## Pourquoi la non-linéarité est indispensable

Sans la sigmoïde (ou une autre non-linéarité comme ReLU), empiler des couches ne servirait à rien : la composition de fonctions linéaires reste linéaire (\`W₂(W₁x) = (W₂W₁)x\`, une seule couche déguisée). Ce sont les non-linéarités *entre* les couches qui donnent aux réseaux profonds — et aux transformers — leur pouvoir d'expression.

## Pièges classiques

- **Confondre logit et probabilité.** \`z\` n'est pas borné (de -inf à +inf) ; \`p\` vit entre 0 et 1. Une API qui te renvoie des « logits » ne te donne pas des probabilités : applique softmax/sigmoïde d'abord.
- **Le seuil de 0,5 n'est pas sacré.** Classer « positif si p ≥ 0,5 » est un choix par défaut. Selon le coût métier des erreurs (fraude, cancer…), tu déplaceras ce seuil — c'est *ton* curseur, pas celui du modèle.
- **Croire qu'un réseau sans activation est « plus simple ».** Il est surtout *inutile* : il ne peut apprendre que des frontières linéaires, aussi profond soit-il.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm7l1e2',
              title: "Le seuil de décision, un choix métier",
              instructions: `Le seuil de 0.5 n'a rien de sacré : détecter une fraude coûte cher en faux positifs, rater un cancer coûte infiniment plus en faux négatifs. Écris \`predire_avec_seuil(probas, seuil)\` (1 si proba ≥ seuil) puis \`compter_alertes(probas, seuil)\` qui renvoie le nombre de 1.

Observe dans les tests : baisser le seuil augmente les alertes — plus de rappel, moins de précision. Ce curseur, c'est TOI qui le règles, pas le modèle.`,
              starterCode: `import numpy as np

def predire_avec_seuil(probas, seuil=0.5):
    ...

def compter_alertes(probas, seuil=0.5):
    ...

p = np.array([0.2, 0.45, 0.55, 0.9, 0.35])
print(predire_avec_seuil(p, 0.5))
print(compter_alertes(p, 0.5), "alertes à 0.5")
print(compter_alertes(p, 0.3), "alertes à 0.3")`,
              solution: `import numpy as np

def predire_avec_seuil(probas, seuil=0.5):
    return (probas >= seuil).astype(int)

def compter_alertes(probas, seuil=0.5):
    return int(predire_avec_seuil(probas, seuil).sum())

p = np.array([0.2, 0.45, 0.55, 0.9, 0.35])
print(predire_avec_seuil(p, 0.5))
print(compter_alertes(p, 0.5), "alertes à 0.5")
print(compter_alertes(p, 0.3), "alertes à 0.3")`,
              tests: `import numpy as np
_p = np.array([0.2, 0.45, 0.55, 0.9, 0.35])
assert list(predire_avec_seuil(_p, 0.5)) == [0, 0, 1, 1, 0], "Seuil standard"
assert list(predire_avec_seuil(_p, 0.9)) == [0, 0, 0, 1, 0], "Seuil strict : seule la proba 0.9 passe (>= inclus)"
assert compter_alertes(_p, 0.5) == 2, "2 alertes à 0.5"
assert compter_alertes(_p, 0.3) == 4, "4 alertes à 0.3 — baisser le seuil = plus d'alertes"
assert compter_alertes(_p, 0.99) == 0, "Seuil quasi impossible : aucune alerte"
print("TESTS_PASS")`,
              hints: [
                '(probas >= seuil).astype(int) — la comparaison vectorisée.',
                'La somme d\'un vecteur de 0/1 compte les 1.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm7l1e3',
              title: "Défi — Matrice de confusion et métriques",
              instructions: `LE tableau qu'on te demandera à chaque modèle de classification. Écris :

1. \`matrice_confusion(y_vrai, y_pred)\` — le dict \`{"vp", "fp", "vn", "fn"}\` (vrais/faux positifs/négatifs, en int),
2. \`precision(cm)\` — vp / (vp + fp), et \`rappel(cm)\` — vp / (vp + fn) — \`0.0\` si dénominateur nul.

Précision : « quand j'alerte, ai-je raison ? ». Rappel : « est-ce que j'attrape tous les vrais cas ? ». Les confondre en réunion est un faux pas classique — plus jamais après cet exercice.`,
              starterCode: `import numpy as np

def matrice_confusion(y_vrai, y_pred):
    ...

def precision(cm):
    ...

def rappel(cm):
    ...

y_vrai = np.array([1, 1, 0, 0, 1, 0, 1, 0])
y_pred = np.array([1, 0, 0, 1, 1, 0, 0, 0])
cm = matrice_confusion(y_vrai, y_pred)
print(cm)
print("précision :", precision(cm), "| rappel :", rappel(cm))`,
              solution: `import numpy as np

def matrice_confusion(y_vrai, y_pred):
    y_vrai = np.asarray(y_vrai).astype(int)
    y_pred = np.asarray(y_pred).astype(int)
    return {
        "vp": int(((y_vrai == 1) & (y_pred == 1)).sum()),
        "fp": int(((y_vrai == 0) & (y_pred == 1)).sum()),
        "vn": int(((y_vrai == 0) & (y_pred == 0)).sum()),
        "fn": int(((y_vrai == 1) & (y_pred == 0)).sum()),
    }

def precision(cm):
    total = cm["vp"] + cm["fp"]
    return cm["vp"] / total if total else 0.0

def rappel(cm):
    total = cm["vp"] + cm["fn"]
    return cm["vp"] / total if total else 0.0

y_vrai = np.array([1, 1, 0, 0, 1, 0, 1, 0])
y_pred = np.array([1, 0, 0, 1, 1, 0, 0, 0])
cm = matrice_confusion(y_vrai, y_pred)
print(cm)
print("précision :", precision(cm), "| rappel :", rappel(cm))`,
              tests: `import numpy as np
_cm = matrice_confusion(np.array([1, 1, 0, 0, 1, 0, 1, 0]), np.array([1, 0, 0, 1, 1, 0, 0, 0]))
assert _cm == {"vp": 2, "fp": 1, "vn": 3, "fn": 2}, "Compte chaque case : vp=2, fp=1, vn=3, fn=2"
assert abs(precision(_cm) - 2/3) < 1e-9, "précision = vp/(vp+fp) = 2/3"
assert abs(rappel(_cm) - 2/4) < 1e-9, "rappel = vp/(vp+fn) = 1/2"
_parfait = matrice_confusion(np.array([1, 0]), np.array([1, 0]))
assert precision(_parfait) == 1.0 and rappel(_parfait) == 1.0, "Classifieur parfait"
_muet = matrice_confusion(np.array([1, 1]), np.array([0, 0]))
assert precision(_muet) == 0.0, "Aucune prédiction positive : précision 0.0, pas de crash"
print("TESTS_PASS")`,
              hints: [
                'Chaque case est une conjonction : (y_vrai == 1) & (y_pred == 1), sommée.',
                'Le & (et non "and") pour combiner des masques booléens NumPy.',
                'Les gardes "if total else 0.0" évitent les divisions par zéro.',
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

L'entraînement de *tous* les modèles — de la régression logistique à GPT — suit la même boucle. La comprendre une fois, à la main, c'est acquérir le modèle mental qui te permettra de déboguer n'importe quel entraînement dans ta carrière.

## La boucle universelle

1. **prédire** avec les poids actuels,
2. **mesurer l'erreur** avec une fonction de perte (*loss*),
3. **calculer le gradient** : dans quelle direction bouger chaque poids pour réduire la perte,
4. **mettre à jour** : \`w = w - lr × gradient\` (lr = *learning rate*, le taux d'apprentissage),
5. recommencer.

## La perte : l'entropie croisée binaire

Pour des probabilités \`p\` et des étiquettes \`y\` (0 ou 1) :

\`\`\`
loss = -moyenne( y·log(p) + (1-y)·log(1-p) )
\`\`\`

Elle punit sévèrement une prédiction *confiante et fausse* : \`log(tout petit)\` est très négatif. C'est la même famille de perte qui entraîne les LLM (entropie croisée sur le prochain token) — tu apprends ici la version minimale d'un mécanisme universel.

## Le gradient, offert pour cette fois

Pour la régression logistique, le calcul donne des formules remarquablement simples :

\`\`\`
erreur = p - y                        # vecteur (n,)
grad_w = X.T @ erreur / n             # (d,)
grad_b = erreur.mean()                # scalaire
\`\`\`

L'intuition : chaque poids est corrigé proportionnellement à *(l'erreur commise) × (la feature qui y a contribué)*. En pratique, PyTorch calcule ces gradients automatiquement (\`loss.backward()\`) — mais les avoir écrits une fois à la main change ta compréhension de tout le reste.

## La descente de gradient, image mentale

Imagine la perte comme un paysage vallonné et tes poids comme une bille. Le gradient pointe vers le *haut* de la pente ; on va donc dans le sens *opposé*, à petits pas (\`lr\`), pour descendre vers le fond de la vallée (la perte minimale).

## Pièges classiques

- **\`log(0)\` explose.** Si \`p\` vaut exactement 0 ou 1, le logarithme diverge. On « clippe » toujours \`p\` dans \`[1e-10, 1 - 1e-10]\` avant les log.
- **Le learning rate, hyperparamètre le plus sensible.** Trop petit : l'entraînement est interminable. Trop grand : la bille rebondit hors de la vallée et la perte *diverge*. D'où les « lr schedules » (warmup, décroissance) de tous les papiers de LLM.
- **Croire que la perte doit descendre à chaque pas.** Sur des données réelles et par mini-batchs, elle oscille en descendant. C'est la *tendance* qui compte, pas chaque valeur.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm7l2e2',
              title: "Suivre la courbe de perte",
              instructions: `Le premier réflexe de monitoring d'un entraînement : enregistrer la perte à chaque étape. Avec \`une_etape\` et \`perte\` fournis, écris \`historique_pertes(X, y, etapes, lr)\` qui :

1. initialise \`w\` à zéros et \`b\` à 0,
2. enregistre la perte AVANT la première étape, puis après chaque étape,
3. renvoie la liste des pertes (longueur \`etapes + 1\`).

C'est cette liste que trace TensorBoard/W&B — et qu'on scrute pour diagnostiquer un entraînement.`,
              starterCode: `import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def perte(p, y):
    p = np.clip(p, 1e-10, 1 - 1e-10)
    return float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)))

def une_etape(X, y, w, b, lr):
    p = sigmoid(X @ w + b)
    return w - lr * (X.T @ (p - y)) / len(y), b - lr * (p - y).mean()

X = np.array([[2.0, 0.5], [1.5, 1.0], [-1.0, -0.5], [-2.0, 0.0]])
y = np.array([1.0, 1.0, 0.0, 0.0])

def historique_pertes(X, y, etapes=10, lr=0.5):
    ...

h = historique_pertes(X, y, etapes=5)
print([round(v, 3) for v in h])`,
              solution: `import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def perte(p, y):
    p = np.clip(p, 1e-10, 1 - 1e-10)
    return float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)))

def une_etape(X, y, w, b, lr):
    p = sigmoid(X @ w + b)
    return w - lr * (X.T @ (p - y)) / len(y), b - lr * (p - y).mean()

X = np.array([[2.0, 0.5], [1.5, 1.0], [-1.0, -0.5], [-2.0, 0.0]])
y = np.array([1.0, 1.0, 0.0, 0.0])

def historique_pertes(X, y, etapes=10, lr=0.5):
    w, b = np.zeros(X.shape[1]), 0.0
    pertes = [perte(sigmoid(X @ w + b), y)]
    for _ in range(etapes):
        w, b = une_etape(X, y, w, b, lr)
        pertes.append(perte(sigmoid(X @ w + b), y))
    return pertes

h = historique_pertes(X, y, etapes=5)
print([round(v, 3) for v in h])`,
              tests: `import numpy as np
_h = historique_pertes(X, y, etapes=10)
assert len(_h) == 11, "10 étapes -> 11 mesures (l'état initial compris)"
assert abs(_h[0] - perte(np.full(4, 0.5), y)) < 1e-9, "Perte initiale : poids nuls -> probas 0.5 partout"
assert all(_h[i+1] <= _h[i] + 1e-9 for i in range(len(_h) - 1)), "Sur ce problème simple, la perte décroît à chaque étape"
assert _h[-1] < _h[0] / 2, "Après 10 étapes, la perte a nettement fondu"
print("TESTS_PASS")`,
              hints: [
                'Mesure AVANT la boucle, puis une fois par itération après la mise à jour.',
                'La longueur attendue (etapes + 1) est le test de santé de ta boucle.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm7l2e3',
              title: "Défi — Early stopping",
              instructions: `Entraîner trop longtemps gaspille du GPU et sur-apprend. L'**early stopping** coupe quand la perte stagne : écris \`indice_arret(pertes, patience)\` qui renvoie l'indice de la mesure où l'on aurait dû s'arrêter — le premier indice \`i\` tel que la perte ne s'est plus améliorée (strictement) pendant les \`patience\` mesures suivantes — ou \`None\` si on ne s'arrête jamais.

Formellement : \`i\` est le premier indice où \`min(pertes[i+1 : i+1+patience]) >= pertes[i]\` (avec au moins \`patience\` mesures après \`i\`).`,
              starterCode: `def indice_arret(pertes, patience=2):
    ...

print(indice_arret([1.0, 0.8, 0.7, 0.71, 0.72, 0.73], patience=2))
print(indice_arret([1.0, 0.8, 0.6, 0.4], patience=2))`,
              solution: `def indice_arret(pertes, patience=2):
    for i in range(len(pertes) - patience):
        fenetre = pertes[i + 1 : i + 1 + patience]
        if min(fenetre) >= pertes[i]:
            return i
    return None

print(indice_arret([1.0, 0.8, 0.7, 0.71, 0.72, 0.73], patience=2))
print(indice_arret([1.0, 0.8, 0.6, 0.4], patience=2))`,
              tests: `assert indice_arret([1.0, 0.8, 0.7, 0.71, 0.72, 0.73], 2) == 2, "Après l'indice 2 (0.7), plus aucune amélioration pendant 2 mesures"
assert indice_arret([1.0, 0.8, 0.6, 0.4], 2) is None, "Amélioration continue : on ne s'arrête pas"
assert indice_arret([0.5, 0.6, 0.7, 0.8], 2) == 0, "Ça empire dès le début : stop immédiat"
assert indice_arret([1.0, 0.9, 0.95, 0.85, 0.9, 0.95], 2) == 3, "Après le minimum 0.85 (indice 3), plus aucune amélioration : stop à 3"
assert indice_arret([1.0, 1.0, 1.0, 1.0], 2) == 0, "Stagnation totale (>= inclus) : stop à 0"
print("TESTS_PASS")`,
              hints: [
                'Fenêtre glissante : pertes[i+1 : i+1+patience], comparée à pertes[i].',
                'range(len(pertes) - patience) garantit une fenêtre complète.',
                'Le >= (et non >) fait que la stagnation pure déclenche aussi l\'arrêt.',
              ],
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
      {
        id: 'm7l3',
        title: 'Généralisation : le split train/test',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Le péché originel du ML : s'évaluer sur ses données d'entraînement

Ton classifieur de la leçon précédente classe parfaitement… *les exemples sur lesquels il s'est entraîné*. Mais un modèle qui a mémorisé n'a rien appris : ce qui compte, c'est sa performance sur des données **jamais vues**. Cette distinction — apprentissage contre **généralisation** — est la plus fondamentale de tout le machine learning, et celle qui démasque les faux « 99 % d'accuracy » annoncés en réunion.

## Le protocole minimal

\`\`\`
1. Mélanger les données (avec une graine fixée, pour la reproductibilité)
2. Découper : ~80 % train / ~20 % test
3. Entraîner sur le TRAIN uniquement
4. Mesurer l'accuracy sur le TEST — le seul chiffre qui compte
\`\`\`

## Lire l'écart train/test

- \`train ≈ test\`, tous deux bons → le modèle **généralise** ✓
- \`train ≫ test\` → **overfitting** : le modèle a mémorisé le bruit du train. Remèdes : plus de données, modèle plus simple, régularisation.
- \`train\` déjà mauvais → **underfitting** : le modèle est trop simple pour le problème.

L'écart train/test est un *thermomètre* : ne communique jamais le score de train comme performance du modèle — c'est l'erreur de débutant la plus répandue.

## Le mélange : une étape critique

Si tes données sont ordonnées (tous les positifs puis tous les négatifs — très courant !), un découpage sans mélange mettrait *toutes* les classes d'un même côté. \`rng.permutation(n)\` génère des indices mélangés ; on indexe \`X\` et \`y\` avec **les mêmes** indices pour préserver l'alignement exemple ↔ étiquette.

## Le lien avec les LLM

Ce protocole s'applique tel quel aux grands modèles : les jeux d'évaluation doivent être *disjoints* des données d'entraînement. Quand un LLM a « vu » les questions d'un benchmark pendant son pré-entraînement, son score est gonflé — c'est la **contamination**, le train/test violé à l'échelle du web.

## Pièges classiques

- **Mélanger \`X\` et \`y\` séparément.** Deux permutations différentes brisent l'alignement : chaque exemple se retrouve avec la mauvaise étiquette. Utilise les *mêmes* indices pour les deux.
- **La fuite de données (data leakage).** Si une information du test « fuit » dans le train (doublons, normalisation calculée sur tout le dataset…), le score explose artificiellement. Le split se fait *avant* tout calcul dépendant des données.
- **Oublier la graine aléatoire.** Sans graine fixée, chaque exécution donne un split différent et des résultats non reproductibles — impossible de comparer deux modèles équitablement.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm7l3e1',
              title: 'Protocole d\'évaluation complet',
              instructions: `Le starter fournit le classifieur du module 7 (entraînement compris). Implémente :

1. \`split_train_test(X, y, part_test, graine)\` — mélange avec \`np.random.RandomState(graine).permutation(len(y))\`, puis découpe : les premiers \`n_test = int(len(y) * part_test)\` indices pour le test, le reste pour le train. Renvoie \`(X_train, y_train, X_test, y_test)\`,
2. \`accuracy(y_vrai, y_pred)\` — la fraction d'étiquettes correctes,
3. \`protocole(X, y)\` — split (20 % test, graine 42), entraîne sur le train, renvoie \`{"train": acc_train, "test": acc_test}\`.`,
              starterCode: `import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def entrainer(X, y, epochs=300, lr=0.5):
    w, b = np.zeros(X.shape[1]), 0.0
    for _ in range(epochs):
        p = sigmoid(X @ w + b)
        w -= lr * (X.T @ (p - y)) / len(y)
        b -= lr * (p - y).mean()
    return w, b

def predire(X, w, b):
    return (sigmoid(X @ w + b) >= 0.5).astype(int)

# Dataset jouet : 20 exemples, séparables par la 1re feature
rng = np.random.RandomState(0)
X = rng.randn(20, 2)
y = (X[:, 0] > 0).astype(float)

def split_train_test(X, y, part_test=0.2, graine=42):
    ...

def accuracy(y_vrai, y_pred):
    ...

def protocole(X, y):
    ...

print(protocole(X, y))`,
              solution: `import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def entrainer(X, y, epochs=300, lr=0.5):
    w, b = np.zeros(X.shape[1]), 0.0
    for _ in range(epochs):
        p = sigmoid(X @ w + b)
        w -= lr * (X.T @ (p - y)) / len(y)
        b -= lr * (p - y).mean()
    return w, b

def predire(X, w, b):
    return (sigmoid(X @ w + b) >= 0.5).astype(int)

rng = np.random.RandomState(0)
X = rng.randn(20, 2)
y = (X[:, 0] > 0).astype(float)

def split_train_test(X, y, part_test=0.2, graine=42):
    indices = np.random.RandomState(graine).permutation(len(y))
    n_test = int(len(y) * part_test)
    test, train = indices[:n_test], indices[n_test:]
    return X[train], y[train], X[test], y[test]

def accuracy(y_vrai, y_pred):
    return float((y_vrai.astype(int) == y_pred.astype(int)).mean())

def protocole(X, y):
    X_tr, y_tr, X_te, y_te = split_train_test(X, y, 0.2, 42)
    w, b = entrainer(X_tr, y_tr)
    return {"train": accuracy(y_tr, predire(X_tr, w, b)),
            "test": accuracy(y_te, predire(X_te, w, b))}

print(protocole(X, y))`,
              tests: `import numpy as np
_Xt, _yt, _Xe, _ye = split_train_test(X, y, 0.2, 42)
assert len(_ye) == 4 and len(_yt) == 16, "20 exemples : 4 en test (20 %), 16 en train"
assert _Xt.shape == (16, 2) and _Xe.shape == (4, 2), "X découpé avec les mêmes indices que y"
_Xt2, _yt2, _, _ = split_train_test(X, y, 0.2, 42)
assert np.allclose(_Xt, _Xt2), "Même graine : même découpage (reproductibilité)"
_, _, _Xe3, _ = split_train_test(X, y, 0.2, 7)
assert not np.allclose(_Xe, _Xe3), "Graine différente : découpage différent"
# L'alignement X/y doit être préservé par le mélange
for _i in range(4):
    assert _ye[_i] == (float(_Xe[_i, 0] > 0)), "Chaque étiquette doit rester alignée avec son exemple !"
assert accuracy(np.array([1.0, 0.0, 1.0]), np.array([1, 0, 0])) == 2/3, "2 corrects sur 3"
_r = protocole(X, y)
assert _r["test"] >= 0.75, "Sur ce problème séparable, le test doit être bien classé"
print("TESTS_PASS")`,
              hints: [
                'permutation(len(y)) donne des indices mélangés ; X[indices] et y[indices] les appliquent aux DEUX tableaux.',
                'test = indices[:n_test], train = indices[n_test:] — puis X[train], y[train], X[test], y[test].',
                'Si le test d\'alignement échoue : tu as mélangé X et y avec des indices différents.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm7l3e2',
              title: "Vérifier l'équilibre des classes",
              instructions: `Avant tout split et tout entraînement : la distribution des classes. Écris :

1. \`proportions(y)\` — le dict \`classe → proportion\` (arrondie à 3 décimales),
2. \`est_desequilibre(y, seuil=0.8)\` — \`True\` si une classe dépasse le seuil.

Un dataset à 95 % de classe 0 rend l'accuracy mensongère (le modèle « toujours 0 » score 95 %) — c'est LE piège des données de fraude, de churn, de pannes.`,
              starterCode: `import numpy as np

def proportions(y):
    ...

def est_desequilibre(y, seuil=0.8):
    ...

y = np.array([0, 0, 0, 0, 1, 0, 0, 0, 0, 0])
print(proportions(y))
print(est_desequilibre(y))`,
              solution: `import numpy as np

def proportions(y):
    y = np.asarray(y)
    valeurs, comptes = np.unique(y, return_counts=True)
    return {int(v): round(float(c) / len(y), 3) for v, c in zip(valeurs, comptes)}

def est_desequilibre(y, seuil=0.8):
    return any(p >= seuil for p in proportions(y).values())

y = np.array([0, 0, 0, 0, 1, 0, 0, 0, 0, 0])
print(proportions(y))
print(est_desequilibre(y))`,
              tests: `import numpy as np
_p = proportions(np.array([0, 0, 0, 1]))
assert _p == {0: 0.75, 1: 0.25}, "3/4 et 1/4"
assert est_desequilibre(np.array([0]*9 + [1]), seuil=0.8), "90 % d'une classe : déséquilibré"
assert not est_desequilibre(np.array([0, 1, 0, 1]), seuil=0.8), "50/50 : équilibré"
assert est_desequilibre(np.array([1, 1]), seuil=0.8), "Une seule classe présente : 100 %"
print("TESTS_PASS")`,
              hints: [
                'np.unique(y, return_counts=True) donne valeurs et comptes d\'un coup.',
                'any(...) sur les proportions pour le test de seuil.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm7l3e3',
              title: "Défi — Détecter la fuite train/test",
              instructions: `L'audit qui démasque les « 99 % d'accuracy » : des exemples du test présents à l'identique dans le train. Écris \`fuite(X_train, X_test)\` qui renvoie :

1. \`"indices"\` : la liste des indices de lignes de \`X_test\` présentes exactement dans \`X_train\` (convertis chaque ligne en tuple pour la comparer via un set),
2. \`"taux"\` : la fraction de X_test concernée, arrondie à 3 décimales.

Un taux non nul invalide l'évaluation — c'est la première chose à vérifier dans un audit de modèle.`,
              starterCode: `import numpy as np

def fuite(X_train, X_test):
    ...

X_train = np.array([[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]])
X_test = np.array([[3.0, 4.0], [7.0, 8.0], [1.0, 2.0], [9.0, 9.0]])
print(fuite(X_train, X_test))`,
              solution: `import numpy as np

def fuite(X_train, X_test):
    vues = {tuple(ligne) for ligne in X_train.tolist()}
    indices = [i for i, ligne in enumerate(X_test.tolist()) if tuple(ligne) in vues]
    taux = round(len(indices) / len(X_test), 3) if len(X_test) else 0.0
    return {"indices": indices, "taux": taux}

X_train = np.array([[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]])
X_test = np.array([[3.0, 4.0], [7.0, 8.0], [1.0, 2.0], [9.0, 9.0]])
print(fuite(X_train, X_test))`,
              tests: `import numpy as np
_r = fuite(np.array([[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]]),
           np.array([[3.0, 4.0], [7.0, 8.0], [1.0, 2.0], [9.0, 9.0]]))
assert _r["indices"] == [0, 2], "Les lignes 0 et 2 du test existent dans le train"
assert _r["taux"] == 0.5, "2 lignes sur 4"
_r2 = fuite(np.array([[1.0, 1.0]]), np.array([[2.0, 2.0]]))
assert _r2 == {"indices": [], "taux": 0.0}, "Aucune fuite"
_r3 = fuite(np.array([[1.0, 1.0]]), np.array([[1.0, 1.0]]))
assert _r3["taux"] == 1.0, "Test entièrement contaminé"
print("TESTS_PASS")`,
              hints: [
                'Un set de tuples des lignes du train — les arrays ne sont pas hachables, les tuples oui.',
                'enumerate sur X_test.tolist() pour collecter les indices contaminés.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Accuracy train = 99 %, test = 61 %. Diagnostic ?',
                options: [
                  'Le modèle est excellent',
                  'Overfitting : le modèle a mémorisé le train et généralise mal — le chiffre honnête est 61 %',
                  'Underfitting',
                  'Le jeu de test est trop facile',
                ],
                correct: 1,
                explanation: 'L\'écart train/test est le thermomètre de la mémorisation. Ne JAMAIS communiquer le score de train comme performance du modèle — c\'est l\'erreur de débutant la plus répandue du ML.',
              },
              {
                question: 'Qu\'est-ce que la "contamination" des benchmarks LLM ?',
                options: [
                  'Des virus dans les datasets',
                  'Les questions du benchmark figuraient dans les données d\'entraînement du modèle : son score mesure la mémorisation, pas la capacité',
                  'Des erreurs d\'annotation',
                  'Un problème d\'encodage',
                ],
                correct: 1,
                explanation: 'C\'est exactement le principe train/test à l\'échelle des LLM : un modèle qui a "vu" MMLU pendant son pré-entraînement a un score gonflé. D\'où les benchmarks privés et les jeux d\'éval maison — toujours postérieurs ou privés.',
              },
            ],
          },
        ],
      },
    ],
  }
