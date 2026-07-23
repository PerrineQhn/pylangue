import type { Module } from '@/lib/types'

export const m1: Module = {
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

En NLP, en IA et avec les LLM, la donnée de base est **la chaîne de caractères** (\`str\`). Un prompt est une chaîne. Une réponse de modèle est une chaîne. Un corpus d'entraînement, c'est des milliards de chaînes. Avant de parler de tokens, d'embeddings ou d'attention, il faut être parfaitement à l'aise avec la manipulation de texte — c'est le socle de *tout* le reste, et c'est ce qu'on fait concrètement des heures par semaine dans un poste NLP : nettoyer des corpus, construire des prompts, parser des réponses de modèles.

Et pourquoi Python ? Parce que c'est la langue maternelle de l'écosystème IA : PyTorch, Hugging Face, les SDK OpenAI/Anthropic, scikit-learn, pandas — tout est en Python. L'apprendre à travers le NLP, c'est apprendre les deux en même temps.

## Variables : des étiquettes sur des valeurs

Une variable se crée par simple affectation — pas de déclaration de type, Python le déduit tout seul (typage *dynamique*) :

\`\`\`
phrase = "Les modèles de langage prédisent le prochain token."
nb_mots = 8          # un entier (int)
score = 0.87         # un flottant (float)
\`\`\`

Imagine une étiquette collée sur une valeur : \`phrase\` n'est pas une boîte qui « contient » le texte, c'est un nom qui pointe vers lui. Réaffecter la variable, c'est déplacer l'étiquette.

## Anatomie d'une chaîne

Une chaîne se délimite par des guillemets simples ou doubles (identiques en Python), et c'est une **séquence** : chaque caractère a une position, à partir de 0 :

\`\`\`
texte = "attention"
texte[0]        # 'a'  — premier caractère
texte[-1]       # 'n'  — le dernier (indices négatifs = depuis la fin)
texte[0:3]      # 'att' — une "tranche" (slice), fin exclue
len(texte)      # 9   — la longueur
\`\`\`

Détail qui a de grandes conséquences : les chaînes sont **immuables**. Aucune méthode ne modifie la chaîne existante — elles renvoient toutes une *nouvelle* chaîne. D'où le motif omniprésent \`texte = texte.lower()\` : on réaffecte le résultat.

## Les f-strings : l'outil n°1 du prompt engineering

Préfixe \`f\`, accolades pour injecter des variables ou des expressions :

\`\`\`
modele = "GPT"
auteur = "un data scientist"
prompt = f"Résume ce texte comme le ferait {auteur} avec {modele}."
info = f"Le texte fait {len(phrase)} caractères."   # expression dans les {}
\`\`\`

Chaque prompt de production est un template avec des parties variables (le contexte, la question de l'utilisateur, des exemples). Les f-strings — et leur cousine \`.format()\` pour les templates stockés dans des fichiers — sont l'outil quotidien de ce travail.

## Les six méthodes qui font 80 % du nettoyage

- \`.lower()\` / \`.upper()\` — normaliser la casse (« Le » et « le » deviennent identiques)
- \`.strip()\` — retirer espaces et sauts de ligne en début/fin (les données réelles en sont truffées)
- \`.replace(a, b)\` — remplacer une sous-chaîne partout
- \`.split(sep)\` — découper en liste (la première étape vers la *tokenisation* !)
- \`sep.join(liste)\` — recoller une liste en chaîne (l'inverse exact de split)
- \`mot in texte\` — tester la présence d'une sous-chaîne (renvoie True/False)

Elles s'enchaînent naturellement, de gauche à droite : \`texte.strip().lower().split()\` se lit « nettoie les bords, mets en minuscules, découpe ».

## Pièges classiques (tu les rencontreras tous)

- **Oublier de réaffecter** : \`texte.lower()\` seul ne fait rien — il faut \`texte = texte.lower()\`.
- **Confondre \`split()\` et \`split(" ")\`** : sans argument, split découpe sur *toute* séquence d'espaces et ignore les vides — c'est presque toujours ce qu'on veut.
- **Les accents et l'Unicode** : \`"é"\` est un caractère à part entière ; \`len("café")\` vaut 4, mais côté octets ou tokens, c'est une autre histoire (on y reviendra avec BPE au module 8).`,
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
            kind: 'code',
            title: "Cas concret : construire un prompt de production",
            runnable: true,
            code: `# Le squelette de tout prompt d'application : un template + des variables
TEMPLATE = \"\"\"Tu es un assistant de support client.
Reponds en {langue}, en {nb_phrases} phrases maximum.

Message du client :
{message}\"\"\"

message_brut = "  Bonjour, MON COLIS N'EST PAS ARRIVE !!  "
message = message_brut.strip()          # toujours nettoyer l'entree utilisateur

prompt = TEMPLATE.format(langue="francais", nb_phrases=2, message=message)
print(prompt)
print("---")
print(f"Longueur du prompt : {len(prompt)} caracteres")

# Verification simple avant envoi a l'API (garde-fou reel) :
if "{" in prompt:
    print("ATTENTION : une variable du template n'a pas ete remplie !")
else:
    print("Prompt pret a envoyer.")`,
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

Avant les réseaux de neurones, le NLP reposait sur le **comptage**. Et même aujourd'hui, compter des fréquences reste partout : construction de vocabulaires, TF-IDF, statistiques de corpus, détection de mots-clés, contrôle qualité des données. La question « quels sont les mots les plus fréquents ? » est souvent la *première* qu'on pose à un corpus inconnu — et la réponse tient en dix lignes de Python.

## Les listes : des séquences ordonnées et modifiables

\`\`\`
tokens = ["le", "chat", "dort"]
tokens.append("profondément")   # ajouter à la fin
premier = tokens[0]              # indexation (comme les chaînes)
derniers = tokens[-2:]           # slicing : les 2 derniers
len(tokens)                      # 4
\`\`\`

Contrairement aux chaînes, les listes sont **modifiables** : \`append\` change la liste en place. On les parcourt avec \`for token in tokens:\` — la boucle la plus écrite de tout le NLP.

## Les dictionnaires : LA structure de données du NLP

Un dictionnaire (\`dict\`) associe des **clés** à des **valeurs**, avec un accès en temps constant — quelle que soit sa taille. Regarde autour de toi dans n'importe quel code NLP : les vocabulaires sont des dicts (\`mot → id\`), les comptages sont des dicts (\`mot → fréquence\`), les configs de modèles sont des dicts, les réponses d'API sont des dicts.

\`\`\`
comptes = {}                             # dict vide
comptes["chat"] = 1                      # écrire
comptes["chat"] = comptes["chat"] + 1    # incrémenter
"chien" in comptes                       # tester une clé : False
comptes.get("chien", 0)                  # lire avec valeur par défaut : 0
\`\`\`

Le point subtil est la dernière ligne : \`comptes["chien"]\` lèverait une erreur \`KeyError\` (la clé n'existe pas), alors que \`.get("chien", 0)\` renvoie tranquillement 0. Cette différence est la clé du motif suivant.

## Le motif fondamental : compter

\`\`\`
for token in tokens:
    comptes[token] = comptes.get(token, 0) + 1
\`\`\`

Lis-le lentement : pour chaque token, « prends son compte actuel (ou 0 si première rencontre), ajoute 1, range le résultat ». Trois lignes qui gèrent élégamment les deux cas — mot déjà vu, mot nouveau — sans aucun \`if\`. Tu réécriras ce motif des dizaines de fois dans ta carrière, pour compter des mots, des erreurs, des appels d'API, des labels…

## Les ensembles (set), le troisième mousquetaire

Un \`set\` stocke des valeurs **uniques**, sans ordre, avec un test d'appartenance ultra-rapide. Parfait pour les stopwords (\`if mot in STOPWORDS\`), les vocabulaires en construction, la déduplication (\`set(tokens)\` élimine les doublons d'un coup).

## Quand utiliser quoi ? Le réflexe à acquérir

- Une **séquence ordonnée** à parcourir → liste
- Une **association** clé → valeur → dict
- Un **test d'appartenance** rapide ou de l'unicité → set

Ce choix de structure est souvent LA différence entre un script qui traite un corpus en 3 secondes et le même en 3 heures (chercher dans une liste est lent, dans un set/dict c'est instantané).`,
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
      {
        id: 'm1l3',
        title: 'Mini-projet : analyseur de corpus',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Assembler tout : ton premier outil NLP complet

Tu sais nettoyer, découper, compter. Il est temps d'assembler ces briques en un vrai outil : un **analyseur statistique de texte** — la première chose qu'un professionnel fait face à un corpus inconnu, avant tout entraînement ou toute indexation. C'est l'équivalent NLP de l'examen clinique : quelques mesures simples qui révèlent immédiatement l'état général du patient.

## Les quatre statistiques qui comptent

**Nombre de tokens** et **taille du vocabulaire** (mots uniques) : l'ordre de grandeur du corpus. Un vocabulaire de 200 mots sur 100 000 tokens raconte une toute autre histoire qu'un vocabulaire de 30 000 mots.

**Richesse lexicale** = vocabulaire / tokens (les linguistes disent *type-token ratio*) : proche de 1 → chaque mot est presque unique, texte très varié ; proche de 0 → texte extrêmement répétitif. Repères pratiques sur des textes courts : ~0.7-0.9 pour de la prose normale, < 0.3 → suspicion de boilerplate, de spam ou de duplication massive.

**Hapax** : les mots qui n'apparaissent qu'**une seule fois**. Surprise contre-intuitive : dans un corpus réel, ils représentent souvent 40 à 50 % du vocabulaire ! C'est la fameuse **loi de Zipf** : le mot le plus fréquent apparaît ~2× plus que le 2e, ~3× que le 3e… une poignée de mots domine tout, suivie d'une immense traîne de mots rares. Cette distribution explique pourquoi TF-IDF fonctionne (module 6), pourquoi les tokenizers BPE compressent si bien (module 8), et pourquoi ton vocabulaire ne « converge » jamais.

**Top-k des fréquences** : les mots dominants révèlent le domaine (et les artefacts : si « cookie » et « javascript » trustent le top 10 d'un corpus d'articles de presse, ton scraping a embarqué du bruit de pages web).

## La démarche d'audit, pas à pas

1. Normaliser (minuscules — leçon 1),
2. Tokeniser (split — leçon 1),
3. Compter (Counter — leçon 2),
4. Dériver les statistiques et **les interpréter** : chaque chiffre anormal est une question à poser aux données.

## Pourquoi c'est important en pratique

Ces statistiques guident des décisions très concrètes : dimensionner le vocabulaire d'un tokenizer, choisir une taille de chunk pour un RAG, détecter la duplication avant un fine-tuning (payer un GPU pour apprendre 40 fois le même document est un grand classique des échecs coûteux). Les rapports de qualité de données des grands labos commencent tous par ces chiffres — et en mission, ce rapport d'audit est souvent le premier livrable qu'on te demandera.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm1l3e1',
              title: 'La fonction analyser()',
              instructions: `Écris \`analyser(texte)\` qui renvoie un dictionnaire avec exactement ces clés :

- \`"tokens"\` : nombre total de mots (après \`.lower().split()\`),
- \`"vocabulaire"\` : nombre de mots uniques,
- \`"richesse"\` : vocabulaire / tokens, arrondi à 3 décimales (\`round(x, 3)\`),
- \`"hapax"\` : liste **triée** des mots n'apparaissant qu'une fois,
- \`"top3"\` : les 3 mots les plus fréquents (utilise \`Counter.most_common\`).

Pour un texte vide, renvoie \`{"tokens": 0, "vocabulaire": 0, "richesse": 0.0, "hapax": [], "top3": []}\`.`,
              starterCode: `from collections import Counter

def analyser(texte):
    ...

resultat = analyser("le chat dort et le chien dort aussi le chat rêve")
for cle, valeur in resultat.items():
    print(f"{cle} : {valeur}")`,
              solution: `from collections import Counter

def analyser(texte):
    mots = texte.lower().split()
    if not mots:
        return {"tokens": 0, "vocabulaire": 0, "richesse": 0.0, "hapax": [], "top3": []}
    comptes = Counter(mots)
    return {
        "tokens": len(mots),
        "vocabulaire": len(comptes),
        "richesse": round(len(comptes) / len(mots), 3),
        "hapax": sorted(m for m, c in comptes.items() if c == 1),
        "top3": [m for m, _ in comptes.most_common(3)],
    }

resultat = analyser("le chat dort et le chien dort aussi le chat rêve")
for cle, valeur in resultat.items():
    print(f"{cle} : {valeur}")`,
              tests: `_r = analyser("le chat dort et le chien dort aussi le chat rêve")
assert _r["tokens"] == 11, "11 tokens au total"
assert _r["vocabulaire"] == 7, "7 mots uniques"
assert _r["richesse"] == round(7 / 11, 3), "richesse = vocabulaire / tokens, arrondie à 3 décimales"
assert _r["hapax"] == ["aussi", "chien", "et", "rêve"], "Les hapax, triés alphabétiquement"
assert _r["top3"][0] == "le", "'le' (3 occurrences) est le plus fréquent"
assert set(_r["top3"][1:]) == {"chat", "dort"}, "'chat' et 'dort' (2 occurrences chacun) complètent le top 3"
_v = analyser("")
assert _v == {"tokens": 0, "vocabulaire": 0, "richesse": 0.0, "hapax": [], "top3": []}, "Texte vide : le dict par défaut"
print("TESTS_PASS")`,
              hints: [
                'Counter(mots) te donne tout : len(comptes) est le vocabulaire, comptes.items() permet de filtrer les hapax.',
                'Les hapax : sorted(m for m, c in comptes.items() if c == 1).',
                'Traite le cas du texte vide en premier (if not mots) pour éviter la division par zéro.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Un corpus a une richesse lexicale de 0.05. Qu\'est-ce que ça suggère ?',
                options: [
                  'Un texte très créatif et varié',
                  'Un texte très répétitif (peu de mots uniques rapportés au total) — typique de logs, de spam ou de données dupliquées',
                  'Un corpus multilingue',
                  'Une erreur de calcul',
                ],
                correct: 1,
                explanation: 'Une richesse très basse est un signal d\'alerte avant un fine-tuning : données dupliquées ou dégénérées. Ce simple ratio détecte des problèmes que l\'œil ne voit pas sur 10 Go de texte.',
              },
              {
                question: 'Que dit la loi de Zipf sur les fréquences des mots ?',
                options: [
                  'Tous les mots ont à peu près la même fréquence',
                  'Une poignée de mots domine le corpus, et une immense traîne de mots est très rare',
                  'Les mots longs sont plus fréquents',
                  'La fréquence dépend de l\'alphabet',
                ],
                correct: 1,
                explanation: 'Le 1er mot est ~2× plus fréquent que le 2e, ~3× que le 3e… Cette distribution explique pourquoi les hapax pullulent, pourquoi TF-IDF fonctionne, et pourquoi les tokenizers BPE compressent si bien les mots fréquents.',
              },
            ],
          },
        ],
      },
    ],
  }
