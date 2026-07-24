import type { Module } from '@/lib/types'

export const m3: Module = {
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

Les données textuelles réelles sont *sales* : URLs, mentions, emojis, HTML résiduel, espaces multiples, ponctuation en pagaille. Les **expressions régulières** (module \`re\`) sont l'outil standard pour les nettoyer et en extraire l'information — indispensables avant tout entraînement ou toute indexation RAG. Savoir les lire et les écrire est aussi essentiel en NLP qu'en revue de code.

## L'idée : décrire un motif, pas un texte exact

Une regex n'est pas une chaîne à chercher, c'est un *motif* qui décrit une famille de chaînes : « un ou plusieurs chiffres », « un @ entouré de lettres », « une URL ». Le moteur parcourt le texte et repère tout ce qui colle au motif.

## Les briques essentielles

- \`.\` n'importe quel caractère · \`\\d\` chiffre · \`\\w\` lettre/chiffre/_ · \`\\s\` espace
- \`+\` une fois ou plus · \`*\` zéro ou plus · \`?\` optionnel · \`{2,4}\` entre 2 et 4 fois
- \`[abc]\` un caractère parmi · \`[^abc]\` tout sauf · \`^\` début · \`$\` fin
- \`()\` groupe de capture · \`|\` alternative

## Les trois fonctions à connaître

\`\`\`
import re

re.findall(r"#\\w+", texte)         # extraire TOUTES les occurrences (liste)
re.sub(r"https?://\\S+", "", texte) # remplacer (ici : supprimer les URLs)
re.search(r"\\d{4}", texte)         # premier match (ou None)
\`\`\`

Le préfixe \`r"..."\` (*raw string*) est capital : il empêche Python d'interpréter les backslashes avant que la regex ne les reçoive. Utilise-le **systématiquement** pour les motifs.

## Où tu retrouveras ça

Les regex sont partout dans le NLP moderne : la pré-tokenisation de GPT est une grosse regex, l'extraction de blocs de code dans les réponses de LLM, la détection de données personnelles à anonymiser, le parsing de logs. C'est un savoir-faire qui ne se démode pas.

## Pièges classiques

- **Oublier le \`r"..."\`.** Sans raw string, \`"\\n"\` devient un saut de ligne *avant* d'atteindre le moteur regex. Avec \`r"\\n"\`, la regex reçoit bien le motif. Réflexe systématique.
- **Le quantificateur gourmand.** \`.*\` avale le maximum possible : \`<.*>\` sur \`<a><b>\` capture \`<a><b>\` entier, pas \`<a>\`. Utilise \`.*?\` (paresseux) quand tu veux le plus court.
- **Confondre groupe capturant et non capturant.** \`(19|20)\` capture et \`findall\` renverra \`"19"\` ou \`"20"\` ; \`(?:19|20)\` groupe sans capturer et renvoie le match entier. Piège très fréquent dans l'extraction.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm3l1e2',
              title: "Extraire années et montants",
              instructions: `Application directe de \`re.findall\` — l'extraction d'entités simple, demandée en permanence :

1. \`annees(texte)\` — toutes les années 1900-2099 : motif \`r"\\b(?:19|20)\\d{2}\\b"\` (le \`(?:...)\` est un groupe **non capturant** : il groupe sans capturer, pour que findall renvoie le match entier),
2. \`montants(texte)\` — tous les montants en euros au format \`"1200 €"\` ou \`"1200€"\` : nombre + espace optionnel + €. Renvoie les chaînes complètes.`,
              starterCode: `import re

def annees(texte):
    ...

def montants(texte):
    ...

t = "Fondée en 1998, rachetée en 2021 pour 450000 € puis revendue 900000€."
print(annees(t))
print(montants(t))`,
              solution: `import re

def annees(texte):
    return re.findall(r"\\b(?:19|20)\\d{2}\\b", texte)

def montants(texte):
    return re.findall(r"\\d+ ?€", texte)

t = "Fondée en 1998, rachetée en 2021 pour 450000 € puis revendue 900000€."
print(annees(t))
print(montants(t))`,
              tests: `assert annees("De 1998 à 2021.") == ["1998", "2021"], "Les deux années"
assert annees("Le code 3021 et l'an 1850") == [], "3021 et 1850 sont hors plage 19xx/20xx"
assert annees("En 2024, tout va bien") == ["2024"], "Année en contexte"
assert montants("Prix : 1200 € ou 999€") == ["1200 €", "999€"], "Avec et sans espace avant €"
assert montants("Aucun prix ici") == [], "Rien à extraire"
print("TESTS_PASS")`,
              hints: [
                'Sans le \\b, "13021" matcherait — les frontières de mot délimitent.',
                'Avec (19|20) SANS ?:, findall renverrait ["19", "20"] au lieu des années complètes. Piège très classique !',
                'Pour les montants : \\d+ puis " ?" (espace optionnel) puis €.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm3l1e3',
              title: "Défi — Anonymiseur de données personnelles",
              instructions: `Obligation RGPD très concrète : avant d'envoyer des textes à une API externe ou de constituer un corpus, on masque les données personnelles. Écris \`anonymiser(texte)\` qui remplace :

1. les **emails** (motif \`r"\\S+@\\S+\\.\\S+"\` suffit ici) par \`[EMAIL]\`,
2. les **téléphones français** (0 suivi de 9 chiffres, séparateurs optionnels : \`r"0\\d(?:[ .-]?\\d{2}){4}"\`) par \`[TEL]\`.

Ordre important : traite les emails d'abord.`,
              starterCode: `import re

def anonymiser(texte):
    ...

t = "Contactez marie.dupont@exemple.fr ou au 06 12 34 56 78 (ou 0612345678)."
print(anonymiser(t))`,
              solution: `import re

def anonymiser(texte):
    texte = re.sub(r"\\S+@\\S+\\.\\S+", "[EMAIL]", texte)
    texte = re.sub(r"0\\d(?:[ .-]?\\d{2}){4}", "[TEL]", texte)
    return texte

t = "Contactez marie.dupont@exemple.fr ou au 06 12 34 56 78 (ou 0612345678)."
print(anonymiser(t))`,
              tests: `assert anonymiser("Écrire à jean@mail.com svp") == "Écrire à [EMAIL] svp", "Email masqué"
assert anonymiser("Tel : 06 12 34 56 78") == "Tel : [TEL]", "Téléphone avec espaces"
assert anonymiser("Tel : 0612345678") == "Tel : [TEL]", "Téléphone compact"
assert anonymiser("Tel : 06.12.34.56.78") == "Tel : [TEL]", "Téléphone avec points"
_r = anonymiser("a@b.fr et 0711223344 et c@d.com")
assert _r == "[EMAIL] et [TEL] et [EMAIL]", "Plusieurs occurrences, tous types"
assert anonymiser("Rien de sensible.") == "Rien de sensible.", "Texte sans PII : inchangé"
print("TESTS_PASS")`,
              hints: [
                'Deux re.sub successifs, chacun sur le résultat du précédent.',
                'Dans le motif téléphone, (?:[ .-]?\\d{2}){4} répète 4 fois "séparateur optionnel + 2 chiffres".',
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

Réponses d'API LLM, datasets Hugging Face, configurations de modèles, logs d'évaluation : **tout est en JSON**. Sa correspondance avec Python est directe et mécanique — la connaître par cœur évite bien des surprises en parsant des réponses d'API.

\`\`\`
objet JSON  -> dict Python
tableau     -> list
string      -> str
number      -> int / float
true/false  -> True/False
null        -> None
\`\`\`

## Les deux fonctions centrales

\`\`\`
import json

data = json.loads(chaine)          # JSON (texte) -> objets Python
chaine = json.dumps(data)          # objets Python -> JSON (texte)
json.dumps(data, indent=2, ensure_ascii=False)  # lisible + accents préservés
\`\`\`

## Naviguer dans du JSON imbriqué

Les réponses d'API sont profondément imbriquées ; la navigation, c'est des crochets en cascade — avec \`.get()\` pour les champs qui peuvent manquer :

\`\`\`
reponse = {"choices": [{"message": {"content": "Bonjour !"}}]}
texte = reponse["choices"][0]["message"]["content"]
usage = reponse.get("usage", {}).get("total_tokens", 0)  # robuste si absent
\`\`\`

## Le format JSONL

Les datasets NLP utilisent souvent le **JSON Lines** : un objet JSON par ligne. C'est le format des fichiers de fine-tuning (OpenAI, Anthropic), des exports de corpus, des logs d'éval — précisément parce qu'il se lit, s'écrit et se *streame* ligne à ligne, sans jamais charger le fichier entier en mémoire.

\`\`\`
for ligne in contenu.splitlines():
    if ligne.strip():          # ignorer les lignes vides
        exemple = json.loads(ligne)
\`\`\`

## Pièges classiques

- **\`data["clé"]\` sur un champ optionnel.** Les réponses d'API varient : un champ présent aujourd'hui peut manquer demain. Enchaîne des \`.get(clé, défaut)\` plutôt que des crochets qui plantent.
- **\`choices[0]\` sans vérifier la liste.** Indexer une liste vide lève une \`IndexError\`. Vérifie qu'elle n'est pas vide avant d'accéder au premier élément.
- **Parser un fichier JSONL comme un seul JSON.** \`json.loads(fichier_entier)\` échoue : le JSONL n'est pas un tableau, c'est un objet *par ligne*. Boucle sur les lignes.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm3l2e2',
              title: "Navigation sûre dans une réponse d'API",
              instructions: `Les réponses d'API LLM sont profondément imbriquées, et chaque champ peut manquer. Écris \`extraire_texte(reponse)\` qui va chercher \`reponse["choices"][0]["message"]["content"]\` et renvoie \`None\` si N'IMPORTE QUEL maillon manque (clé absente, liste vide).

Méthode conseillée : enchaîner les \`.get()\` avec des défauts bien choisis — zéro try/except nécessaire.`,
              starterCode: `def extraire_texte(reponse):
    ...

ok = {"choices": [{"message": {"content": "Bonjour !"}}]}
vide = {"choices": []}
cassee = {"error": "rate limit"}
print(extraire_texte(ok))
print(extraire_texte(vide))
print(extraire_texte(cassee))`,
              solution: `def extraire_texte(reponse):
    choices = reponse.get("choices") or []
    if not choices:
        return None
    message = choices[0].get("message") or {}
    return message.get("content")

ok = {"choices": [{"message": {"content": "Bonjour !"}}]}
vide = {"choices": []}
cassee = {"error": "rate limit"}
print(extraire_texte(ok))
print(extraire_texte(vide))
print(extraire_texte(cassee))`,
              tests: `assert extraire_texte({"choices": [{"message": {"content": "Salut"}}]}) == "Salut", "Chemin complet présent"
assert extraire_texte({"choices": []}) is None, "Liste choices vide"
assert extraire_texte({"error": "boom"}) is None, "Pas de clé choices"
assert extraire_texte({"choices": [{"message": {}}]}) is None, "Pas de content"
assert extraire_texte({"choices": [{}]}) is None, "Pas de message"
assert extraire_texte({}) is None, "Réponse complètement vide"
print("TESTS_PASS")`,
              hints: [
                'À chaque niveau : .get, remplacer None par un défaut ([] ou {}), tester si nécessaire.',
                'choices[0] n\'est sûr QUE si tu as vérifié que la liste n\'est pas vide.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm3l2e3',
              title: "Défi — Fusionner deux datasets JSONL",
              instructions: `Deux équipes ont annoté chacune leur fichier JSONL d'exemples \`{"id": ..., "texte": ..., "label": ...}\`, avec des recouvrements. Écris \`fusionner(contenu_a, contenu_b)\` qui :

1. parse les deux contenus (lignes vides ignorées),
2. déduplique par \`id\` — **en cas de conflit, la version de B gagne** (la plus récente),
3. renvoie la liste des exemples **triée par id**.

Astuce d'architecture : un dict \`id → exemple\` rempli avec A puis écrasé par B fait toute la logique.`,
              starterCode: `import json

A = '{"id": 3, "texte": "ancien", "label": "neg"}\\n{"id": 1, "texte": "bonjour", "label": "pos"}'
B = '{"id": 3, "texte": "corrigé", "label": "pos"}\\n{"id": 2, "texte": "merci", "label": "pos"}'

def fusionner(contenu_a, contenu_b):
    ...

for ex in fusionner(A, B):
    print(ex)`,
              solution: `import json

A = '{"id": 3, "texte": "ancien", "label": "neg"}\\n{"id": 1, "texte": "bonjour", "label": "pos"}'
B = '{"id": 3, "texte": "corrigé", "label": "pos"}\\n{"id": 2, "texte": "merci", "label": "pos"}'

def fusionner(contenu_a, contenu_b):
    par_id = {}
    for contenu in (contenu_a, contenu_b):
        for ligne in contenu.splitlines():
            if ligne.strip():
                ex = json.loads(ligne)
                par_id[ex["id"]] = ex
    return [par_id[i] for i in sorted(par_id)]

for ex in fusionner(A, B):
    print(ex)`,
              tests: `_r = fusionner(A, B)
assert len(_r) == 3, "ids 1, 2, 3 : trois exemples après déduplication"
assert [e["id"] for e in _r] == [1, 2, 3], "Triés par id"
_id3 = [e for e in _r if e["id"] == 3][0]
assert _id3["texte"] == "corrigé" and _id3["label"] == "pos", "En cas de conflit, B écrase A"
assert fusionner("", "") == [], "Deux contenus vides : liste vide"
_solo = fusionner('{"id": 7, "texte": "x", "label": "y"}', "")
assert _solo == [{"id": 7, "texte": "x", "label": "y"}], "Un seul fichier rempli"
print("TESTS_PASS")`,
              hints: [
                'Parcours A puis B dans le même dict par_id : l\'écrasement fait la règle "B gagne" gratuitement.',
                'sorted(par_id) trie les clés ; reconstruis la liste dans cet ordre.',
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
      {
        id: 'm3l3',
        title: 'Mini-projet : parser des logs d\'API LLM',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Des lignes brutes aux données exploitables

Cas réel entre tous : ton application LLM écrit des logs, et ton manager veut savoir *combien ça coûte* et *où ça ralentit*. Le travail : parser des lignes semi-structurées avec une regex, produire des dictionnaires propres, agréger. C'est le quotidien de l'ingénierie LLM — et l'occasion d'apprendre les **groupes nommés**, qui rendent les regex enfin lisibles.

## Groupes nommés : des regex qui se documentent

\`\`\`
motif = r"(?P<modele>[\\w.-]+) \\| (?P<tokens>\\d+) tokens"
m = re.search(motif, ligne)
m.group("modele")     # accès PAR NOM, plus par position
m.groupdict()         # renvoie directement un dict !
\`\`\`

\`(?P<nom>...)\` capture comme \`(...)\`, mais le résultat s'extrait par nom. La regex devient auto-documentée, et \`groupdict()\` fait le pont direct entre le texte et des données structurées.

## Le motif du parser robuste

\`\`\`
for ligne in log.splitlines():
    m = re.search(motif, ligne)
    if m is None:
        continue          # ligne malformée : on saute, on ne crashe pas
    entrees.append(m.groupdict())
\`\`\`

Un parser de logs qui crashe sur une ligne inattendue est inutilisable en production : un flux de plusieurs gigaoctets contient forcément quelques lignes corrompues. Le \`if m is None: continue\` est la version regex de la « couche de défiance ».

## La démarche : parser puis agréger

Le duo qui transforme des logs bruts en décisions : d'abord *parser* chaque ligne en dictionnaire propre (avec les bons types), ensuite *agréger* (coût par modèle, latence par équipe). En une heure de travail, tu deviens la personne qui a rendu les coûts visibles — un vrai capital en entreprise.

## Pièges classiques

- **Oublier d'échapper les caractères spéciaux.** Les crochets \`[ ]\` d'un timestamp \`[09:12:01]\` doivent s'écrire \`\\[\` et \`\\]\` dans le motif — sinon la regex les interprète comme une classe de caractères.
- **Garder les valeurs en chaînes.** \`groupdict()\` renvoie tout en \`str\`. Convertis les nombres (\`int\`, \`float\`) dès le parsing, pas trois couches plus loin quand une addition plante.
- **Crasher sur une ligne malformée.** Un \`re.search\` qui échoue renvoie \`None\` : teste-le et saute la ligne. Ne laisse jamais une donnée corrompue interrompre tout le traitement.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm3l3e1',
              title: 'Analyseur de coûts LLM',
              instructions: `Le starter contient des logs au format \`[HH:MM:SS] modele | entree=N sortie=M\`. Implémente :

1. \`parser_ligne(ligne)\` — utilise une regex à groupes nommés (\`heure\`, \`modele\`, \`entree\`, \`sortie\`) et renvoie le dict avec \`entree\`/\`sortie\` convertis en \`int\` ; renvoie \`None\` si la ligne ne matche pas,
2. \`total_tokens_par_modele(log)\` — parse toutes les lignes (en sautant les malformées) et renvoie \`{modele: total entree+sortie}\`.`,
              starterCode: `import re

LOG = """[09:12:01] gpt-mini | entree=1200 sortie=350
[09:12:44] claude-sonnet | entree=800 sortie=920
ligne corrompue à ignorer
[09:13:10] gpt-mini | entree=400 sortie=100
[09:14:02] claude-sonnet | entree=1500 sortie=600"""

def parser_ligne(ligne):
    ...

def total_tokens_par_modele(log):
    ...

print(parser_ligne("[09:12:01] gpt-mini | entree=1200 sortie=350"))
print(total_tokens_par_modele(LOG))`,
              solution: `import re

LOG = """[09:12:01] gpt-mini | entree=1200 sortie=350
[09:12:44] claude-sonnet | entree=800 sortie=920
ligne corrompue à ignorer
[09:13:10] gpt-mini | entree=400 sortie=100
[09:14:02] claude-sonnet | entree=1500 sortie=600"""

MOTIF = r"\\[(?P<heure>\\d{2}:\\d{2}:\\d{2})\\] (?P<modele>[\\w.-]+) \\| entree=(?P<entree>\\d+) sortie=(?P<sortie>\\d+)"

def parser_ligne(ligne):
    m = re.search(MOTIF, ligne)
    if m is None:
        return None
    d = m.groupdict()
    d["entree"] = int(d["entree"])
    d["sortie"] = int(d["sortie"])
    return d

def total_tokens_par_modele(log):
    totaux = {}
    for ligne in log.splitlines():
        d = parser_ligne(ligne)
        if d is None:
            continue
        totaux[d["modele"]] = totaux.get(d["modele"], 0) + d["entree"] + d["sortie"]
    return totaux

print(parser_ligne("[09:12:01] gpt-mini | entree=1200 sortie=350"))
print(total_tokens_par_modele(LOG))`,
              tests: `_d = parser_ligne("[09:12:01] gpt-mini | entree=1200 sortie=350")
assert _d is not None, "La ligne valide doit être parsée"
assert _d["modele"] == "gpt-mini" and _d["heure"] == "09:12:01", "Groupes nommés : modele et heure"
assert _d["entree"] == 1200 and isinstance(_d["entree"], int), "entree doit être un int, pas une chaîne"
assert parser_ligne("n'importe quoi") is None, "Ligne malformée : None, pas une exception"
_t = total_tokens_par_modele(LOG)
assert _t == {"gpt-mini": 2050, "claude-sonnet": 3820}, "gpt-mini : 1200+350+400+100 ; claude-sonnet : 800+920+1500+600"
print("TESTS_PASS")`,
              hints: [
                'N\'oublie pas d\'échapper les crochets du timestamp : \\[ et \\].',
                'groupdict() renvoie tout en chaînes : convertis entree et sortie avec int().',
                'total_tokens_par_modele : le motif de comptage habituel, en sautant les None.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm3l3e2',
              title: "Filtrer les logs par plage horaire",
              instructions: `Suite de l'analyse : « montre-moi ce qui s'est passé entre 9h et 9h13 ». Sur des entrées déjà parsées (dicts avec la clé \`"heure"\` au format \`"HH:MM:SS"\`), écris :

1. \`entre(entrees, debut, fin)\` — les entrées dont l'heure est dans \`[debut, fin]\` inclus. Bonus de simplicité : au format HH:MM:SS, la comparaison de **chaînes** suit l'ordre chronologique — aucun parsing de date nécessaire,
2. \`premiere_apres(entrees, heure)\` — la première entrée strictement après \`heure\` (ordre du fichier), ou \`None\`.`,
              starterCode: `ENTREES = [
    {"heure": "09:05:00", "modele": "gpt-mini"},
    {"heure": "09:12:44", "modele": "claude-sonnet"},
    {"heure": "09:13:10", "modele": "gpt-mini"},
    {"heure": "10:02:00", "modele": "claude-sonnet"},
]

def entre(entrees, debut, fin):
    ...

def premiere_apres(entrees, heure):
    ...

print(entre(ENTREES, "09:00:00", "09:13:00"))
print(premiere_apres(ENTREES, "09:12:44"))`,
              solution: `ENTREES = [
    {"heure": "09:05:00", "modele": "gpt-mini"},
    {"heure": "09:12:44", "modele": "claude-sonnet"},
    {"heure": "09:13:10", "modele": "gpt-mini"},
    {"heure": "10:02:00", "modele": "claude-sonnet"},
]

def entre(entrees, debut, fin):
    return [e for e in entrees if debut <= e["heure"] <= fin]

def premiere_apres(entrees, heure):
    for e in entrees:
        if e["heure"] > heure:
            return e
    return None

print(entre(ENTREES, "09:00:00", "09:13:00"))
print(premiere_apres(ENTREES, "09:12:44"))`,
              tests: `_r = entre(ENTREES, "09:00:00", "09:13:00")
assert len(_r) == 2, "Deux entrées entre 09:00:00 et 09:13:00"
assert _r[0]["heure"] == "09:05:00", "La première de la plage"
assert entre(ENTREES, "09:12:44", "09:12:44") == [ENTREES[1]], "Bornes incluses"
assert entre(ENTREES, "23:00:00", "23:59:59") == [], "Plage vide"
assert premiere_apres(ENTREES, "09:12:44")["heure"] == "09:13:10", "Strictement après"
assert premiere_apres(ENTREES, "11:00:00") is None, "Rien après : None"
print("TESTS_PASS")`,
              hints: [
                'debut <= e["heure"] <= fin — la double comparaison chaînée de Python.',
                'premiere_apres : un for avec return dès le premier match ; le return None après la boucle.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm3l3e3',
              title: "Défi — La facture par modèle",
              instructions: `Le rapport final pour ton manager. À partir d'entrées parsées (\`{"modele", "entree", "sortie"}\`) et d'une grille tarifaire \`{modele: (prix_entree, prix_sortie)}\` en € par token, écris \`facture(entrees, tarifs)\` qui renvoie un dict \`modele → coût total arrondi à 4 décimales\`.

Cas réel à gérer : un modèle absent de la grille est facturé au **tarif par défaut** \`tarifs["defaut"]\` (toujours présent).`,
              starterCode: `ENTREES = [
    {"modele": "gpt-mini", "entree": 1000, "sortie": 500},
    {"modele": "claude-sonnet", "entree": 2000, "sortie": 1000},
    {"modele": "gpt-mini", "entree": 500, "sortie": 100},
    {"modele": "modele-mystere", "entree": 100, "sortie": 100},
]

TARIFS = {
    "gpt-mini": (0.00000015, 0.0000006),
    "claude-sonnet": (0.000003, 0.000015),
    "defaut": (0.000001, 0.000002),
}

def facture(entrees, tarifs):
    ...

for modele, cout in facture(ENTREES, TARIFS).items():
    print(f"{modele} : {cout} €")`,
              solution: `ENTREES = [
    {"modele": "gpt-mini", "entree": 1000, "sortie": 500},
    {"modele": "claude-sonnet", "entree": 2000, "sortie": 1000},
    {"modele": "gpt-mini", "entree": 500, "sortie": 100},
    {"modele": "modele-mystere", "entree": 100, "sortie": 100},
]

TARIFS = {
    "gpt-mini": (0.00000015, 0.0000006),
    "claude-sonnet": (0.000003, 0.000015),
    "defaut": (0.000001, 0.000002),
}

def facture(entrees, tarifs):
    totaux = {}
    for e in entrees:
        prix_in, prix_out = tarifs.get(e["modele"], tarifs["defaut"])
        cout = e["entree"] * prix_in + e["sortie"] * prix_out
        totaux[e["modele"]] = totaux.get(e["modele"], 0.0) + cout
    return {m: round(c, 4) for m, c in totaux.items()}

for modele, cout in facture(ENTREES, TARIFS).items():
    print(f"{modele} : {cout} €")`,
              tests: `_f = facture(ENTREES, TARIFS)
assert _f["claude-sonnet"] == round(2000 * 0.000003 + 1000 * 0.000015, 4), "entrée x prix_in + sortie x prix_out"
_gm = 1000 * 0.00000015 + 500 * 0.0000006 + 500 * 0.00000015 + 100 * 0.0000006
assert _f["gpt-mini"] == round(_gm, 4), "Les deux appels gpt-mini cumulés"
assert _f["modele-mystere"] == round(100 * 0.000001 + 100 * 0.000002, 4), "Modèle inconnu : tarif par défaut"
assert facture([], TARIFS) == {}, "Aucune entrée : dict vide"
print("TESTS_PASS")`,
              hints: [
                'tarifs.get(modele, tarifs["defaut"]) déballe en (prix_in, prix_out).',
                'Le motif d\'accumulation habituel, puis un arrondi final en dict comprehension.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Quel avantage des groupes nommés (?P<nom>...) sur les groupes positionnels ?',
                options: [
                  'Ils sont plus rapides',
                  'L\'extraction se fait par nom (m.group("modele"), groupdict()) : la regex reste lisible et robuste aux réorganisations',
                  'Ils matchent plus de texte',
                  'Ils sont obligatoires depuis Python 3.10',
                ],
                correct: 1,
                explanation: 'Avec 6 groupes positionnels, ajouter un champ au milieu décale tous les indices — bug garanti. Les noms rendent le parser maintenable. groupdict() fait le pont direct regex → données structurées.',
              },
              {
                question: 'Pourquoi le parser renvoie-t-il None au lieu de lever une exception sur une ligne malformée ?',
                options: [
                  'Les exceptions sont interdites en Python',
                  'Dans un flux de milliers de lignes, quelques lignes corrompues sont NORMALES : on les saute et on continue, éventuellement en les comptant',
                  'None est plus rapide',
                  'Pour économiser de la mémoire',
                ],
                correct: 1,
                explanation: 'Un pipeline de données réel est tolérant par conception : il traite ce qui est valide et journalise le reste. Crasher au premier accroc sur un log de production de 2 Go n\'est pas une option.',
              },
            ],
          },
        ],
      },
    ],
  }
