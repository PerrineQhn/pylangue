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
      {
        id: 'm3l3',
        title: 'Mini-projet : parser des logs d\'API LLM',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Des lignes brutes aux données exploitables

Cas réel entre tous : ton application LLM écrit des logs, et tu veux savoir *combien ça coûte* et *où ça ralentit*. Le travail : parser des lignes semi-structurées avec une regex, produire des dicts propres, agréger. C'est le quotidien de l'ingénierie LLM — et l'occasion d'apprendre les **groupes nommés**.

## Groupes nommés : des regex lisibles

\`\`\`
motif = r"(?P<modele>[\\w.-]+) \\| (?P<tokens>\\d+) tokens"
m = re.search(motif, ligne)
m.group("modele")     # accès PAR NOM, plus par position
m.groupdict()         # directement un dict !
\`\`\`

\`(?P<nom>...)\` capture comme \`(...)\`, mais le résultat s'extrait par nom — la regex devient auto-documentée, et \`groupdict()\` te donne un dictionnaire prêt à l'emploi.

## Le motif du parser robuste

\`\`\`
for ligne in log.splitlines():
    m = re.search(motif, ligne)
    if m is None:
        continue          # ligne malformée : on saute, on ne crashe pas
    entrees.append(m.groupdict())
\`\`\`

Un parser de logs qui crashe sur une ligne inattendue est inutilisable. Le \`if m is None: continue\` est la version regex de la « couche de défiance » du module 11.`,
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
