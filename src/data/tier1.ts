import type { Module } from '@/lib/types'

export const tier1: Module[] = [
  {
    id: 'm1',
    tier: 1,
    title: 'Premiers pas : Python par le texte',
    tagline: 'Variables, chaînes et premières manipulations de texte — le matériau de base du NLP.',
    status: 'ready',
    lessons: [
      {
        id: 'm1l1',
        title: 'Le texte comme donnée',
        minutes: 25,
        sections: [
          {
            kind: 'text',
            md: `# Pourquoi commencer par le texte ?

En NLP, en IA et avec les LLM, la donnée de base est **la chaîne de caractères**. Avant de parler de tokens, d'embeddings ou d'attention, il faut être à l'aise avec la manipulation de texte en Python — c'est le socle de *tout* le reste : nettoyage de corpus, construction de prompts, parsing de réponses de modèles.

## Variables et chaînes

Une variable se crée par simple affectation. Les chaînes (\`str\`) se délimitent par des guillemets simples ou doubles :

\`\`\`
phrase = "Les modèles de langage prédisent le prochain token."
auteur = 'un data scientist'
\`\`\`

Les **f-strings** sont la manière moderne d'insérer des valeurs dans du texte — tu les utiliseras en permanence pour construire des prompts :

\`\`\`
modele = "GPT"
prompt = f"Résume ce texte comme le ferait {auteur} avec {modele}."
\`\`\`

## Les méthodes de chaînes essentielles

- \`.lower()\` / \`.upper()\` — normaliser la casse
- \`.strip()\` — retirer les espaces (et sauts de ligne) en début/fin
- \`.replace(a, b)\` — remplacer une sous-chaîne
- \`.split(sep)\` — découper en liste (première étape vers la *tokenisation* !)
- \`.join(liste)\` — recoller une liste en chaîne
- \`in\` — tester la présence d'une sous-chaîne

> En nettoyage de corpus réel, ces six méthodes couvrent une part énorme du travail quotidien.`,
          },
          {
            kind: 'code',
            title: 'Exemple à exécuter — observe chaque sortie',
            runnable: true,
            code: `texte = "  Le Transformer a été introduit en 2017.  \\n"

propre = texte.strip()
print(repr(propre))          # repr() montre la chaîne exacte

minuscules = propre.lower()
print(minuscules)

mots = minuscules.split(" ")
print(mots)
print(f"Nombre de mots : {len(mots)}")

# .join() fait l'inverse de .split()
recolle = " ".join(mots)
print(recolle)`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm1l1e1',
              title: 'Normaliser un texte brut',
              instructions: `Écris une fonction \`normaliser(texte)\` qui :

1. retire les espaces et sauts de ligne en début/fin,
2. met tout en minuscules,
3. remplace les doubles espaces \`"  "\` par des espaces simples.

C'est littéralement la première étape de 90 % des pipelines NLP.`,
              starterCode: `def normaliser(texte):
    # À toi de jouer !
    ...

print(normaliser("  Bonjour  le MONDE \\n"))`,
              solution: `def normaliser(texte):
    texte = texte.strip()
    texte = texte.lower()
    texte = texte.replace("  ", " ")
    return texte

print(normaliser("  Bonjour  le MONDE \\n"))`,
              tests: `assert normaliser("  Bonjour  le MONDE \\n") == "bonjour le monde", "La normalisation de '  Bonjour  le MONDE ' devrait donner 'bonjour le monde'"
assert normaliser("IA") == "ia", "normaliser('IA') devrait donner 'ia'"
assert normaliser(" Un  deux  trois ") == "un deux trois", "Les doubles espaces doivent devenir simples"
print("TESTS_PASS")`,
              hints: [
                'Enchaîne les méthodes : strip() d\'abord, puis lower(), puis replace().',
                'N\'oublie pas le return ! Une fonction sans return renvoie None.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Que renvoie "Hello World".split(" ") ?',
                options: ['"HelloWorld"', '["Hello", "World"]', '("Hello", "World")', 'Une erreur'],
                correct: 1,
                explanation: 'split() découpe la chaîne selon le séparateur et renvoie une liste de sous-chaînes. C\'est l\'ancêtre conceptuel de la tokenisation.',
              },
              {
                question: 'Pourquoi les f-strings sont-elles importantes quand on travaille avec des LLM ?',
                options: [
                  'Elles rendent le code plus rapide',
                  'Elles servent à construire dynamiquement des prompts avec des variables',
                  'Elles sont obligatoires en Python 3',
                  'Elles compressent le texte',
                ],
                correct: 1,
                explanation: 'Un prompt est presque toujours un template avec des parties variables (contexte, question de l\'utilisateur, exemples). Les f-strings sont l\'outil de base pour ça.',
              },
            ],
          },
        ],
      },
      {
        id: 'm1l2',
        title: 'Listes, dictionnaires et fréquences de mots',
        minutes: 30,
        sections: [
          {
            kind: 'text',
            md: `# Compter les mots : ton premier modèle de langage (ou presque)

Avant les réseaux de neurones, le NLP reposait sur le **comptage**. Et même aujourd'hui, compter des fréquences reste partout : construction de vocabulaires, TF-IDF, statistiques de corpus, détection de mots-clés.

## Les listes

Une liste est une séquence ordonnée et modifiable :

\`\`\`
tokens = ["le", "chat", "dort"]
tokens.append("profondément")
premier = tokens[0]        # indexation
derniers = tokens[-2:]     # slicing : les 2 derniers
\`\`\`

## Les dictionnaires

Un dictionnaire associe des **clés** à des **valeurs**. C'est LA structure de données du NLP : vocabulaires (\`mot → id\`), comptages (\`mot → fréquence\`), embeddings (\`mot → vecteur\`)…

\`\`\`
comptes = {}
comptes["chat"] = 1
comptes["chat"] = comptes["chat"] + 1   # incrémenter
"chien" in comptes                       # tester une clé : False
comptes.get("chien", 0)                  # valeur par défaut : 0
\`\`\`

## Le motif fondamental : compter

\`\`\`
for token in tokens:
    comptes[token] = comptes.get(token, 0) + 1
\`\`\`

Ce petit motif de trois lignes, tu vas le réécrire des dizaines de fois dans ta carrière (ou utiliser \`collections.Counter\`, sa version standard).`,
          },
          {
            kind: 'code',
            title: 'Counter : le comptage version bibliothèque standard',
            runnable: true,
            code: `from collections import Counter

texte = "le chat dort et le chien dort aussi le chat rêve"
tokens = texte.split()

comptes = Counter(tokens)
print(comptes)
print(comptes.most_common(3))   # les 3 tokens les plus fréquents

# Un vrai vocabulaire NLP : mot -> identifiant entier
vocab = {mot: i for i, mot in enumerate(sorted(comptes))}
print(vocab)`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm1l2e1',
              title: 'Top-k des mots d\'un texte',
              instructions: `Écris une fonction \`top_mots(texte, k)\` qui renvoie la liste des \`k\` mots les plus fréquents du texte (en minuscules), du plus fréquent au moins fréquent.

Utilise \`Counter\` et sa méthode \`.most_common(k)\` — mais attention, elle renvoie des paires \`(mot, compte)\` et on ne veut que les mots.`,
              starterCode: `from collections import Counter

def top_mots(texte, k):
    # 1. minuscules, 2. split, 3. Counter, 4. extraire les mots
    ...

print(top_mots("Le chat dort le chat rêve le chien", 2))`,
              solution: `from collections import Counter

def top_mots(texte, k):
    tokens = texte.lower().split()
    comptes = Counter(tokens)
    return [mot for mot, _ in comptes.most_common(k)]

print(top_mots("Le chat dort le chat rêve le chien", 2))`,
              tests: `assert top_mots("Le chat dort le chat rêve le chien", 2) == ["le", "chat"], "Les 2 mots les plus fréquents sont 'le' puis 'chat'"
assert top_mots("a b b c c c", 1) == ["c"], "Le mot le plus fréquent est 'c'"
assert top_mots("x", 5) == ["x"], "Si k dépasse le nombre de mots, on renvoie ce qu'on a"
print("TESTS_PASS")`,
              hints: [
                'texte.lower().split() te donne la liste des tokens en minuscules.',
                'Counter(tokens).most_common(k) renvoie [(mot, compte), ...] — utilise une list comprehension pour ne garder que les mots.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Quelle structure de données représente naturellement un vocabulaire mot → identifiant ?',
                options: ['Une liste', 'Un tuple', 'Un dictionnaire', 'Une chaîne'],
                correct: 2,
                explanation: 'Le dictionnaire fait l\'association clé → valeur en temps constant. Les tokenizers de Hugging Face contiennent exactement ça : un dict token → id.',
              },
              {
                question: 'Que fait comptes.get("chien", 0) si "chien" n\'est pas dans le dictionnaire ?',
                options: ['Lève une KeyError', 'Renvoie None', 'Renvoie 0', 'Ajoute "chien" au dictionnaire'],
                correct: 2,
                explanation: 'get(clé, défaut) renvoie la valeur par défaut sans erreur ni modification. C\'est ce qui rend le motif de comptage si compact.',
              },
              {
                question: 'En NLP, pourquoi met-on généralement le texte en minuscules avant de compter ?',
                options: [
                  'Pour économiser de la mémoire',
                  'Pour que "Le" et "le" soient comptés comme le même mot',
                  'Python l\'exige',
                  'Pour accélérer le split',
                ],
                correct: 1,
                explanation: 'C\'est une forme de normalisation : sans elle, le vocabulaire explose avec des doublons. (Les tokenizers modernes comme BPE font des choix plus subtils, on le verra au palier 2.)',
              },
            ],
          },
        ],
      },
    ],
  },
  {
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
    ],
  },
  {
    id: 'm3',
    tier: 1,
    title: 'Fichiers, regex et données réelles',
    tagline: 'Lire des corpus, nettoyer avec les expressions régulières, gérer JSON et CSV.',
    status: 'outline',
    lessons: [],
    outline: [
      'Lire et écrire des fichiers texte, encodages (UTF-8 et ses pièges)',
      'Expressions régulières pour le nettoyage de corpus (re.sub, re.findall)',
      'JSON : le format des API et des datasets (json.loads / dumps)',
      'Mini-projet : nettoyer un dump de commentaires bruités',
    ],
  },
  {
    id: 'm4',
    tier: 1,
    title: 'Python idiomatique pour la data',
    tagline: 'Générateurs, typing, gestion d\'erreurs, environnements virtuels et outillage moderne.',
    status: 'outline',
    lessons: [],
    outline: [
      'Générateurs et itération paresseuse (traiter un corpus plus gros que la RAM)',
      'Annotations de type : lire les signatures des bibliothèques ML',
      'try/except propre : gérer les erreurs d\'API sans tout casser',
      'uv, venv, requirements : reproduire un environnement ML',
    ],
  },
]
