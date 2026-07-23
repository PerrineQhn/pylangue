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
            kind: 'exercise',
            exercise: {
              id: 'm1l1e2',
              title: "Aperçu de texte pour logs et interfaces",
              instructions: `Dans toute application réelle, on affiche des *aperçus* : les 30 premiers caractères d'un document dans une liste, le début d'un prompt dans les logs. Écris \`apercu(texte, n=30)\` qui :

1. renvoie le texte **tel quel** s'il fait \`n\` caractères ou moins,
2. sinon renvoie les \`n\` premiers caractères suivis du caractère \`…\` (un seul caractère, pas trois points).

C'est du slicing pur — et une fonction que tu réécriras dans la moitié de tes projets.`,
              starterCode: `def apercu(texte, n=30):
    ...

print(apercu("Les transformers ont révolutionné le NLP moderne.", 20))
print(apercu("Court.", 20))`,
              solution: `def apercu(texte, n=30):
    if len(texte) <= n:
        return texte
    return texte[:n] + "…"

print(apercu("Les transformers ont révolutionné le NLP moderne.", 20))
print(apercu("Court.", 20))`,
              tests: `assert apercu("abcdef", 3) == "abc…", "Texte trop long : n caractères + …"
assert apercu("ab", 5) == "ab", "Texte assez court : inchangé"
assert apercu("abcde", 5) == "abcde", "Exactement n caractères : pas de troncature"
assert len(apercu("x" * 100, 10)) == 11, "10 caractères + le seul caractère …"
assert apercu("Les transformers dominent", n=7) == "Les tra…", "Le slicing [:n] garde les n premiers"
print("TESTS_PASS")`,
              hints: [
                'Compare len(texte) à n avant de découper.',
                'texte[:n] garde les n premiers caractères ; ajoute "…" avec +.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm1l1e3',
              title: "Défi — Préparer un message utilisateur pour l'API",
              instructions: `Synthèse de la leçon, telle qu'on l'écrirait dans une vraie application : \`preparer_message(brut, max_mots=50)\` doit :

1. retirer les espaces/sauts de ligne des extrémités,
2. compacter tous les espaces multiples (astuce robuste : \`" ".join(brut.split())\`),
3. si le message dépasse \`max_mots\` mots, ne garder que les \`max_mots\` premiers et ajouter \`" [tronqué]"\`,
4. renvoyer le **tuple** \`(texte_final, nb_mots_conserves)\`.

Ce garde-fou (nettoyer + borner l'entrée utilisateur) existe dans toutes les applications LLM sérieuses : il protège des prompts malformés et des coûts imprévus.`,
              starterCode: `def preparer_message(brut, max_mots=50):
    ...

texte, n = preparer_message("  Bonjour,   j'ai un   problème  ", max_mots=50)
print(repr(texte), n)
texte2, n2 = preparer_message("un deux trois quatre cinq", max_mots=3)
print(repr(texte2), n2)`,
              solution: `def preparer_message(brut, max_mots=50):
    mots = brut.split()
    if len(mots) > max_mots:
        mots = mots[:max_mots]
        return " ".join(mots) + " [tronqué]", len(mots)
    return " ".join(mots), len(mots)

texte, n = preparer_message("  Bonjour,   j'ai un   problème  ", max_mots=50)
print(repr(texte), n)
texte2, n2 = preparer_message("un deux trois quatre cinq", max_mots=3)
print(repr(texte2), n2)`,
              tests: `_t, _n = preparer_message("  Bonjour,   j'ai un   problème  ")
assert _t == "Bonjour, j'ai un problème", "Espaces des bords ET internes compactés"
assert _n == 4, "4 mots conservés"
_t2, _n2 = preparer_message("un deux trois quatre cinq", max_mots=3)
assert _t2 == "un deux trois [tronqué]", "Troncature au nombre de MOTS + marqueur"
assert _n2 == 3, "3 mots conservés"
_t3, _n3 = preparer_message("exactement trois mots", max_mots=3)
assert _t3 == "exactement trois mots", "Pile à la limite : pas de troncature"
_t4, _n4 = preparer_message("")
assert _t4 == "" and _n4 == 0, "Message vide : ('', 0)"
print("TESTS_PASS")`,
              hints: [
                'brut.split() sans argument gère à la fois les bords et les espaces multiples.',
                'Compare len(mots) à max_mots AVANT de recoller.',
                'Le return renvoie deux valeurs séparées par une virgule : c\'est un tuple.',
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
            kind: 'exercise',
            exercise: {
              id: 'm1l2e2',
              title: "Trier un comptage par fréquence",
              instructions: `Counter sait le faire, mais savoir trier un dictionnaire soi-même est un geste fondamental. Écris :

1. \`frequences(tokens)\` — le motif de comptage de la leçon (sans Counter !), qui renvoie le dict \`token → nombre\`,
2. \`trier_par_frequence(comptes)\` — renvoie la **liste de paires** \`(mot, compte)\` triée par fréquence **décroissante**, et par ordre **alphabétique** en cas d'égalité.

Indice pour le tri : \`sorted(comptes.items(), key=lambda p: (-p[1], p[0]))\` — trie sur le tuple (fréquence négative, mot). Comprendre cette ligne, c'est comprendre les tris multi-critères en Python.`,
              starterCode: `def frequences(tokens):
    ...

def trier_par_frequence(comptes):
    ...

tokens = "le chat dort le chien dort le".split()
comptes = frequences(tokens)
print(comptes)
print(trier_par_frequence(comptes))`,
              solution: `def frequences(tokens):
    comptes = {}
    for t in tokens:
        comptes[t] = comptes.get(t, 0) + 1
    return comptes

def trier_par_frequence(comptes):
    return sorted(comptes.items(), key=lambda p: (-p[1], p[0]))

tokens = "le chat dort le chien dort le".split()
comptes = frequences(tokens)
print(comptes)
print(trier_par_frequence(comptes))`,
              tests: `assert frequences(["a", "b", "a"]) == {"a": 2, "b": 1}, "Le motif de comptage classique"
assert frequences([]) == {}, "Liste vide : dict vide"
_t = trier_par_frequence({"b": 2, "a": 2, "c": 1})
assert _t == [("a", 2), ("b", 2), ("c", 1)], "Fréquence décroissante, puis ordre alphabétique pour les ex æquo"
assert trier_par_frequence({"x": 1}) == [("x", 1)], "Un seul élément"
print("TESTS_PASS")`,
              hints: [
                'frequences : comptes[t] = comptes.get(t, 0) + 1 dans une boucle.',
                'comptes.items() donne les paires (mot, compte) ; le key=lambda trie chaque paire par (-compte, mot).',
                'Le signe moins sur p[1] inverse le tri des fréquences (décroissant) tout en gardant p[0] croissant.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm1l2e3',
              title: "Défi — Extracteur de mots-clés",
              instructions: `Le livrable classique « donnez-moi les thèmes de ces avis clients » : \`mots_cles(texte, stopwords, k=5)\` doit :

1. normaliser (minuscules) et tokeniser,
2. écarter les stopwords **et** les tokens de moins de 3 caractères,
3. renvoyer les \`k\` mots les plus fréquents (utilise \`Counter\`), du plus au moins fréquent.

C'est un extracteur de mots-clés minimal mais réel — la base des nuages de mots et des premières taxonomies.`,
              starterCode: `from collections import Counter

STOP = {"les", "des", "est", "une", "pour", "avec", "trop", "tres"}

def mots_cles(texte, stopwords, k=5):
    ...

avis = "livraison rapide produit conforme livraison soignée produit robuste service rapide"
print(mots_cles(avis, STOP, k=3))`,
              solution: `from collections import Counter

STOP = {"les", "des", "est", "une", "pour", "avec", "trop", "tres"}

def mots_cles(texte, stopwords, k=5):
    tokens = [t for t in texte.lower().split()
              if t not in stopwords and len(t) >= 3]
    return [mot for mot, _ in Counter(tokens).most_common(k)]

avis = "livraison rapide produit conforme livraison soignée produit robuste service rapide"
print(mots_cles(avis, STOP, k=3))`,
              tests: `_r = mots_cles("livraison rapide produit conforme livraison soignée produit robuste service rapide", STOP, k=3)
assert _r[0] in ("livraison", "produit", "rapide"), "Les mots dominants doivent sortir en tête"
assert len(_r) == 3, "k=3 mots-clés"
assert mots_cles("les des est", STOP, k=5) == [], "Que des stopwords : rien"
assert mots_cles("ai le un de", set(), k=5) == [], "Tokens de moins de 3 lettres écartés"
_r2 = mots_cles("Alpha alpha ALPHA beta beta gamma", set(), k=2)
assert _r2 == ["alpha", "beta"], "Normalisation puis fréquence : alpha (3) puis beta (2)"
print("TESTS_PASS")`,
              hints: [
                'Une seule list comprehension peut faire la tokenisation ET le double filtre.',
                'Counter(tokens).most_common(k) puis extraire les mots des paires.',
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
            kind: 'exercise',
            exercise: {
              id: 'm1l3e2',
              title: "Compléter l'audit : longueurs et extrêmes",
              instructions: `Deux statistiques de plus pour ton rapport d'audit :

1. \`longueur_moyenne(texte)\` — la longueur moyenne des mots, arrondie à 2 décimales (\`0.0\` pour un texte vide),
2. \`mot_le_plus_long(texte)\` — le mot le plus long (\`""\` pour un texte vide). Indice : \`max(mots, key=len)\`.

La longueur moyenne distingue un corpus de tweets (~4-5) d'un corpus juridique (~6-8) — un indicateur de registre très utilisé.`,
              starterCode: `def longueur_moyenne(texte):
    ...

def mot_le_plus_long(texte):
    ...

t = "le transformer révolutionne le traitement automatique"
print(longueur_moyenne(t))
print(mot_le_plus_long(t))`,
              solution: `def longueur_moyenne(texte):
    mots = texte.split()
    if not mots:
        return 0.0
    return round(sum(len(m) for m in mots) / len(mots), 2)

def mot_le_plus_long(texte):
    mots = texte.split()
    if not mots:
        return ""
    return max(mots, key=len)

t = "le transformer révolutionne le traitement automatique"
print(longueur_moyenne(t))
print(mot_le_plus_long(t))`,
              tests: `assert longueur_moyenne("ab abcd") == 3.0, "(2 + 4) / 2 = 3.0"
assert longueur_moyenne("") == 0.0, "Texte vide : 0.0, pas de division par zéro"
assert longueur_moyenne("a bb ccc") == 2.0, "(1+2+3)/3 = 2.0"
assert mot_le_plus_long("le chat magnifique dort") == "magnifique", "Le mot le plus long"
assert mot_le_plus_long("") == "", "Texte vide : chaîne vide"
print("TESTS_PASS")`,
              hints: [
                'sum(len(m) for m in mots) / len(mots), puis round(…, 2).',
                'max(mots, key=len) compare les mots par leur longueur — le paramètre key, encore lui.',
                'Traite le cas vide AVANT de calculer.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm1l3e3',
              title: "Défi — Comparer deux corpus",
              instructions: `Mission d'audit complète : on te donne deux corpus (avant/après une migration, ou deux sources de données) et on te demande « sont-ils proches ? ». Écris \`comparer(texte_a, texte_b)\` qui renvoie un dict :

- \`"vocab_commun"\` : nombre de mots présents dans les deux (intersection de sets, opérateur \`&\`),
- \`"specifiques_a"\` : liste **triée** des mots présents uniquement dans A (différence, opérateur \`-\`),
- \`"jaccard"\` : la similarité de Jaccard \`|A ∩ B| / |A ∪ B|\`, arrondie à 3 décimales (l\'union s\'obtient avec \`|\`) — \`0.0\` si les deux sont vides.

L'indice de Jaccard est une mesure de similarité d'ensembles utilisée partout : déduplication, détection de plagiat, comparaison de versions de corpus.`,
              starterCode: `def comparer(texte_a, texte_b):
    ...

r = comparer("le chat dort ici", "le chien dort ailleurs")
for cle, valeur in r.items():
    print(cle, ":", valeur)`,
              solution: `def comparer(texte_a, texte_b):
    a = set(texte_a.lower().split())
    b = set(texte_b.lower().split())
    union = a | b
    return {
        "vocab_commun": len(a & b),
        "specifiques_a": sorted(a - b),
        "jaccard": round(len(a & b) / len(union), 3) if union else 0.0,
    }

r = comparer("le chat dort ici", "le chien dort ailleurs")
for cle, valeur in r.items():
    print(cle, ":", valeur)`,
              tests: `_r = comparer("le chat dort ici", "le chien dort ailleurs")
assert _r["vocab_commun"] == 2, "'le' et 'dort' en commun"
assert _r["specifiques_a"] == ["chat", "ici"], "Spécifiques à A, triés"
assert _r["jaccard"] == round(2 / 6, 3), "2 communs sur 6 mots au total"
_r2 = comparer("même texte", "même texte")
assert _r2["jaccard"] == 1.0 and _r2["specifiques_a"] == [], "Textes identiques : Jaccard 1"
_r3 = comparer("", "")
assert _r3["jaccard"] == 0.0, "Deux vides : 0.0, pas de division par zéro"
assert comparer("Chat", "chat")["jaccard"] == 1.0, "La normalisation doit s'appliquer aux deux textes"
print("TESTS_PASS")`,
              hints: [
                'set(texte.lower().split()) pour chaque texte, puis les opérateurs d\'ensembles : & (intersection), - (différence), | (union).',
                'Gère union vide avant la division.',
                'sorted() sur un set renvoie une liste triée.',
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
