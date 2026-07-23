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
    title: 'Regex et données réelles',
    tagline: 'Nettoyer des corpus bruités avec les expressions régulières, manipuler le JSON des API.',
    status: 'ready',
    lessons: [
      {
        id: 'm3l1',
        title: 'Expressions régulières pour le texte',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Le couteau suisse du nettoyage de corpus

Les données textuelles réelles sont *sales* : URLs, mentions, émojis, HTML résiduel, espaces multiples. Les **expressions régulières** (module \`re\`) sont l'outil standard pour nettoyer et extraire — indispensables avant tout entraînement ou toute indexation RAG.

## Les motifs essentiels

- \`.\` n'importe quel caractère · \`\\d\` chiffre · \`\\w\` lettre/chiffre/_ · \`\\s\` espace
- \`+\` une fois ou plus · \`*\` zéro ou plus · \`?\` optionnel · \`{2,4}\` entre 2 et 4 fois
- \`[abc]\` un caractère parmi · \`[^abc]\` tout sauf · \`^\` début · \`$\` fin
- \`()\` groupe de capture · \`|\` alternative

## Les trois fonctions à connaître

\`\`\`
import re

re.findall(r"#\\w+", texte)        # extraire toutes les occurrences
re.sub(r"https?://\\S+", "", texte) # remplacer (ici : supprimer les URLs)
re.search(r"\\d{4}", texte)         # premier match (ou None)
\`\`\`

Le préfixe \`r"..."\` (*raw string*) évite que Python interprète les backslashes — utilise-le systématiquement pour les regex.

> En NLP moderne, les regex restent partout : pré-tokenisation de GPT (une grosse regex !), extraction de blocs de code dans les réponses de LLM, détection de PII à anonymiser, parsing de logs.`,
          },
          {
            kind: 'code',
            title: 'Nettoyage type "réseaux sociaux" — exécute et observe',
            runnable: true,
            code: `import re

tweet = "RT @bob: Les #LLM c'est fou !! 🤯 https://exemple.com/article  #IA #NLP"

sans_url = re.sub(r"https?://\\S+", "", tweet)
sans_mention = re.sub(r"@\\w+", "", sans_url)
hashtags = re.findall(r"#(\\w+)", tweet)   # les () capturent sans le #
propre = re.sub(r"\\s+", " ", sans_mention).strip()

print("hashtags :", hashtags)
print("propre   :", propre)`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm3l1e1',
              title: 'Pipeline de nettoyage de commentaires',
              instructions: `Écris \`nettoyer(texte)\` qui, dans cet ordre :

1. supprime les URLs (\`http://\` ou \`https://\` suivis de non-espaces),
2. supprime les mentions \`@pseudo\`,
3. remplace les ponctuations répétées (\`!!\`, \`???\`, \`...\`) par une seule occurrence — indice : \`re.sub(r"([!?.])\\1+", r"\\1", ...)\`,
4. compacte les espaces multiples en un seul et retire ceux des extrémités.

Écris aussi \`extraire_hashtags(texte)\` qui renvoie la liste des hashtags **sans** le \`#\`.`,
              starterCode: `import re

def nettoyer(texte):
    ...

def extraire_hashtags(texte):
    ...

print(nettoyer("Génial !!! @alice regarde https://x.co/abc  ça"))
print(extraire_hashtags("#IA et #NLP sont liés"))`,
              solution: `import re

def nettoyer(texte):
    texte = re.sub(r"https?://\\S+", "", texte)
    texte = re.sub(r"@\\w+", "", texte)
    texte = re.sub(r"([!?.])\\1+", r"\\1", texte)
    texte = re.sub(r"\\s+", " ", texte).strip()
    return texte

def extraire_hashtags(texte):
    return re.findall(r"#(\\w+)", texte)

print(nettoyer("Génial !!! @alice regarde https://x.co/abc  ça"))
print(extraire_hashtags("#IA et #NLP sont liés"))`,
              tests: `assert nettoyer("Génial !!! @alice regarde https://x.co/abc  ça") == "Génial ! regarde ça", "Attendu : 'Génial ! regarde ça'"
assert nettoyer("Quoi ???") == "Quoi ?", "Les '???' doivent devenir '?'"
assert nettoyer("  a   b  ") == "a b", "Espaces multiples compactés, extrémités nettoyées"
assert extraire_hashtags("#IA et #NLP sont liés") == ["IA", "NLP"], "Hashtags sans le #"
assert extraire_hashtags("rien ici") == [], "Aucun hashtag : liste vide"
print("TESTS_PASS")`,
              hints: [
                'Enchaîne quatre re.sub, chacun sur le résultat du précédent.',
                'Dans r"([!?.])\\1+" : le groupe ( ) capture le caractère, \\1+ matche ses répétitions, et r"\\1" le remplace par une seule occurrence.',
                'Pour les hashtags : re.findall(r"#(\\w+)", texte) — les parenthèses font que findall renvoie le contenu du groupe.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Que renvoie re.findall(r"\\d+", "an 2017, puis 2023") ?',
                options: ['["2017", "2023"]', '"20172023"', '["2", "0", "1", "7", ...]', 'None'],
                correct: 0,
                explanation: '\\d+ matche des séquences de chiffres aussi longues que possible (quantificateur "gourmand") : deux matches, renvoyés comme liste de chaînes.',
              },
              {
                question: 'Pourquoi écrire les regex avec le préfixe r"..." ?',
                options: [
                  'Pour les rendre plus rapides',
                  'Pour que Python n\'interprète pas les backslashes (\\d resterait \\d, pas un caractère d\'échappement)',
                  'C\'est obligatoire pour re.sub',
                  'Pour activer le mode multiligne',
                ],
                correct: 1,
                explanation: 'Sans raw string, "\\n" devient un saut de ligne avant même d\'arriver au moteur regex. Avec r"\\n", la regex reçoit bien le motif \\n. Réflexe systématique.',
              },
            ],
          },
        ],
      },
      {
        id: 'm3l2',
        title: 'JSON : le format des API et des datasets',
        minutes: 30,
        sections: [
          {
            kind: 'text',
            md: `# La lingua franca des données

Réponses d'API LLM, datasets Hugging Face, configurations de modèles, logs d'évaluation : **tout est en JSON**. Sa correspondance avec Python est directe : objet → \`dict\`, tableau → \`list\`, string → \`str\`, number → \`int\`/\`float\`, \`null\` → \`None\`.

## Les deux fonctions centrales

\`\`\`
import json

data = json.loads(chaine)          # JSON (str) -> objets Python
chaine = json.dumps(data)          # objets Python -> JSON (str)
json.dumps(data, indent=2, ensure_ascii=False)  # lisible + accents
\`\`\`

## Naviguer dans du JSON imbriqué

Les réponses d'API sont profondément imbriquées. La navigation, c'est des crochets en cascade — avec \`.get()\` pour les champs optionnels :

\`\`\`
reponse = {"choices": [{"message": {"content": "Bonjour !"}}]}
texte = reponse["choices"][0]["message"]["content"]
usage = reponse.get("usage", {}).get("total_tokens", 0)  # robuste si absent
\`\`\`

## Le format JSONL

Les datasets NLP utilisent souvent le **JSON Lines** : un objet JSON par ligne. C'est le format des fichiers de fine-tuning (OpenAI, Anthropic), des exports de corpus, des logs d'éval :

\`\`\`
for ligne in contenu.splitlines():
    exemple = json.loads(ligne)
\`\`\``,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm3l2e1',
              title: 'Analyser un dataset JSONL de classification',
              instructions: `Le starter contient un mini-dataset JSONL (une critique par ligne : \`texte\` + \`label\`). Écris :

1. \`charger_jsonl(contenu)\` — parse chaque ligne non vide et renvoie la liste des dicts,
2. \`stats_labels(exemples)\` — renvoie un dict \`label → nombre d'exemples\`,
3. \`textes_du_label(exemples, label)\` — la liste des champs \`texte\` ayant ce label.

C'est exactement le genre d'inspection qu'on fait avant tout fine-tuning : vérifier l'équilibre des classes.`,
              starterCode: `import json

DATA = """{"texte": "Film magnifique", "label": "positif"}
{"texte": "Une perte de temps", "label": "negatif"}
{"texte": "Chef-d'oeuvre absolu", "label": "positif"}

{"texte": "Scénario incohérent", "label": "negatif"}
{"texte": "Je recommande", "label": "positif"}"""

def charger_jsonl(contenu):
    ...

def stats_labels(exemples):
    ...

def textes_du_label(exemples, label):
    ...

ex = charger_jsonl(DATA)
print(len(ex), "exemples")
print(stats_labels(ex))
print(textes_du_label(ex, "negatif"))`,
              solution: `import json

DATA = """{"texte": "Film magnifique", "label": "positif"}
{"texte": "Une perte de temps", "label": "negatif"}
{"texte": "Chef-d'oeuvre absolu", "label": "positif"}

{"texte": "Scénario incohérent", "label": "negatif"}
{"texte": "Je recommande", "label": "positif"}"""

def charger_jsonl(contenu):
    return [json.loads(l) for l in contenu.splitlines() if l.strip()]

def stats_labels(exemples):
    stats = {}
    for e in exemples:
        stats[e["label"]] = stats.get(e["label"], 0) + 1
    return stats

def textes_du_label(exemples, label):
    return [e["texte"] for e in exemples if e["label"] == label]

ex = charger_jsonl(DATA)
print(len(ex), "exemples")
print(stats_labels(ex))
print(textes_du_label(ex, "negatif"))`,
              tests: `_ex = charger_jsonl(DATA)
assert len(_ex) == 5, "5 exemples (la ligne vide doit être ignorée !)"
assert _ex[0] == {"texte": "Film magnifique", "label": "positif"}, "Chaque ligne doit devenir un dict"
assert stats_labels(_ex) == {"positif": 3, "negatif": 2}, "3 positifs, 2 négatifs"
assert textes_du_label(_ex, "negatif") == ["Une perte de temps", "Scénario incohérent"], "Les 2 textes négatifs, dans l'ordre"
print("TESTS_PASS")`,
              hints: [
                'splitlines() découpe en lignes ; "if l.strip()" écarte les lignes vides.',
                'stats_labels : le motif de comptage du module 1 — dict.get(label, 0) + 1.',
                'textes_du_label : une list comprehension avec condition.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Que devient null (JSON) une fois parsé par json.loads ?',
                options: ['0', 'La chaîne "null"', 'None', 'False'],
                correct: 2,
                explanation: 'La correspondance JSON ↔ Python est mécanique : null ↔ None, true ↔ True, objet ↔ dict… La connaître évite bien des surprises en parsant des réponses d\'API.',
              },
              {
                question: 'Pourquoi le format JSONL plutôt qu\'un unique gros tableau JSON pour les datasets ?',
                options: [
                  'Il compresse mieux',
                  'On peut lire, écrire et streamer ligne par ligne sans charger tout le fichier en mémoire',
                  'json.loads ne gère pas les tableaux',
                  'C\'est une contrainte de GitHub',
                ],
                correct: 1,
                explanation: 'Un corpus de 100 Go se traite ligne à ligne en JSONL (streaming, reprise sur erreur, parallélisation). Un tableau JSON géant doit être parsé d\'un bloc. D\'où son adoption universelle pour le fine-tuning.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'm4',
    tier: 1,
    title: 'Python idiomatique pour la data',
    tagline: 'Générateurs, annotations de type, gestion d\'erreurs : le Python qu\'on lit dans les vraies bibliothèques ML.',
    status: 'ready',
    lessons: [
      {
        id: 'm4l1',
        title: 'Générateurs et itération paresseuse',
        minutes: 30,
        sections: [
          {
            kind: 'text',
            md: `# Traiter plus gros que la RAM

Un corpus d'entraînement fait souvent des dizaines de gigaoctets. Le charger entier dans une liste ? Impossible. La réponse pythonique : les **générateurs** — des fonctions qui *produisent* les éléments un par un, à la demande, avec \`yield\`.

## yield : produire sans accumuler

\`\`\`
def lire_corpus(lignes):
    for ligne in lignes:
        ligne = ligne.strip().lower()
        if ligne:                # on filtre au vol
            yield ligne          # produit UNE valeur, puis se met en pause
\`\`\`

Appeler \`lire_corpus(...)\` n'exécute *rien* : ça renvoie un générateur. Le code ne tourne qu'au fil de l'itération (\`for\`, \`next()\`, \`list()\`). Mémoire utilisée : une ligne à la fois, pas le corpus entier.

## Le pattern central du ML : les batches

Les GPU traitent les données par **lots** (batches). Tout data loader — y compris ceux de PyTorch — repose sur ce motif : accumuler jusqu'à la taille voulue, céder le lot, recommencer :

\`\`\`
def par_batch(elements, taille):
    batch = []
    for e in elements:
        batch.append(e)
        if len(batch) == taille:
            yield batch
            batch = []
    if batch:            # le dernier lot, incomplet
        yield batch
\`\`\`

## Expressions génératrices

Comme une list comprehension, mais paresseuse — parenthèses au lieu de crochets :

\`\`\`
total_tokens = sum(len(l.split()) for l in lignes)   # aucun stockage intermédiaire
\`\`\``,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm4l1e1',
              title: 'Un data loader minimal',
              instructions: `Implémente deux générateurs :

1. \`tokens_du_corpus(phrases)\` — cède (\`yield\`) chaque token (minuscules, split espace) de chaque phrase, un par un,
2. \`par_batch(elements, taille)\` — regroupe n'importe quel itérable en listes de \`taille\` éléments (dernier lot possiblement incomplet).

Les deux doivent être de vrais générateurs (utiliser \`yield\`), composables : \`par_batch(tokens_du_corpus(phrases), 4)\`.`,
              starterCode: `def tokens_du_corpus(phrases):
    ...

def par_batch(elements, taille):
    ...

phrases = ["Le chat dort", "Le chien aboie fort", "Fin"]
for lot in par_batch(tokens_du_corpus(phrases), 4):
    print(lot)`,
              solution: `def tokens_du_corpus(phrases):
    for phrase in phrases:
        for token in phrase.lower().split():
            yield token

def par_batch(elements, taille):
    batch = []
    for e in elements:
        batch.append(e)
        if len(batch) == taille:
            yield batch
            batch = []
    if batch:
        yield batch

phrases = ["Le chat dort", "Le chien aboie fort", "Fin"]
for lot in par_batch(tokens_du_corpus(phrases), 4):
    print(lot)`,
              tests: `import types
_g = tokens_du_corpus(["A b", "c"])
assert isinstance(_g, types.GeneratorType), "tokens_du_corpus doit utiliser yield (générateur)"
assert list(_g) == ["a", "b", "c"], "Tokens en minuscules, un par un"
assert isinstance(par_batch([1], 2), types.GeneratorType), "par_batch doit utiliser yield"
assert list(par_batch([1, 2, 3, 4, 5], 2)) == [[1, 2], [3, 4], [5]], "Lots de 2, dernier lot incomplet inclus"
assert list(par_batch([], 3)) == [], "Itérable vide : aucun lot"
_lots = list(par_batch(tokens_du_corpus(["Le chat dort", "Le chien aboie fort", "Fin"]), 4))
assert _lots == [["le", "chat", "dort", "le"], ["chien", "aboie", "fort", "fin"]], "Les deux générateurs doivent se composer"
print("TESTS_PASS")`,
              hints: [
                'tokens_du_corpus : deux for imbriqués, yield token au centre.',
                'par_batch : accumule dans une liste, yield + remise à zéro quand elle est pleine, et n\'oublie pas le "if batch: yield batch" final.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Que se passe-t-il à l\'appel de gen = par_batch(corpus, 32) ?',
                options: [
                  'Tout le corpus est découpé immédiatement en lots',
                  'Rien ne s\'exécute : un générateur est créé, le code tournera pendant l\'itération',
                  'Le premier lot est calculé',
                  'Une erreur si corpus est trop grand',
                ],
                correct: 1,
                explanation: 'L\'évaluation est paresseuse : c\'est le for (ou next()) qui déclenche l\'exécution, lot par lot. C\'est ce qui permet de streamer des téraoctets avec quelques Mo de RAM.',
              },
              {
                question: 'Quelle est la différence entre [f(x) for x in data] et (f(x) for x in data) ?',
                options: [
                  'Aucune',
                  'La première construit toute la liste en mémoire, la seconde produit les valeurs à la demande',
                  'La seconde est une erreur de syntaxe',
                  'La seconde trie les résultats',
                ],
                correct: 1,
                explanation: 'Crochets = liste matérialisée ; parenthèses = expression génératrice paresseuse. Pour un sum() ou un max() sur un gros flux, la version paresseuse évite le pic mémoire.',
              },
            ],
          },
        ],
      },
      {
        id: 'm4l2',
        title: 'Erreurs, robustesse et annotations de type',
        minutes: 30,
        sections: [
          {
            kind: 'text',
            md: `# Le code qui survit à la production

Un pipeline qui appelle une API LLM sur 10 000 documents *va* rencontrer des erreurs : timeouts, rate limits, JSON malformé. La différence entre un script et un système, c'est ce qui se passe à ce moment-là.

## try / except : précis, jamais silencieux

\`\`\`
try:
    data = json.loads(reponse)
except json.JSONDecodeError:      # on attrape PRÉCISÉMENT ce qu'on attend
    data = None                   # et on décide quoi faire
\`\`\`

Deux règles d'or : ne jamais attraper \`Exception\` à l'aveugle (ça masque les vrais bugs), et ne jamais laisser un \`except: pass\` silencieux.

## Le retry avec backoff : LE pattern des API LLM

Les erreurs de rate limit (429) sont *normales* et *temporaires*. Le réflexe professionnel : réessayer en attendant de plus en plus longtemps (backoff exponentiel : 1 s, 2 s, 4 s…). Toutes les bibliothèques clientes le font ; savoir l'écrire soi-même est un classique d'entretien.

## Annotations de type : lire les signatures

Les annotations ne changent pas l'exécution, mais documentent et permettent la vérification statique. Tu les liras partout dans les bibliothèques ML :

\`\`\`
def encoder(textes: list[str], batch_size: int = 32) -> list[list[float]]:
    ...
\`\`\`

Ça se lit : « prend une liste de chaînes, renvoie une liste de vecteurs ». Les signatures typées sont la *documentation la plus fiable* d'une bibliothèque — souvent plus à jour que la doc elle-même.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm4l2e1',
              title: 'Retry avec backoff exponentiel',
              instructions: `Le starter fournit \`APIInstable\`, qui échoue les 2 premiers appels (\`RateLimitError\`) puis répond. Écris :

\`appeler_avec_retry(fonction, max_essais=4)\` qui :

1. tente \`fonction()\` ; si ça réussit, renvoie le résultat,
2. sur \`RateLimitError\` : note le délai de backoff \`2 ** tentative\` (1, 2, 4…) dans la liste \`delais\` au lieu de vraiment attendre, puis réessaie,
3. après \`max_essais\` échecs, relance l'exception (\`raise\`).

Renvoie le tuple \`(resultat, delais)\`.`,
              starterCode: `class RateLimitError(Exception):
    pass

class APIInstable:
    def __init__(self, echecs=2):
        self.restants = echecs
    def appeler(self):
        if self.restants > 0:
            self.restants -= 1
            raise RateLimitError("429 Too Many Requests")
        return "réponse du modèle"

def appeler_avec_retry(fonction, max_essais=4):
    delais = []
    ...

api = APIInstable(echecs=2)
print(appeler_avec_retry(api.appeler))`,
              solution: `class RateLimitError(Exception):
    pass

class APIInstable:
    def __init__(self, echecs=2):
        self.restants = echecs
    def appeler(self):
        if self.restants > 0:
            self.restants -= 1
            raise RateLimitError("429 Too Many Requests")
        return "réponse du modèle"

def appeler_avec_retry(fonction, max_essais=4):
    delais = []
    for tentative in range(max_essais):
        try:
            return fonction(), delais
        except RateLimitError:
            if tentative == max_essais - 1:
                raise
            delais.append(2 ** tentative)

api = APIInstable(echecs=2)
print(appeler_avec_retry(api.appeler))`,
              tests: `_r, _d = appeler_avec_retry(APIInstable(echecs=2).appeler)
assert _r == "réponse du modèle", "Après 2 échecs, le 3e essai doit réussir"
assert _d == [1, 2], "Backoff exponentiel : délais 2**0=1 puis 2**1=2"
_r2, _d2 = appeler_avec_retry(APIInstable(echecs=0).appeler)
assert _r2 == "réponse du modèle" and _d2 == [], "Succès immédiat : aucun délai"
try:
    appeler_avec_retry(APIInstable(echecs=10).appeler, max_essais=3)
    assert False, "Après max_essais échecs, l'exception doit être relancée"
except RateLimitError:
    pass
print("TESTS_PASS")`,
              hints: [
                'Une boucle for tentative in range(max_essais) contenant un try/except.',
                'return fonction(), delais — le return sort de la boucle dès le premier succès.',
                'Dans le except : si c\'était la dernière tentative, raise (tout court) relance l\'exception ; sinon append le délai.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi "except Exception: pass" est-il dangereux ?',
                options: [
                  'C\'est une erreur de syntaxe',
                  'Il avale TOUTES les erreurs — y compris les bugs (typos, None inattendu) — qui deviennent invisibles',
                  'Il ralentit le programme',
                  'Il ne fonctionne qu\'en Python 2',
                ],
                correct: 1,
                explanation: 'Un pipeline qui "réussit" en silence sur des données corrompues est pire qu\'un crash : tu découvres le problème dans les résultats du modèle, des semaines plus tard. Attrape précis, loggue toujours.',
              },
              {
                question: 'Que signifie la signature def chunker(texte: str, taille: int = 500) -> list[str] ?',
                options: [
                  'Python refusera un appel avec un int comme texte',
                  'Elle documente : entrée str + int optionnel (défaut 500), sortie liste de str — sans effet à l\'exécution',
                  'Elle convertit automatiquement les types',
                  'Elle rend la fonction plus rapide',
                ],
                correct: 1,
                explanation: 'Les annotations sont déclaratives : l\'interpréteur les ignore, mais mypy/pyright les vérifient et ton éditeur s\'en sert pour l\'autocomplétion. En ML, elles sont le premier réflexe de lecture d\'une API.',
              },
            ],
          },
        ],
      },
    ],
  },
]
