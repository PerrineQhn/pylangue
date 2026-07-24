import type { Module } from '@/lib/types'

export const m8: Module = {
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
            kind: 'exercise',
            exercise: {
              id: 'm8l1e2',
              title: "L'inventaire des symboles",
              instructions: `Avant d'entraîner un BPE, on inventorie l'alphabet de départ. Sur un corpus \`{mot_tuple: fréquence}\`, écris :

1. \`symboles(corpus)\` — le **set** de tous les symboles présents,
2. \`taille_corpus(corpus)\` — le nombre total de mots, fréquences comprises (somme des valeurs),
3. \`longueur_moyenne(corpus)\` — la longueur moyenne des mots **pondérée par leur fréquence**, arrondie à 2 décimales (\`0.0\` si corpus vide). Cette valeur vaut la fertilité initiale : au départ, chaque mot coûte autant de tokens que de caractères.`,
              starterCode: `CORPUS = {("l", "o", "w"): 5, ("l", "o", "w", "e", "r"): 2, ("n", "e", "w"): 6}

def symboles(corpus):
    ...

def taille_corpus(corpus):
    ...

def longueur_moyenne(corpus):
    ...

print(sorted(symboles(CORPUS)))
print(taille_corpus(CORPUS))
print(longueur_moyenne(CORPUS))`,
              solution: `CORPUS = {("l", "o", "w"): 5, ("l", "o", "w", "e", "r"): 2, ("n", "e", "w"): 6}

def symboles(corpus):
    result = set()
    for mot in corpus:
        result.update(mot)
    return result

def taille_corpus(corpus):
    return sum(corpus.values())

def longueur_moyenne(corpus):
    total = taille_corpus(corpus)
    if total == 0:
        return 0.0
    return round(sum(len(mot) * freq for mot, freq in corpus.items()) / total, 2)

print(sorted(symboles(CORPUS)))
print(taille_corpus(CORPUS))
print(longueur_moyenne(CORPUS))`,
              tests: `assert symboles(CORPUS) == {"l", "o", "w", "e", "r", "n"}, "Les 6 symboles de l'alphabet de départ"
assert taille_corpus(CORPUS) == 13, "5 + 2 + 6 = 13 mots"
assert longueur_moyenne(CORPUS) == round((3*5 + 5*2 + 3*6) / 13, 2), "Longueur pondérée par les fréquences"
assert symboles({}) == set() and taille_corpus({}) == 0 and longueur_moyenne({}) == 0.0, "Corpus vide"
print("TESTS_PASS")`,
              hints: [
                'set.update(mot) ajoute tous les éléments d\'un tuple au set.',
                'La pondération : len(mot) * freq, sommé, divisé par le total des fréquences.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm8l1e3',
              title: "Défi — Préparer un corpus BPE depuis du texte brut",
              instructions: `Fais le pont entre le texte réel et la représentation BPE : \`preparer_corpus(texte)\` transforme une chaîne en dict \`{tuple_de_caracteres: frequence}\` :

1. minuscules, découpe sur les espaces,
2. chaque mot devient un tuple de caractères **terminé par le symbole spécial \`"</w>"\`** (fin de mot — c'est ainsi que le vrai BPE distingue « pomme de terre » de « pommedeterre » et sait où recoller les espaces au décodage),
3. les fréquences s'additionnent pour les mots répétés.`,
              starterCode: `def preparer_corpus(texte):
    ...

corpus = preparer_corpus("le chat le chien")
for mot, freq in corpus.items():
    print(mot, freq)`,
              solution: `def preparer_corpus(texte):
    corpus = {}
    for mot in texte.lower().split():
        cle = tuple(mot) + ("</w>",)
        corpus[cle] = corpus.get(cle, 0) + 1
    return corpus

corpus = preparer_corpus("le chat le chien")
for mot, freq in corpus.items():
    print(mot, freq)`,
              tests: `_c = preparer_corpus("le chat le chien")
assert _c[("l", "e", "</w>")] == 2, "'le' apparaît 2 fois"
assert _c[("c", "h", "a", "t", "</w>")] == 1, "'chat' découpé en caractères + fin de mot"
assert len(_c) == 3, "3 mots distincts"
assert preparer_corpus("") == {}, "Texte vide"
_c2 = preparer_corpus("Ab ab AB")
assert _c2 == {("a", "b", "</w>"): 3}, "Normalisation : un seul mot, fréquence 3"
print("TESTS_PASS")`,
              hints: [
                'tuple(mot) éclate la chaîne en caractères ; + ("</w>",) ajoute le marqueur (attention à la virgule du tuple à 1 élément !).',
                'Le motif de comptage habituel sur ces tuples.',
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
            kind: 'exercise',
            exercise: {
              id: 'm8l2e2',
              title: "Rejouer une liste de fusions",
              instructions: `Entraînement et encodage partagent cette brique : \`appliquer_fusions(corpus, fusions)\` applique une **liste** de fusions, dans l'ordre, à tout le corpus (avec \`appliquer_fusion\` fourni), et renvoie le corpus final.

Vérifie au passage la propriété clé : appliquer [f1, f2] d'un coup = appliquer f1 puis f2.`,
              starterCode: `def fusionner_mot(mot, paire):
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

def appliquer_fusions(corpus, fusions):
    ...

corpus = {("l", "o", "w"): 5, ("l", "o", "w", "e", "r"): 2}
print(appliquer_fusions(corpus, [("l", "o"), ("lo", "w")]))`,
              solution: `def fusionner_mot(mot, paire):
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

def appliquer_fusions(corpus, fusions):
    for paire in fusions:
        corpus = appliquer_fusion(corpus, paire)
    return corpus

corpus = {("l", "o", "w"): 5, ("l", "o", "w", "e", "r"): 2}
print(appliquer_fusions(corpus, [("l", "o"), ("lo", "w")]))`,
              tests: `_c = {("l", "o", "w"): 5, ("l", "o", "w", "e", "r"): 2}
_r = appliquer_fusions(_c, [("l", "o"), ("lo", "w")])
assert _r == {("low",): 5, ("low", "e", "r"): 2}, "Les deux fusions en cascade"
assert appliquer_fusions(_c, []) == _c, "Aucune fusion : corpus inchangé"
_etape1 = appliquer_fusion(_c, ("l", "o"))
_etape2 = appliquer_fusion(_etape1, ("lo", "w"))
assert appliquer_fusions(_c, [("l", "o"), ("lo", "w")]) == _etape2, "Équivalence : liste = enchaînement manuel"
print("TESTS_PASS")`,
              hints: [
                'Une boucle qui réaffecte corpus = appliquer_fusion(corpus, paire).',
                'L\'ordre de la liste EST l\'ordre d\'application.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm8l2e3',
              title: "Défi — La courbe de compression",
              instructions: `Combien de fusions faut-il ? On trace la **longueur totale du corpus en tokens** après chaque fusion : \`courbe_compression(corpus, n_fusions)\` renvoie la liste \`[total_initial, apres_fusion_1, ...]\` où chaque total = somme de \`len(mot) × fréquence\`.

Utilise les briques fournies (compter, meilleure paire, appliquer). La courbe décroît vite puis plafonne — c'est elle qui guide le choix de la taille de vocabulaire des vrais tokenizers.`,
              starterCode: `def fusionner_mot(mot, paire):
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

def compter_paires(corpus):
    paires = {}
    for mot, freq in corpus.items():
        for i in range(len(mot) - 1):
            paires[(mot[i], mot[i+1])] = paires.get((mot[i], mot[i+1]), 0) + freq
    return paires

def total_tokens(corpus):
    return sum(len(mot) * freq for mot, freq in corpus.items())

def courbe_compression(corpus, n_fusions):
    ...

corpus = {("l","o","w"): 5, ("l","o","w","e","r"): 2, ("n","e","w","e","r"): 6}
print(courbe_compression(corpus, 4))`,
              solution: `def fusionner_mot(mot, paire):
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

def compter_paires(corpus):
    paires = {}
    for mot, freq in corpus.items():
        for i in range(len(mot) - 1):
            paires[(mot[i], mot[i+1])] = paires.get((mot[i], mot[i+1]), 0) + freq
    return paires

def total_tokens(corpus):
    return sum(len(mot) * freq for mot, freq in corpus.items())

def courbe_compression(corpus, n_fusions):
    courbe = [total_tokens(corpus)]
    for _ in range(n_fusions):
        paires = compter_paires(corpus)
        if not paires:
            break
        best = max(paires, key=paires.get)
        corpus = appliquer_fusion(corpus, best)
        courbe.append(total_tokens(corpus))
    return courbe

corpus = {("l","o","w"): 5, ("l","o","w","e","r"): 2, ("n","e","w","e","r"): 6}
print(courbe_compression(corpus, 4))`,
              tests: `_c = {("l","o","w"): 5, ("l","o","w","e","r"): 2, ("n","e","w","e","r"): 6}
_courbe = courbe_compression(_c, 4)
assert _courbe[0] == 3*5 + 5*2 + 5*6, "Total initial : 55 tokens"
assert len(_courbe) == 5, "Initial + 4 fusions"
assert all(_courbe[i+1] < _courbe[i] for i in range(len(_courbe)-1)), "Chaque fusion RÉDUIT le total"
assert _courbe[1] == _courbe[0] - 8, "La 1re fusion (fréquence 8) économise 8 tokens"
_mini = courbe_compression({("a", "b"): 1}, 10)
assert _mini == [2, 1], "Arrêt anticipé quand plus rien à fusionner"
print("TESTS_PASS")`,
              hints: [
                'La boucle d\'entraînement du module, avec un total_tokens enregistré à chaque tour.',
                'Une fusion de fréquence f économise exactement f tokens — vérifie-le sur la courbe !',
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
      {
        id: 'm8l3',
        title: 'Encoder avec un BPE entraîné',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# La deuxième moitié du tokenizer

Entraîner BPE produit une **liste ordonnée de fusions**. Mais comment tokeniser un texte *nouveau* — y compris des mots jamais vus à l'entraînement ? En **rejouant les fusions dans leur ordre d'apprentissage** :

\`\`\`
mot nouveau : "lowest" -> l o w e s t
fusion 1 ("e","r")  : rien à fusionner ici
fusion 2 ("l","o")  : lo w e s t
fusion 3 ("lo","w") : low e s t
résultat : ["low", "e", "s", "t"]
\`\`\`

Le mot inconnu « lowest » se découpe en sous-unités connues — dont \`low\`, appris sur d'autres mots. **Aucun \`<unk>\`**, et les régularités morphologiques sont réutilisées : c'est toute la puissance de BPE.

## Pourquoi l'ordre des fusions est sacré

Chaque fusion a été apprise sur un corpus *où les précédentes étaient déjà appliquées*. Les rejouer dans le désordre produirait des découpages différents de ceux vus à l'entraînement du modèle — et un LLM reçoit alors des séquences de tokens qu'il n'a jamais rencontrées. C'est pourquoi un tokenizer est versionné avec son modèle, à l'octet près.

## Mesurer la « fertilité »

Le nombre moyen de tokens par mot s'appelle la **fertilité** du tokenizer. Fertilité 1.1 = presque un token par mot (corpus bien couvert) ; fertilité 3 = mots pulvérisés (langue ou domaine mal couverts → contexte et budget gaspillés). C'est un chiffre à connaître quand on choisit un modèle pour une langue donnée.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm8l3e1',
              title: 'La fonction encoder()',
              instructions: `Le starter fournit \`fusionner_mot\` (module 8) et des fusions apprises. Implémente :

1. \`encoder_mot(mot, fusions)\` — découpe le mot (str) en tuple de caractères, applique \`fusionner_mot\` pour **chaque fusion, dans l'ordre**, renvoie la liste finale des tokens,
2. \`encoder(texte, fusions)\` — encode chaque mot du texte (split espaces) et concatène toutes les listes de tokens,
3. \`fertilite(texte, fusions)\` — tokens totaux / nombre de mots, arrondi à 2 décimales.`,
              starterCode: `def fusionner_mot(mot, paire):
    nouveau, i = [], 0
    while i < len(mot):
        if i < len(mot) - 1 and (mot[i], mot[i+1]) == paire:
            nouveau.append(mot[i] + mot[i+1]); i += 2
        else:
            nouveau.append(mot[i]); i += 1
    return tuple(nouveau)

FUSIONS = [("e", "r"), ("l", "o"), ("lo", "w"), ("n", "e"), ("ne", "w")]

def encoder_mot(mot, fusions):
    ...

def encoder(texte, fusions):
    ...

def fertilite(texte, fusions):
    ...

print(encoder_mot("lowest", FUSIONS))
print(encoder("new lower news", FUSIONS))
print(fertilite("new lower news", FUSIONS))`,
              solution: `def fusionner_mot(mot, paire):
    nouveau, i = [], 0
    while i < len(mot):
        if i < len(mot) - 1 and (mot[i], mot[i+1]) == paire:
            nouveau.append(mot[i] + mot[i+1]); i += 2
        else:
            nouveau.append(mot[i]); i += 1
    return tuple(nouveau)

FUSIONS = [("e", "r"), ("l", "o"), ("lo", "w"), ("n", "e"), ("ne", "w")]

def encoder_mot(mot, fusions):
    symboles = tuple(mot)
    for paire in fusions:
        symboles = fusionner_mot(symboles, paire)
    return list(symboles)

def encoder(texte, fusions):
    tokens = []
    for mot in texte.split():
        tokens.extend(encoder_mot(mot, fusions))
    return tokens

def fertilite(texte, fusions):
    mots = texte.split()
    return round(len(encoder(texte, fusions)) / len(mots), 2)

print(encoder_mot("lowest", FUSIONS))
print(encoder("new lower news", FUSIONS))
print(fertilite("new lower news", FUSIONS))`,
              tests: `assert encoder_mot("lowest", FUSIONS) == ["low", "e", "s", "t"], "'lowest' -> low + e + s + t (mot inconnu, sous-unités connues)"
assert encoder_mot("new", FUSIONS) == ["new"], "'new' entièrement fusionné : un seul token"
assert encoder_mot("lower", FUSIONS) == ["low", "er"], "'lower' -> low + er"
assert encoder_mot("xyz", FUSIONS) == ["x", "y", "z"], "Aucune fusion applicable : caractères individuels, jamais de <unk>"
assert encoder("new lower", FUSIONS) == ["new", "low", "er"], "Concaténation des tokens des mots"
assert fertilite("new new", FUSIONS) == 1.0, "2 mots, 2 tokens : fertilité 1.0"
assert fertilite("xyz", FUSIONS) == 3.0, "1 mot, 3 tokens : fertilité 3.0"
print("TESTS_PASS")`,
              hints: [
                'encoder_mot : tuple(mot) transforme "abc" en ("a","b","c") ; puis une boucle sur les fusions DANS L\'ORDRE.',
                'encoder : tokens.extend(...) (pas append !) pour aplatir les listes.',
                'Si "lower" donne autre chose que [low, er] : vérifie que tu appliques bien TOUTES les fusions à CHAQUE mot.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm8l3e2',
              title: "Compter les tokens d'un texte",
              instructions: `Le compteur que tout le monde branche avant d'appeler une API : \`compter_tokens(texte, fusions)\` renvoie le nombre total de tokens du texte encodé (réutilise \`encoder_mot\` fourni), et \`mot_le_plus_cher(texte, fusions)\` renvoie le mot du texte qui coûte le plus de tokens (le premier en cas d'égalité).`,
              starterCode: `def fusionner_mot(mot, paire):
    nouveau, i = [], 0
    while i < len(mot):
        if i < len(mot) - 1 and (mot[i], mot[i+1]) == paire:
            nouveau.append(mot[i] + mot[i+1]); i += 2
        else:
            nouveau.append(mot[i]); i += 1
    return tuple(nouveau)

def encoder_mot(mot, fusions):
    symboles = tuple(mot)
    for paire in fusions:
        symboles = fusionner_mot(symboles, paire)
    return list(symboles)

FUSIONS = [("e", "r"), ("l", "o"), ("lo", "w"), ("n", "e"), ("ne", "w")]

def compter_tokens(texte, fusions):
    ...

def mot_le_plus_cher(texte, fusions):
    ...

print(compter_tokens("new lower generation", FUSIONS))
print(mot_le_plus_cher("new lower generation", FUSIONS))`,
              solution: `def fusionner_mot(mot, paire):
    nouveau, i = [], 0
    while i < len(mot):
        if i < len(mot) - 1 and (mot[i], mot[i+1]) == paire:
            nouveau.append(mot[i] + mot[i+1]); i += 2
        else:
            nouveau.append(mot[i]); i += 1
    return tuple(nouveau)

def encoder_mot(mot, fusions):
    symboles = tuple(mot)
    for paire in fusions:
        symboles = fusionner_mot(symboles, paire)
    return list(symboles)

FUSIONS = [("e", "r"), ("l", "o"), ("lo", "w"), ("n", "e"), ("ne", "w")]

def compter_tokens(texte, fusions):
    return sum(len(encoder_mot(m, fusions)) for m in texte.split())

def mot_le_plus_cher(texte, fusions):
    mots = texte.split()
    if not mots:
        return ""
    return max(mots, key=lambda m: len(encoder_mot(m, fusions)))

print(compter_tokens("new lower generation", FUSIONS))
print(mot_le_plus_cher("new lower generation", FUSIONS))`,
              tests: `assert compter_tokens("new", FUSIONS) == 1, "'new' entièrement fusionné"
assert compter_tokens("new lower", FUSIONS) == 1 + 2, "new (1) + low/er (2)"
assert compter_tokens("", FUSIONS) == 0, "Texte vide : 0"
assert mot_le_plus_cher("new lower generation", FUSIONS) == "generation", "Mot hors distribution : le plus coûteux"
assert mot_le_plus_cher("new new", FUSIONS) == "new", "Égalité : le premier"
print("TESTS_PASS")`,
              hints: [
                'sum(len(encoder_mot(m, fusions)) for m in texte.split()).',
                'max avec key=lambda m: len(encoder_mot(m, fusions)).',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm8l3e3',
              title: "Défi — Le comparateur multilingue",
              instructions: `Le livrable du comité d'architecture : \`comparer_langues(textes, fusions)\` où \`textes\` est un dict \`langue → texte\`, renvoie un dict \`langue → fertilité\` (tokens / mots, arrondie à 2 décimales), et \`langue_la_plus_chere(textes, fusions)\` renvoie le nom de la langue à la fertilité maximale.

Avec le mini-BPE « anglophone » fourni, l'anglais sortira avantagé — la démonstration exacte du biais de tokenisation dont on parle dans les vrais arbitrages multilingues.`,
              starterCode: `def fusionner_mot(mot, paire):
    nouveau, i = [], 0
    while i < len(mot):
        if i < len(mot) - 1 and (mot[i], mot[i+1]) == paire:
            nouveau.append(mot[i] + mot[i+1]); i += 2
        else:
            nouveau.append(mot[i]); i += 1
    return tuple(nouveau)

def encoder_mot(mot, fusions):
    symboles = tuple(mot)
    for paire in fusions:
        symboles = fusionner_mot(symboles, paire)
    return list(symboles)

FUSIONS = [("e", "r"), ("t", "h"), ("th", "e"), ("i", "n"), ("in", "g"), ("n", "e"), ("ne", "w")]

def comparer_langues(textes, fusions):
    ...

def langue_la_plus_chere(textes, fusions):
    ...

TEXTES = {"anglais": "the new thing", "islandais": "nyja hluturinn hennar"}
print(comparer_langues(TEXTES, FUSIONS))
print(langue_la_plus_chere(TEXTES, FUSIONS))`,
              solution: `def fusionner_mot(mot, paire):
    nouveau, i = [], 0
    while i < len(mot):
        if i < len(mot) - 1 and (mot[i], mot[i+1]) == paire:
            nouveau.append(mot[i] + mot[i+1]); i += 2
        else:
            nouveau.append(mot[i]); i += 1
    return tuple(nouveau)

def encoder_mot(mot, fusions):
    symboles = tuple(mot)
    for paire in fusions:
        symboles = fusionner_mot(symboles, paire)
    return list(symboles)

FUSIONS = [("e", "r"), ("t", "h"), ("th", "e"), ("i", "n"), ("in", "g"), ("n", "e"), ("ne", "w")]

def fertilite(texte, fusions):
    mots = texte.split()
    tokens = sum(len(encoder_mot(m, fusions)) for m in mots)
    return round(tokens / len(mots), 2)

def comparer_langues(textes, fusions):
    return {langue: fertilite(t, fusions) for langue, t in textes.items()}

def langue_la_plus_chere(textes, fusions):
    fertilites = comparer_langues(textes, fusions)
    return max(fertilites, key=fertilites.get)

TEXTES = {"anglais": "the new thing", "islandais": "nyja hluturinn hennar"}
print(comparer_langues(TEXTES, FUSIONS))
print(langue_la_plus_chere(TEXTES, FUSIONS))`,
              tests: `_r = comparer_langues({"anglais": "the new thing", "islandais": "nyja hluturinn hennar"}, FUSIONS)
assert _r["anglais"] < _r["islandais"], "Le BPE 'anglophone' avantage l'anglais — le biais de tokenisation, démontré"
assert _r["anglais"] == round((1 + 1 + 2) / 3, 2), "the (1) + new (1) + th/ing (2)"
assert langue_la_plus_chere({"anglais": "the new thing", "islandais": "nyja hluturinn hennar"}, FUSIONS) == "islandais", "La langue la plus chère"
_solo = comparer_langues({"x": "the the"}, FUSIONS)
assert _solo == {"x": 1.0}, "Fertilité parfaite : 1 token par mot"
print("TESTS_PASS")`,
              hints: [
                'Une fonction fertilite(texte) interne, puis une dict comprehension par langue.',
                'max(dict, key=dict.get) renvoie la clé du maximum.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi rejouer les fusions dans leur ordre d\'apprentissage exact ?',
                options: [
                  'Pour la vitesse',
                  'Le modèle a été entraîné sur des séquences produites par CET ordre : tout autre ordre produit des tokens que le modèle n\'a jamais vus',
                  'Python impose l\'ordre des listes',
                  'L\'ordre n\'a en fait aucune importance',
                ],
                correct: 1,
                explanation: 'Tokenizer et modèle forment un couple indissociable. Utiliser le mauvais tokenizer (ou la mauvaise version) avec un modèle donne des résultats dégradés de façon silencieuse — un bug classique et vicieux en production.',
              },
              {
                question: 'Un tokenizer a une fertilité de 1.2 en anglais et 2.8 en swahili. Conséquence pratique ?',
                options: [
                  'Aucune, seule la qualité du modèle compte',
                  'À texte égal, le swahili consomme ~2,3× plus de tokens : coût API plus élevé, fenêtre de contexte effective réduite, génération plus lente',
                  'Le swahili est mieux compris',
                  'Le tokenizer refusera le swahili',
                ],
                correct: 1,
                explanation: 'La fertilité se paie trois fois : en argent (facturation au token), en contexte (la fenêtre se remplit plus vite) et en latence. Un critère de choix de modèle très concret pour les applications multilingues.',
              },
            ],
          },
        ],
      },
    ],
  }
