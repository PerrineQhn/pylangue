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

## Stopwords : filtrer le bruit

Les mots très fréquents mais peu informatifs (« le », « de », « et »…) sont appelés **stopwords**. Les retirer est une étape classique en recherche d'information — même si les LLM modernes, eux, gardent tout : leur tokenizer ne jette rien, c'est le mécanisme d'attention qui apprend à pondérer.`,
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

Quand tu utilises Hugging Face, tu écris \`tokenizer = AutoTokenizer.from_pretrained(...)\` puis \`tokenizer.encode(texte)\`. Ce \`tokenizer\` est un **objet** : il regroupe des *données* (le vocabulaire) et des *comportements* (encoder, décoder). Aujourd'hui, tu construis le tien.

## Anatomie d'une classe

\`\`\`
class Tokenizer:
    def __init__(self):          # constructeur
        self.vocab = {}          # état interne : mot -> id

    def fit(self, texte):        # apprendre le vocabulaire
        for mot in texte.lower().split():
            if mot not in self.vocab:
                self.vocab[mot] = len(self.vocab)

    def encode(self, texte):     # texte -> liste d'ids
        ...
\`\`\`

- \`self\` désigne l'instance : \`self.vocab\` est propre à chaque tokenizer.
- \`fit\` / \`encode\` / \`decode\` : cette interface en trois temps est **exactement** celle des vrais outils (scikit-learn, tokenizers HF).

## Le token inconnu : \`<unk>\`

Que faire d'un mot jamais vu à l'entraînement ? Les vocabulaires réels réservent un id spécial \`<unk>\` (unknown). Les tokenizers modernes (BPE, module 8) contournent le problème en découpant les mots inconnus en sous-mots — mais le concept de token spécial (\`<unk>\`, \`<pad>\`, \`<eos>\`…) reste central dans tous les LLM.`,
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

Plus fort : une fonction qui *renvoie* une fonction. \`composer([f, g, h])\` fabrique une nouvelle fonction équivalente à \`h(g(f(x)))\` — le pipeline devient un objet réutilisable qu'on passe où on veut.`,
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
