import type { Module } from '@/lib/types'

export const m2: Module = {
    id: 'm2',
    tier: 1,
    title: 'Fonctions, pipelines et objets',
    tagline: 'Structurer son code comme un vrai pipeline NLP : fonctions, comprehensions, classes.',
    status: 'ready',
    lessons: [
      {
        id: 'm2l1',
        title: 'Fonctions et list comprehensions',
        minutes: 30,
        sections: [
          {
            kind: 'text',
            md: `# Du script au pipeline

Un pipeline NLP réel, c'est une suite d'étapes : *nettoyer → tokeniser → filtrer → vectoriser*. Chaque étape mérite sa **fonction** : testable, réutilisable, remplaçable.

## Fonctions : les bons réflexes

\`\`\`
def tokeniser(texte, sep=" "):
    """Découpe un texte en tokens."""     # docstring
    return texte.lower().split(sep)
\`\`\`

- Paramètres avec **valeur par défaut** (\`sep=" "\`)
- Une fonction = une responsabilité
- Toujours un \`return\` explicite

## List comprehensions

La manière pythonique de transformer et filtrer des listes — omniprésente dans le code de préparation de données :

\`\`\`
tokens = ["le", "transformer", "est", "une", "architecture"]

longs = [t for t in tokens if len(t) > 3]      # filtrer
majs  = [t.upper() for t in tokens]            # transformer
ids   = [vocab[t] for t in tokens if t in vocab]  # les deux
\`\`\`

## La syntaxe complète des comprehensions

\`\`\`
[expression for element in iterable]                  # transformer
[expression for element in iterable if condition]     # transformer + filtrer
{cle: valeur for element in iterable}                 # dict comprehension
{expression for element in iterable}                  # set comprehension
\`\`\`

Les deux dernières sont moins connues et pourtant précieuses en NLP : \`{mot: len(mot) for mot in tokens}\` construit un index en une ligne, \`{t.lower() for t in tokens}\` déduplique en normalisant.

## Stopwords : filtrer le bruit

Les mots très fréquents mais peu informatifs (« le », « de », « et »…) sont appelés **stopwords**. Les retirer est une étape classique en recherche d'information — même si les LLM modernes, eux, gardent tout : leur tokenizer ne jette rien, c'est le mécanisme d'attention qui apprend à pondérer.

## Pièges classiques

- **La comprehension illisible** : au-delà de deux \`for\` ou d'une condition complexe, reviens à une boucle claire. La lisibilité prime — ton code sera relu (par les autres et par toi dans 6 mois).
- **Modifier une liste en la parcourant** : ne fais jamais \`tokens.remove(...)\` dans un \`for t in tokens\` — construis une nouvelle liste filtrée à la place. C'est exactement ce que fait la comprehension avec \`if\`.
- **Fonction sans return** : elle renvoie \`None\` silencieusement, et l'erreur explose trois lignes plus loin chez l'appelant.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm2l1e1',
              title: 'Un tokenizer avec filtrage de stopwords',
              instructions: `Écris \`tokeniser(texte, stopwords)\` qui :

1. met le texte en minuscules et le découpe sur les espaces,
2. retire la ponctuation \`.\`, \`,\`, \`!\` et \`?\` collée aux mots (indice : \`.strip(".,!?")\`),
3. élimine les tokens présents dans l'ensemble \`stopwords\` **et** les tokens vides.

Renvoie la liste des tokens restants. Une seule list comprehension bien construite peut suffire (avec une étape intermédiaire pour le strip).`,
              starterCode: `def tokeniser(texte, stopwords):
    ...

STOP = {"le", "la", "les", "de", "et", "un", "une", "est"}
print(tokeniser("Le Transformer est une architecture de réseau !", STOP))`,
              solution: `def tokeniser(texte, stopwords):
    bruts = texte.lower().split()
    nettoyes = [t.strip(".,!?") for t in bruts]
    return [t for t in nettoyes if t and t not in stopwords]

STOP = {"le", "la", "les", "de", "et", "un", "une", "est"}
print(tokeniser("Le Transformer est une architecture de réseau !", STOP))`,
              tests: `STOP2 = {"le", "la", "et", "est"}
assert tokeniser("Le chat est noir.", STOP2) == ["chat", "noir"], "Attendu : ['chat', 'noir']"
assert tokeniser("Et le vent ! ", STOP2) == ["vent"], "Attendu : ['vent'] — attention à la ponctuation isolée"
assert tokeniser("", STOP2) == [], "Un texte vide donne une liste vide"
print("TESTS_PASS")`,
              hints: [
                't.strip(".,!?") retire ces caractères au début et à la fin du token.',
                'Un "!" isolé devient une chaîne vide après strip — le test "if t" l\'élimine (chaîne vide = False).',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm2l1e2',
              title: "Dict et set comprehensions à l'œuvre",
              instructions: `Deux outils d'indexation en une ligne chacun :

1. \`longueurs(tokens)\` — un dict \`token → longueur\` (dict comprehension ; les doublons s'écrasent, c'est voulu),
2. \`compter_par_longueur(tokens)\` — un dict \`longueur → nombre de tokens de cette longueur\` (le motif de comptage, mais avec des clés numériques),
3. \`vocabulaire_normalise(tokens)\` — le **set** des tokens en minuscules.`,
              starterCode: `def longueurs(tokens):
    ...

def compter_par_longueur(tokens):
    ...

def vocabulaire_normalise(tokens):
    ...

tokens = ["Le", "chat", "dort", "le", "CHAT"]
print(longueurs(tokens))
print(compter_par_longueur(tokens))
print(vocabulaire_normalise(tokens))`,
              solution: `def longueurs(tokens):
    return {t: len(t) for t in tokens}

def compter_par_longueur(tokens):
    comptes = {}
    for t in tokens:
        comptes[len(t)] = comptes.get(len(t), 0) + 1
    return comptes

def vocabulaire_normalise(tokens):
    return {t.lower() for t in tokens}

tokens = ["Le", "chat", "dort", "le", "CHAT"]
print(longueurs(tokens))
print(compter_par_longueur(tokens))
print(vocabulaire_normalise(tokens))`,
              tests: `assert longueurs(["ia", "nlp"]) == {"ia": 2, "nlp": 3}, "token → longueur"
assert longueurs([]) == {}, "Liste vide : dict vide"
assert compter_par_longueur(["ia", "le", "nlp"]) == {2: 2, 3: 1}, "2 tokens de longueur 2, 1 de longueur 3"
assert vocabulaire_normalise(["Le", "le", "CHAT"]) == {"le", "chat"}, "Un set : unicité après normalisation"
assert vocabulaire_normalise([]) == set(), "Liste vide : set vide"
print("TESTS_PASS")`,
              hints: [
                'longueurs : {t: len(t) for t in tokens} — c\'est tout.',
                'compter_par_longueur : le motif get(clé, 0) + 1, avec len(t) comme clé.',
                'vocabulaire_normalise : accolades sans les deux-points = set comprehension.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm2l1e3',
              title: "Défi — Vecteur de features d'un texte",
              instructions: `Avant les embeddings, on décrivait un texte par des *features* calculées à la main — et on le fait encore pour les baselines et le monitoring. Écris \`extraire_features(texte, stopwords)\` qui renvoie :

- \`"nb_tokens"\` : nombre total de tokens (minuscules, split),
- \`"nb_informatifs"\` : tokens hors stopwords,
- \`"ratio_informatif"\` : informatifs / total, arrondi à 2 décimales (\`0.0\` si vide),
- \`"longueur_max"\` : longueur du plus long token (\`0\` si vide).

Une seule contrainte de style : utilise au moins une comprehension.`,
              starterCode: `STOP = {"le", "la", "les", "de", "et", "un", "une"}

def extraire_features(texte, stopwords):
    ...

print(extraire_features("Le chat et le chien de la maison", STOP))`,
              solution: `STOP = {"le", "la", "les", "de", "et", "un", "une"}

def extraire_features(texte, stopwords):
    tokens = texte.lower().split()
    informatifs = [t for t in tokens if t not in stopwords]
    return {
        "nb_tokens": len(tokens),
        "nb_informatifs": len(informatifs),
        "ratio_informatif": round(len(informatifs) / len(tokens), 2) if tokens else 0.0,
        "longueur_max": max((len(t) for t in tokens), default=0),
    }

print(extraire_features("Le chat et le chien de la maison", STOP))`,
              tests: `_f = extraire_features("Le chat et le chien de la maison", STOP)
assert _f["nb_tokens"] == 8, "8 tokens au total"
assert _f["nb_informatifs"] == 3, "chat, chien, maison"
assert _f["ratio_informatif"] == round(3 / 8, 2), "Ratio arrondi à 2 décimales"
assert _f["longueur_max"] == 6, "'maison' fait 6 caractères"
_v = extraire_features("", STOP)
assert _v == {"nb_tokens": 0, "nb_informatifs": 0, "ratio_informatif": 0.0, "longueur_max": 0}, "Texte vide : tout à zéro"
print("TESTS_PASS")`,
              hints: [
                'Une comprehension filtre les informatifs ; le reste est du comptage.',
                'max(..., default=0) évite l\'erreur sur une séquence vide.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Que produit [len(t) for t in ["ia", "nlp", "llm"]] ?',
                options: ['[2, 3, 3]', '["ia", "nlp", "llm"]', '8', 'Une erreur'],
                correct: 0,
                explanation: 'La comprehension applique len() à chaque élément : [2, 3, 3]. Transformer une liste élément par élément est le geste de base de la préparation de données.',
              },
              {
                question: 'Pourquoi les tokenizers des LLM modernes ne retirent-ils PAS les stopwords ?',
                options: [
                  'Par paresse des concepteurs',
                  'Parce que le mécanisme d\'attention apprend lui-même à pondérer l\'importance de chaque token',
                  'Parce que les stopwords n\'existent plus',
                  'Pour augmenter la facture de calcul',
                ],
                correct: 1,
                explanation: 'Les LLM gardent l\'intégralité du texte : « ne… pas », les articles, la ponctuation portent du sens. L\'attention (palier 3 !) apprend quoi regarder.',
              },
            ],
          },
        ],
      },
      {
        id: 'm2l2',
        title: 'Classes : construire un vrai Tokenizer',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Pourquoi des classes en NLP ?

Quand tu utilises Hugging Face, tu écris \`tokenizer = AutoTokenizer.from_pretrained(...)\` puis \`tokenizer.encode(texte)\`. Ce \`tokenizer\` est un **objet** : il réunit au même endroit des *données* (le vocabulaire appris) et des *comportements* (encoder, décoder). C'est exactement ce que permet une **classe** — un moule qui regroupe état et actions. Aujourd'hui, tu construis le tien, et tu comprendras de l'intérieur tous les outils que tu utilises.

## L'intuition : un moule et ses exemplaires

Une classe est un *plan de fabrication* ; chaque objet créé à partir d'elle est une *instance*, avec son propre état. Deux tokenizers fabriqués depuis la même classe ont chacun leur vocabulaire — l'un peut être français, l'autre anglais, sans interférence.

## Anatomie d'une classe

\`\`\`
class Tokenizer:
    def __init__(self):          # le constructeur, appelé à la création
        self.vocab = {}          # l'état interne : mot -> identifiant

    def fit(self, texte):        # apprendre le vocabulaire
        for mot in texte.lower().split():
            if mot not in self.vocab:
                self.vocab[mot] = len(self.vocab)

    def encode(self, texte):     # transformer un texte en liste d'ids
        ...
\`\`\`

Le mot \`self\` désigne *l'instance courante* : \`self.vocab\` est le vocabulaire de CE tokenizer précis. Chaque méthode reçoit \`self\` en premier paramètre — c'est ainsi que l'objet accède à son propre état.

L'interface en trois temps **\`fit\` / \`encode\` / \`decode\`** n'est pas arbitraire : c'est *exactement* celle des vrais outils (scikit-learn, les tokenizers de Hugging Face). La maîtriser te rend capable d'en écrire, mais surtout de lire et déboguer ceux des autres.

## Le token inconnu : \`<unk>\`

Que faire d'un mot jamais vu à l'entraînement ? Les vocabulaires réels réservent un identifiant spécial \`<unk>\` (unknown). Les tokenizers modernes (BPE, module 8) réduisent le besoin de \`<unk>\` en découpant les mots inconnus en sous-mots — mais le concept de **token spécial** (\`<unk>\`, \`<pad>\` pour le remplissage, \`<eos>\` pour la fin de séquence…) reste central dans tous les LLM. Réserver l'identifiant \`0\` à \`<unk>\` est une convention commode.

## Les méthodes spéciales : parler le langage de Python

Les méthodes encadrées de doubles underscores (les *dunder*) branchent ta classe sur la syntaxe du langage :

\`\`\`
def __len__(self):            # active len(tokenizer)
    return len(self.vocab)

def __contains__(self, mot):  # active : "chat" in tokenizer
    return mot in self.vocab
\`\`\`

C'est grâce à elles que \`len(dataset)\`, \`model in registry\` ou \`print(config)\` fonctionnent sur les objets des bibliothèques ML : leurs auteurs ont implémenté ces méthodes. Les connaître, c'est savoir concevoir des API naturelles à utiliser.

## Pièges classiques

- **Oublier \`self\`.** Écrire \`vocab\` au lieu de \`self.vocab\` dans une méthode crée une variable locale qui disparaît aussitôt — l'état de l'objet n'est jamais modifié. Erreur numéro un des débutants en POO.
- **Partager un état mutable entre instances.** Ne mets jamais \`def __init__(self, vocab={})\` : le dictionnaire par défaut serait *partagé* par toutes les instances. Initialise l'état DANS \`__init__\` (\`self.vocab = {}\`).
- **Un \`decode\` fragile.** Recevoir un identifiant absent du vocabulaire est inévitable en production (fichier corrompu, mauvaise version). Décide explicitement : lever une erreur claire, ou dégrader vers \`<unk>\`. Le crash cryptique trois couches plus loin est la pire option.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm2l2e1',
              title: 'Ton premier Tokenizer complet',
              instructions: `Complète la classe \`Tokenizer\` :

- \`__init__\` : initialise \`self.vocab = {"<unk>": 0}\`
- \`fit(texte)\` : ajoute chaque mot (minuscules, split espace) au vocab avec l'id suivant (\`len(self.vocab)\`), sans doublons
- \`encode(texte)\` : renvoie la liste des ids ; un mot inconnu → id de \`"<unk>"\` (0)
- \`decode(ids)\` : renvoie la chaîne des mots correspondants séparés par des espaces (construis un dict inverse id → mot)`,
              starterCode: `class Tokenizer:
    def __init__(self):
        ...

    def fit(self, texte):
        ...

    def encode(self, texte):
        ...

    def decode(self, ids):
        ...

tok = Tokenizer()
tok.fit("le chat dort")
print(tok.vocab)
print(tok.encode("le chien dort"))
print(tok.decode([1, 3]))`,
              solution: `class Tokenizer:
    def __init__(self):
        self.vocab = {"<unk>": 0}

    def fit(self, texte):
        for mot in texte.lower().split():
            if mot not in self.vocab:
                self.vocab[mot] = len(self.vocab)

    def encode(self, texte):
        return [self.vocab.get(m, 0) for m in texte.lower().split()]

    def decode(self, ids):
        inverse = {i: m for m, i in self.vocab.items()}
        return " ".join(inverse[i] for i in ids)

tok = Tokenizer()
tok.fit("le chat dort")
print(tok.vocab)
print(tok.encode("le chien dort"))
print(tok.decode([1, 3]))`,
              tests: `t = Tokenizer()
t.fit("le chat dort")
assert t.vocab == {"<unk>": 0, "le": 1, "chat": 2, "dort": 3}, "Le vocab doit contenir <unk> puis les mots dans l'ordre d'apparition"
assert t.encode("le chat") == [1, 2], "encode('le chat') devrait donner [1, 2]"
assert t.encode("le dragon dort") == [1, 0, 3], "Un mot inconnu doit donner l'id 0 (<unk>)"
assert t.decode([2, 3]) == "chat dort", "decode([2, 3]) devrait donner 'chat dort'"
t.fit("le chat mange")
assert t.vocab["mange"] == 4, "fit() ne doit pas dupliquer les mots déjà connus"
print("TESTS_PASS")`,
              hints: [
                'Dans fit : if mot not in self.vocab: self.vocab[mot] = len(self.vocab).',
                'Dans encode : self.vocab.get(mot, 0) gère les inconnus sans if.',
                'Dans decode : {i: m for m, i in self.vocab.items()} inverse le dictionnaire.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm2l2e2',
              title: "Un Tokenizer professionnel : dunder et robustesse",
              instructions: `Le starter fournit le Tokenizer de l'exercice précédent, déjà rempli. Ajoute-lui :

1. \`__len__(self)\` — la taille du vocabulaire (active \`len(tok)\`),
2. \`__contains__(self, mot)\` — teste l'appartenance au vocab (active \`"chat" in tok\`),
3. \`decode_robuste(self, ids)\` — comme decode, mais un id **inconnu** produit le texte \`<unk>\` au lieu de crasher (indice : \`inverse.get(i, "<unk>")\`).`,
              starterCode: `class Tokenizer:
    def __init__(self):
        self.vocab = {"<unk>": 0}

    def fit(self, texte):
        for mot in texte.lower().split():
            if mot not in self.vocab:
                self.vocab[mot] = len(self.vocab)

    def encode(self, texte):
        return [self.vocab.get(m, 0) for m in texte.lower().split()]

    # --- à toi de jouer ---
    def __len__(self):
        ...

    def __contains__(self, mot):
        ...

    def decode_robuste(self, ids):
        ...

tok = Tokenizer()
tok.fit("le chat dort")
print(len(tok))
print("chat" in tok, "dragon" in tok)
print(tok.decode_robuste([1, 2, 99]))`,
              solution: `class Tokenizer:
    def __init__(self):
        self.vocab = {"<unk>": 0}

    def fit(self, texte):
        for mot in texte.lower().split():
            if mot not in self.vocab:
                self.vocab[mot] = len(self.vocab)

    def encode(self, texte):
        return [self.vocab.get(m, 0) for m in texte.lower().split()]

    def __len__(self):
        return len(self.vocab)

    def __contains__(self, mot):
        return mot in self.vocab

    def decode_robuste(self, ids):
        inverse = {i: m for m, i in self.vocab.items()}
        return " ".join(inverse.get(i, "<unk>") for i in ids)

tok = Tokenizer()
tok.fit("le chat dort")
print(len(tok))
print("chat" in tok, "dragon" in tok)
print(tok.decode_robuste([1, 2, 99]))`,
              tests: `_t = Tokenizer()
_t.fit("le chat dort")
assert len(_t) == 4, "len(tok) : <unk> + 3 mots = 4"
assert "chat" in _t, "'chat' in tok doit fonctionner (méthode __contains__)"
assert "dragon" not in _t, "'dragon' n'est pas dans le vocab"
assert _t.decode_robuste([1, 2]) == "le chat", "Décodage normal"
assert _t.decode_robuste([1, 99]) == "le <unk>", "Un id inconnu devient <unk> — pas de crash !"
assert _t.decode_robuste([]) == "", "Liste vide : chaîne vide"
print("TESTS_PASS")`,
              hints: [
                '__len__ et __contains__ délèguent simplement à self.vocab.',
                'decode_robuste : construis le dict inverse, puis inverse.get(i, "<unk>") pour chaque id.',
                '" ".join(...) d\'une liste vide donne "" — le cas vide est gratuit.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm2l2e3',
              title: "Défi — Vocabulaire avec fréquence minimale",
              instructions: `Les vrais vocabulaires écartent les mots trop rares (bruit, fautes de frappe) : c'est le paramètre \`min_freq\` qu'on retrouve dans tous les outils. Complète \`TokenizerFiltre\` :

- \`fit(texte, freq_min=1)\` : compte d'abord TOUS les mots, puis n'ajoute au vocab que ceux apparaissant au moins \`freq_min\` fois (dans l'ordre de première apparition dans le texte),
- \`encode(texte)\` : comme d'habitude, inconnus → 0.

Deux passes sur les données : compter, puis construire — un motif extrêmement courant en préparation de données.`,
              starterCode: `class TokenizerFiltre:
    def __init__(self):
        self.vocab = {"<unk>": 0}

    def fit(self, texte, freq_min=1):
        ...

    def encode(self, texte):
        return [self.vocab.get(m, 0) for m in texte.lower().split()]

tok = TokenizerFiltre()
tok.fit("le chat le chien le chat perdu", freq_min=2)
print(tok.vocab)
print(tok.encode("le chat perdu"))`,
              solution: `class TokenizerFiltre:
    def __init__(self):
        self.vocab = {"<unk>": 0}

    def fit(self, texte, freq_min=1):
        mots = texte.lower().split()
        comptes = {}
        for m in mots:
            comptes[m] = comptes.get(m, 0) + 1
        for m in mots:
            if comptes[m] >= freq_min and m not in self.vocab:
                self.vocab[m] = len(self.vocab)

    def encode(self, texte):
        return [self.vocab.get(m, 0) for m in texte.lower().split()]

tok = TokenizerFiltre()
tok.fit("le chat le chien le chat perdu", freq_min=2)
print(tok.vocab)
print(tok.encode("le chat perdu"))`,
              tests: `_t = TokenizerFiltre()
_t.fit("le chat le chien le chat perdu", freq_min=2)
assert _t.vocab == {"<unk>": 0, "le": 1, "chat": 2}, "Seuls 'le' (3x) et 'chat' (2x) passent le seuil de 2"
assert _t.encode("le chat perdu") == [1, 2, 0], "'perdu' (1 occurrence) est devenu <unk>"
_t2 = TokenizerFiltre()
_t2.fit("a b a", freq_min=1)
assert _t2.vocab == {"<unk>": 0, "a": 1, "b": 2}, "freq_min=1 : tout le monde entre, ordre de première apparition"
_t3 = TokenizerFiltre()
_t3.fit("x y z", freq_min=5)
assert _t3.vocab == {"<unk>": 0}, "Seuil trop haut : vocab réduit à <unk>"
print("TESTS_PASS")`,
              hints: [
                'Première passe : le motif de comptage. Deuxième passe : re-parcourir les mots DANS L\'ORDRE et filtrer sur comptes[m].',
                'Le "m not in self.vocab" évite les doublons lors de la deuxième passe.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Dans une classe Python, que représente self ?',
                options: [
                  'La classe elle-même',
                  'L\'instance sur laquelle la méthode est appelée',
                  'Un mot-clé réservé sans signification',
                  'Le module courant',
                ],
                correct: 1,
                explanation: 'self est l\'objet concret : deux tokenizers différents ont chacun leur self.vocab. C\'est ce qui permet d\'avoir un tokenizer français et un anglais côte à côte.',
              },
              {
                question: 'À quoi sert le token spécial <unk> ?',
                options: [
                  'À marquer la fin d\'une phrase',
                  'À représenter les mots absents du vocabulaire',
                  'À séparer deux documents',
                  'À compresser le texte',
                ],
                correct: 1,
                explanation: 'Sans <unk>, encoder un mot jamais vu lèverait une erreur. Les tokenizers BPE modernes réduisent le besoin de <unk> en découpant en sous-mots, mais les tokens spéciaux (<pad>, <eos>…) restent partout.',
              },
            ],
          },
        ],
      },
      {
        id: 'm2l3',
        title: 'Les fonctions comme objets : pipelines composables',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Le secret des bibliothèques élégantes

En Python, une fonction est un objet comme un autre : on peut la stocker dans une variable, la mettre dans une liste, la passer en argument. C'est ce qui rend possibles les API que tu utiliseras partout — \`map\`, \`sorted(key=...)\`, les \`Dataset.map()\` de Hugging Face, les chaînes de LangChain.

## Fonctions en argument

\`\`\`
def appliquer(fonction, elements):
    return [fonction(e) for e in elements]

appliquer(str.lower, ["A", "B"])     # ['a', 'b']
appliquer(len, ["chat", "il"])       # [4, 2]
\`\`\`

## Le pipeline : une liste d'étapes

Un pipeline de prétraitement NLP est *littéralement* une liste de fonctions appliquées dans l'ordre :

\`\`\`
etapes = [retirer_html, minuscules, corriger_espaces]

def executer(etapes, texte):
    for etape in etapes:
        texte = etape(texte)
    return texte
\`\`\`

Ajouter une étape = ajouter un élément à la liste. Tester une étape = tester une fonction pure. C'est exactement l'architecture des \`Pipeline\` de scikit-learn et des chaînes de traitement de spaCy.

## Composer : fabriquer une fonction à partir de fonctions

Plus fort : une fonction qui *renvoie* une fonction. \`composer([f, g, h])\` fabrique une nouvelle fonction équivalente à \`h(g(f(x)))\` — le pipeline devient un objet réutilisable qu'on passe où on veut.

## Les closures : des fonctions configurées

Quand une fonction interne utilise les variables de la fonction qui l'a créée, Python les « capture » — c'est une **closure** (fermeture). Ça permet de construire des *fabriques de fonctions* :

\`\`\`
def fabriquer_filtre(longueur_mini):
    def filtre(tokens):
        return [t for t in tokens if len(t) >= longueur_mini]
    return filtre

filtre_3 = fabriquer_filtre(3)     # une fonction configurée avec mini=3
filtre_5 = fabriquer_filtre(5)     # une autre, indépendante
\`\`\`

Chaque fonction fabriquée « se souvient » de sa configuration, sans classe ni variable globale. C'est exactement le mécanisme derrière les décorateurs (module 4) et derrière beaucoup d'API de bibliothèques : \`partial\`, les schedulers d'entraînement, les transforms de torchvision…

## Pièges classiques

- \`return pipeline()\` au lieu de \`return pipeline\` : tu exécutes au lieu de renvoyer la fonction.
- Modifier une variable capturée depuis la closure demande \`nonlocal\` — si tu en arrives là, une classe est souvent plus claire.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm2l3e1',
              title: 'Fabrique de pipelines',
              instructions: `Implémente :

1. \`executer(etapes, texte)\` — applique chaque fonction de la liste \`etapes\` au texte, dans l'ordre,
2. \`composer(etapes)\` — renvoie une **nouvelle fonction** qui, appelée avec un texte, exécute le pipeline (définis une fonction interne et renvoie-la),
3. crée \`pipeline_standard\` : la composition de \`minuscules\`, \`sans_ponctuation\`, \`espaces_propres\` (fournies).`,
              starterCode: `def minuscules(t):
    return t.lower()

def sans_ponctuation(t):
    for c in ".,!?;:":
        t = t.replace(c, "")
    return t

def espaces_propres(t):
    return " ".join(t.split())

def executer(etapes, texte):
    ...

def composer(etapes):
    ...

pipeline_standard = ...

print(executer([minuscules, espaces_propres], "  Bonjour  LE Monde "))
print(pipeline_standard("  Salut, toi !  Ça va ?  "))`,
              solution: `def minuscules(t):
    return t.lower()

def sans_ponctuation(t):
    for c in ".,!?;:":
        t = t.replace(c, "")
    return t

def espaces_propres(t):
    return " ".join(t.split())

def executer(etapes, texte):
    for etape in etapes:
        texte = etape(texte)
    return texte

def composer(etapes):
    def pipeline(texte):
        return executer(etapes, texte)
    return pipeline

pipeline_standard = composer([minuscules, sans_ponctuation, espaces_propres])

print(executer([minuscules, espaces_propres], "  Bonjour  LE Monde "))
print(pipeline_standard("  Salut, toi !  Ça va ?  "))`,
              tests: `assert executer([minuscules], "ABC") == "abc", "Une seule étape"
assert executer([minuscules, espaces_propres], "  A  B ") == "a b", "Les étapes s'enchaînent dans l'ordre"
assert executer([], "Tel Quel") == "Tel Quel", "Zéro étape : texte inchangé"
_p = composer([minuscules, sans_ponctuation])
assert callable(_p), "composer doit renvoyer une FONCTION"
assert _p("Hé!") == "hé", "La fonction composée applique bien les étapes"
assert pipeline_standard("  Salut, toi !  Ça va ?  ") == "salut toi ça va", "Le pipeline standard complet"
_double = composer([pipeline_standard, minuscules])
assert _double(" X. ") == "x", "Un pipeline composé peut lui-même être une étape d'un autre pipeline !"
print("TESTS_PASS")`,
              hints: [
                'executer : une boucle qui réaffecte texte = etape(texte).',
                'composer : def pipeline(texte): return executer(etapes, texte) — puis return pipeline (sans parenthèses !).',
                'pipeline_standard = composer([minuscules, sans_ponctuation, espaces_propres]).',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm2l3e2',
              title: "Fabriques de fonctions (closures)",
              instructions: `Construis deux fabriques :

1. \`fabriquer_filtre_longueur(mini)\` — renvoie une fonction \`f(tokens)\` qui garde les tokens de longueur ≥ \`mini\`,
2. \`fabriquer_remplaceur(ancien, nouveau)\` — renvoie une fonction \`f(texte)\` qui remplace \`ancien\` par \`nouveau\`,
3. utilise-les avec \`composer\` (fourni) pour créer \`pipeline\` : d'abord remplacer \`"‑"\` (tiret) par \`" "\`, puis découper (\`str.split\` fourni comme étape), puis filtrer les tokens de moins de 3 lettres.

Note : chaque étape du pipeline reçoit la sortie de la précédente — ici str → str → liste → liste.`,
              starterCode: `def composer(etapes):
    def pipeline(x):
        for e in etapes:
            x = e(x)
        return x
    return pipeline

def fabriquer_filtre_longueur(mini):
    ...

def fabriquer_remplaceur(ancien, nouveau):
    ...

decouper = str.split   # une méthode utilisée comme fonction !

pipeline = composer([
    fabriquer_remplaceur("-", " "),
    decouper,
    fabriquer_filtre_longueur(3),
])
print(pipeline("micro-service de auto-complétion en temps-réel"))`,
              solution: `def composer(etapes):
    def pipeline(x):
        for e in etapes:
            x = e(x)
        return x
    return pipeline

def fabriquer_filtre_longueur(mini):
    def filtre(tokens):
        return [t for t in tokens if len(t) >= mini]
    return filtre

def fabriquer_remplaceur(ancien, nouveau):
    def remplacer(texte):
        return texte.replace(ancien, nouveau)
    return remplacer

decouper = str.split

pipeline = composer([
    fabriquer_remplaceur("-", " "),
    decouper,
    fabriquer_filtre_longueur(3),
])
print(pipeline("micro-service de auto-complétion en temps-réel"))`,
              tests: `_f3 = fabriquer_filtre_longueur(3)
assert callable(_f3), "La fabrique doit renvoyer une FONCTION"
assert _f3(["a", "ab", "abc", "abcd"]) == ["abc", "abcd"], "Garde les tokens de longueur >= 3"
_f5 = fabriquer_filtre_longueur(5)
assert _f5(["abc", "abcde"]) == ["abcde"], "Chaque fonction fabriquée garde SA configuration"
assert _f3(["abc"]) == ["abc"], "Les deux filtres sont indépendants"
_r = fabriquer_remplaceur("a", "o")
assert _r("chat") == "chot", "Remplacement configuré"
_p = composer([fabriquer_remplaceur("-", " "), str.split, fabriquer_filtre_longueur(3)])
assert _p("temps-réel ok") == ["temps", "réel"], "Le pipeline complet : remplacer, découper, filtrer ('ok' trop court)"
print("TESTS_PASS")`,
              hints: [
                'Le schéma : def fabrique(config): / def interne(x): … utilise config … / return interne.',
                'Sans parenthèses dans le return — on renvoie la fonction, on ne l\'appelle pas.',
                'Chaque appel à la fabrique crée une closure indépendante avec sa propre config.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm2l3e3',
              title: "Défi — Pipeline piloté par configuration",
              instructions: `En production, le pipeline de chaque projet est décrit par une **config** (un dict, souvent chargé d'un YAML/JSON). Écris \`construire_pipeline(config)\` qui assemble dynamiquement les étapes selon les clés :

- \`"minuscules": True\` → ajoute une étape \`str.lower\`,
- \`"decouper": True\` → ajoute \`str.split\` (après minuscules !),
- \`"min_longueur": n\` (si n > 0) → ajoute un filtre gardant les tokens de longueur ≥ n.

Renvoie la fonction composée (utilise \`composer\` et \`fabriquer_filtre_longueur\`, fournis). Une config vide doit produire un pipeline identité.`,
              starterCode: `def composer(etapes):
    def pipeline(x):
        for e in etapes:
            x = e(x)
        return x
    return pipeline

def fabriquer_filtre_longueur(mini):
    def filtre(tokens):
        return [t for t in tokens if len(t) >= mini]
    return filtre

def construire_pipeline(config):
    ...

p = construire_pipeline({"minuscules": True, "decouper": True, "min_longueur": 4})
print(p("Le Transformer EST une architecture"))`,
              solution: `def composer(etapes):
    def pipeline(x):
        for e in etapes:
            x = e(x)
        return x
    return pipeline

def fabriquer_filtre_longueur(mini):
    def filtre(tokens):
        return [t for t in tokens if len(t) >= mini]
    return filtre

def construire_pipeline(config):
    etapes = []
    if config.get("minuscules"):
        etapes.append(str.lower)
    if config.get("decouper"):
        etapes.append(str.split)
    if config.get("min_longueur", 0) > 0:
        etapes.append(fabriquer_filtre_longueur(config["min_longueur"]))
    return composer(etapes)

p = construire_pipeline({"minuscules": True, "decouper": True, "min_longueur": 4})
print(p("Le Transformer EST une architecture"))`,
              tests: `_p = construire_pipeline({"minuscules": True, "decouper": True, "min_longueur": 4})
assert _p("Le Transformer EST une architecture") == ["transformer", "architecture"], "Pipeline complet : minuscules, découpe, filtre"
_p2 = construire_pipeline({"decouper": True})
assert _p2("Un Deux") == ["Un", "Deux"], "Sans l'étape minuscules, la casse est préservée"
_p3 = construire_pipeline({})
assert _p3("Tel Quel") == "Tel Quel", "Config vide : pipeline identité"
_p4 = construire_pipeline({"minuscules": True})
assert _p4("ABC") == "abc", "Une seule étape"
print("TESTS_PASS")`,
              hints: [
                'Construis une liste d\'étapes conditionnellement (config.get), puis composer(etapes).',
                'str.lower et str.split sont des fonctions utilisables telles quelles.',
                'composer([]) fonctionne déjà : la boucle ne fait rien, x ressort intact.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Quelle est la différence entre "return pipeline" et "return pipeline(texte)" dans composer ?',
                options: [
                  'Aucune',
                  'Le premier renvoie la fonction elle-même (réutilisable) ; le second l\'exécuterait immédiatement et renverrait un résultat',
                  'Le second est plus rapide',
                  'Le premier est une erreur de syntaxe',
                ],
                correct: 1,
                explanation: 'Une fonction sans parenthèses est un objet qu\'on peut transporter ; avec parenthèses, c\'est un appel. Cette distinction est au cœur des callbacks, des décorateurs et de sorted(key=ma_fonction).',
              },
              {
                question: 'Pourquoi structurer le prétraitement en pipeline de petites fonctions plutôt qu\'en une grosse fonction ?',
                options: [
                  'C\'est plus rapide à exécuter',
                  'Chaque étape est testable isolément, remplaçable, et l\'ordre est explicite — la recette exacte du corpus est lisible en une ligne',
                  'Python limite la taille des fonctions',
                  'Pour utiliser plus de mémoire',
                ],
                correct: 1,
                explanation: 'En NLP, la reproductibilité du prétraitement est critique : le même pipeline exact doit s\'appliquer à l\'entraînement ET à l\'inférence. Une liste de fonctions nommées documente cette recette mieux que 200 lignes monolithiques.',
              },
            ],
          },
        ],
      },
    ],
  }
