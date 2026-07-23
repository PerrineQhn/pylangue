import type { Module } from '@/lib/types'

export const m13: Module = {
    id: 'm13',
    tier: 3,
    title: 'Agents, tool use et évaluation',
    tagline: 'La boucle agentique et l\'art de mesurer qu\'un système à base de LLM fonctionne vraiment.',
    status: 'ready',
    lessons: [
      {
        id: 'm13l1',
        title: 'La boucle agent',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# Du chatbot à l'agent

Un chatbot répond. Un **agent** *agit* : il décide d'appeler des outils (recherche, calcul, code, API), observe les résultats, et recommence jusqu'à pouvoir répondre. Claude Code, les Deep Research, les agents d'entreprise : tous reposent sur la même boucle, étonnamment simple.

## La boucle canonique

\`\`\`
messages = [question]
tant que True :
    decision = llm(messages)
    si decision est une réponse finale :
        retourne-la
    sinon (c'est un appel d'outil) :
        resultat = executer_outil(decision.outil, decision.args)
        messages += [decision, resultat]     # l'agent VOIT le résultat
\`\`\`

Le point crucial : **le LLM ne fait que décider**. C'est ton code qui exécute les outils, contrôle ce qui est permis, et renvoie les résultats dans l'historique. Le modèle produit du texte structuré ; ton programme fait le reste.

## Les garde-fous non négociables

Une boucle pilotée par un modèle probabiliste *peut* ne jamais s'arrêter, appeler un outil avec des arguments invalides, ou tourner en rond. Tout agent de production a :

- un **budget d'itérations** (max_tours) — jamais de \`while True\` nu,
- une **validation des arguments** avant exécution,
- une gestion d'erreur qui renvoie l'échec *au modèle* (souvent il se corrige au tour suivant !).`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm13l1e1',
              title: 'Implémenter la boucle agent',
              instructions: `Le starter fournit un \`MockLLM\` scripté (il « décide » d'utiliser la calculatrice, puis répond) et un dict \`OUTILS\`. Implémente :

\`executer_agent(llm, question, outils, max_tours=5)\` :

1. initialise \`messages = [{"role": "user", "content": question}]\`,
2. boucle au plus \`max_tours\` fois : appelle \`llm.decider(messages)\`,
3. si la décision a le type \`"reponse"\` → renvoie \`(decision["contenu"], messages)\`,
4. si type \`"outil"\` → exécute \`outils[decision["nom"]](decision["args"])\`, puis ajoute à \`messages\` la décision (role \`"assistant"\`) et le résultat (\`{"role": "outil", "content": resultat}\`),
5. si le budget s'épuise → renvoie \`("[budget épuisé]", messages)\`.`,
              starterCode: `def calculatrice(args):
    return str(eval(args["expression"], {"__builtins__": {}}, {}))

OUTILS = {"calculatrice": calculatrice}

class MockLLM:
    """Scénario scripté : demande un calcul, puis répond avec le résultat."""
    def decider(self, messages):
        derniers = [m for m in messages if m["role"] == "outil"]
        if not derniers:
            return {"type": "outil", "nom": "calculatrice",
                    "args": {"expression": "127 * 43"}}
        return {"type": "reponse",
                "contenu": f"Le résultat est {derniers[-1]['content']}."}

def executer_agent(llm, question, outils, max_tours=5):
    ...

reponse, historique = executer_agent(MockLLM(), "Combien font 127 x 43 ?", OUTILS)
print(reponse)
print(f"{len(historique)} messages dans l'historique")`,
              solution: `def calculatrice(args):
    return str(eval(args["expression"], {"__builtins__": {}}, {}))

OUTILS = {"calculatrice": calculatrice}

class MockLLM:
    def decider(self, messages):
        derniers = [m for m in messages if m["role"] == "outil"]
        if not derniers:
            return {"type": "outil", "nom": "calculatrice",
                    "args": {"expression": "127 * 43"}}
        return {"type": "reponse",
                "contenu": f"Le résultat est {derniers[-1]['content']}."}

def executer_agent(llm, question, outils, max_tours=5):
    messages = [{"role": "user", "content": question}]
    for _ in range(max_tours):
        decision = llm.decider(messages)
        if decision["type"] == "reponse":
            return decision["contenu"], messages
        resultat = outils[decision["nom"]](decision["args"])
        messages.append({"role": "assistant", "content": str(decision)})
        messages.append({"role": "outil", "content": resultat})
    return "[budget épuisé]", messages

reponse, historique = executer_agent(MockLLM(), "Combien font 127 x 43 ?", OUTILS)
print(reponse)
print(f"{len(historique)} messages dans l'historique")`,
              tests: `_r, _h = executer_agent(MockLLM(), "Combien font 127 x 43 ?", OUTILS)
assert _r == "Le résultat est 5461.", "L'agent doit répondre avec le résultat du calcul"
assert len(_h) == 3, "user + assistant (appel d'outil) + outil (résultat) = 3 messages"
assert _h[0]["role"] == "user" and _h[1]["role"] == "assistant" and _h[2]["role"] == "outil", "Ordre des rôles"
assert _h[2]["content"] == "5461", "Le résultat de l'outil doit être dans l'historique"

class _Bavard:
    def decider(self, messages):
        return {"type": "outil", "nom": "calculatrice", "args": {"expression": "1+1"}}
_r2, _h2 = executer_agent(_Bavard(), "?", OUTILS, max_tours=3)
assert _r2 == "[budget épuisé]", "Un agent qui boucle doit être arrêté par le budget"
assert len(_h2) == 7, "1 user + 3 tours x 2 messages = 7"
print("TESTS_PASS")`,
              hints: [
                'La boucle : for _ in range(max_tours), avec le return à l\'intérieur dès qu\'une décision de type "reponse" arrive.',
                'outils[decision["nom"]] récupère la fonction ; appelle-la avec decision["args"].',
                'Le return final ("[budget épuisé]", messages) est APRÈS la boucle — il ne s\'exécute que si elle s\'épuise.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Dans la boucle agent, qui exécute réellement les outils ?',
                options: [
                  'Le LLM, sur les serveurs du fournisseur',
                  'Ton code : le modèle ne produit qu\'une DEMANDE structurée, ton programme décide de l\'exécuter et lui renvoie le résultat',
                  'Le navigateur',
                  'Personne, les outils sont simulés',
                ],
                correct: 1,
                explanation: 'C\'est la frontière de sécurité fondamentale : le modèle propose, ton code dispose. Tu peux valider, filtrer, sandboxer, journaliser — tout passe par toi.',
              },
              {
                question: 'Pourquoi renvoyer les ERREURS d\'outils au modèle plutôt que de crasher ?',
                options: [
                  'Pour cacher les bugs',
                  'Le modèle peut souvent se corriger au tour suivant (reformuler des arguments, essayer un autre outil)',
                  'Les erreurs n\'arrivent jamais',
                  'Pour économiser des tokens',
                ],
                correct: 1,
                explanation: '"File not found" renvoyé à l\'agent → il corrige le chemin et réessaie. C\'est un des comportements qui rendent les agents robustes — à condition que la boucle le permette.',
              },
            ],
          },
        ],
      },
      {
        id: 'm13l2',
        title: 'Évaluer un système LLM',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# La compétence la plus demandée de 2026

Construire une démo LLM prend une journée. Savoir **prouver qu'elle marche** — et qu'elle marche *encore* après un changement de prompt ou de modèle — est ce qui distingue l'ingénieur du bricoleur. Les evals sont devenues le nerf de la guerre.

## Les trois étages de l'évaluation

**1. Métriques exactes** — quand la sortie est vérifiable mécaniquement :

\`\`\`
exact_match : la réponse normalisée est-elle exactement l'attendue ?
inclusion   : la réponse contient-elle l'information clé ?
\`\`\`

Rapides, objectives, parfaites pour l'extraction, la classification, le calcul.

**2. LLM-as-judge** — quand la qualité est subjective (ton, clarté, fidélité à une source) : on demande à un *autre* modèle de noter la réponse selon une grille précise. Puissant mais à manier avec soin : biais de position, préférence pour les réponses longues, auto-complaisance. Règle d'or : **calibrer le juge sur un échantillon annoté par des humains** avant de lui faire confiance.

**3. Métriques métier** — taux de résolution des tickets, satisfaction, coût par requête. La seule vérité finale.

## Le jeu de test (golden set)

Un fichier de cas \`{entrée, sortie attendue}\`, construit à la main, versionné avec le code. À chaque modification du prompt ou du modèle, on rejoue tout et on compare les scores : c'est le *test de régression* du monde LLM. 50 bons exemples battent 5000 exemples médiocres.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm13l2e1',
              title: 'Un harnais d\'évaluation complet',
              instructions: `Implémente :

1. \`normaliser(texte)\` — minuscules, sans ponctuation \`.,!?\`, espaces compactés (tu l'as déjà écrite au module 1 — recommence de mémoire !),
2. \`exact_match(prediction, attendu)\` — \`True\` si les versions normalisées sont égales,
3. \`evaluer(systeme, jeu_de_test)\` — applique \`systeme(entree)\` à chaque cas, calcule le taux d'exact match, et renvoie le dict \`{"score": taux, "echecs": [liste des entrées ratées]}\`.

Le starter fournit un faux système à évaluer.`,
              starterCode: `import re

def systeme_a_evaluer(entree):
    """Un 'modèle' imparfait à évaluer."""
    reponses = {
        "capitale de la France": "Paris.",
        "2 + 2": "4",
        "auteur de 1984": "George Orwell",
        "capitale du Japon": "Kyoto",     # erreur volontaire !
    }
    return reponses.get(entree, "je ne sais pas")

JEU_DE_TEST = [
    {"entree": "capitale de la France", "attendu": "paris"},
    {"entree": "2 + 2", "attendu": "4"},
    {"entree": "auteur de 1984", "attendu": "george orwell"},
    {"entree": "capitale du Japon", "attendu": "tokyo"},
]

def normaliser(texte):
    ...

def exact_match(prediction, attendu):
    ...

def evaluer(systeme, jeu_de_test):
    ...

print(evaluer(systeme_a_evaluer, JEU_DE_TEST))`,
              solution: `import re

def systeme_a_evaluer(entree):
    reponses = {
        "capitale de la France": "Paris.",
        "2 + 2": "4",
        "auteur de 1984": "George Orwell",
        "capitale du Japon": "Kyoto",
    }
    return reponses.get(entree, "je ne sais pas")

JEU_DE_TEST = [
    {"entree": "capitale de la France", "attendu": "paris"},
    {"entree": "2 + 2", "attendu": "4"},
    {"entree": "auteur de 1984", "attendu": "george orwell"},
    {"entree": "capitale du Japon", "attendu": "tokyo"},
]

def normaliser(texte):
    texte = texte.lower()
    texte = re.sub(r"[.,!?]", "", texte)
    texte = re.sub(r"\\s+", " ", texte).strip()
    return texte

def exact_match(prediction, attendu):
    return normaliser(prediction) == normaliser(attendu)

def evaluer(systeme, jeu_de_test):
    echecs = []
    reussites = 0
    for cas in jeu_de_test:
        prediction = systeme(cas["entree"])
        if exact_match(prediction, cas["attendu"]):
            reussites += 1
        else:
            echecs.append(cas["entree"])
    return {"score": reussites / len(jeu_de_test), "echecs": echecs}

print(evaluer(systeme_a_evaluer, JEU_DE_TEST))`,
              tests: `assert normaliser("  Paris. ") == "paris", "Minuscules, sans ponctuation, sans espaces superflus"
assert exact_match("Paris.", "paris"), "'Paris.' et 'paris' doivent matcher après normalisation"
assert not exact_match("Lyon", "paris"), "Des réponses différentes ne matchent pas"
_r = evaluer(systeme_a_evaluer, JEU_DE_TEST)
assert _r["score"] == 0.75, "3 réussites sur 4 : score 0.75"
assert _r["echecs"] == ["capitale du Japon"], "Le seul échec : la capitale du Japon (Kyoto != Tokyo)"
_parfait = lambda e: {"a": "1", "b": "2"}[e]
assert evaluer(_parfait, [{"entree": "a", "attendu": "1"}])["score"] == 1.0, "Système parfait : score 1.0"
print("TESTS_PASS")`,
              hints: [
                'normaliser : lower(), puis re.sub(r"[.,!?]", "", …), puis compactage des espaces (module 3 !).',
                'evaluer : boucle sur les cas, compteur de réussites, liste des entrées en échec, division finale.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi normaliser avant de comparer prédiction et réponse attendue ?',
                options: [
                  'Pour tricher sur les scores',
                  '"Paris." et "paris" sont la même réponse : sans normalisation, on compterait des faux échecs de pure forme',
                  'La normalisation est obligatoire en Python',
                  'Pour accélérer la comparaison',
                ],
                correct: 1,
                explanation: 'Un harnais d\'éval trop strict sur la forme noie les vrais problèmes sous les faux positifs. La normalisation (et ses limites !) est une décision d\'évaluation à part entière.',
              },
              {
                question: 'Quel est le principal danger du LLM-as-judge utilisé sans précaution ?',
                options: [
                  'Il est trop lent',
                  'Ses biais (longueur, position, style) peuvent produire des scores systématiquement faussés — d\'où la calibration sur des annotations humaines',
                  'Il refuse de noter',
                  'Il coûte toujours trop cher',
                ],
                correct: 1,
                explanation: 'Un juge non calibré peut préférer les réponses verbeuses, ou noter différemment selon l\'ordre de présentation. On mesure d\'abord son accord avec des humains sur un échantillon, PUIS on l\'automatise.',
              },
              {
                question: 'Ton nouveau prompt fait passer le score d\'éval de 82 % à 79 %. Que fais-tu ?',
                options: [
                  'Je déploie quand même, 3 points ce n\'est rien',
                  'J\'inspecte les cas passés en échec : régression réelle, cas limites nouveaux, ou bruit d\'échantillonnage — le jeu de test sert exactement à ça',
                  'Je supprime les cas qui échouent du jeu de test',
                  'Je change de métrique',
                ],
                correct: 1,
                explanation: 'Le réflexe de l\'ingénieur : lire les échecs un par un avant toute décision. (Et jamais, jamais retirer les cas gênants — c\'est l\'équivalent LLM de supprimer les tests qui échouent.)',
              },
            ],
          },
        ],
      },
      {
        id: 'm13l3',
        title: 'Calibrer un LLM-juge',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# Peut-on faire confiance au juge ?

Le module précédent l'a annoncé : avant d'automatiser l'évaluation avec un LLM-juge, il faut **mesurer son accord avec des humains**. Un juge, c'est un capteur — et un capteur, ça se calibre. Cette leçon t'apprend à le faire proprement, avec les deux métriques standard.

## Le taux d'accord brut

Sur un échantillon annoté par des humains, la fraction des cas où le juge donne le même verdict :

\`\`\`
accord = verdicts identiques / total
\`\`\`

Simple, mais trompeur : si 90 % des réponses sont « bonnes », un juge paresseux qui dit *toujours* « bonne » atteint 90 % d'accord… sans rien juger du tout.

## Kappa de Cohen : l'accord corrigé du hasard

Le kappa compare l'accord observé à l'accord qu'on obtiendrait *par hasard* vu les distributions de chacun :

\`\`\`
kappa = (accord_observe - accord_hasard) / (1 - accord_hasard)

accord_hasard = P(les deux disent oui) + P(les deux disent non)
              = p_juge_oui × p_humain_oui + p_juge_non × p_humain_non
\`\`\`

- kappa ≈ 1 : accord réel excellent
- kappa ≈ 0 : le juge ne fait pas mieux que le hasard (même si l'accord brut est haut !)
- Repères usuels : < 0.4 faible · 0.4-0.6 modéré · 0.6-0.8 substantiel · > 0.8 excellent

Le juge paresseux du paragraphe précédent ? Accord brut 90 %, **kappa 0** — démasqué. C'est exactement pour ça que les papiers d'évaluation rapportent le kappa, pas l'accord brut.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm13l3e1',
              title: 'Accord et kappa',
              instructions: `Les verdicts sont des listes de booléens (\`True\` = réponse jugée bonne). Implémente :

1. \`taux_accord(juge, humain)\` — fraction des positions où les deux listes coïncident,
2. \`kappa_cohen(juge, humain)\` — la formule du cours : calcule \`p_juge\` (fraction de True chez le juge), \`p_humain\`, puis \`accord_hasard = p_juge * p_humain + (1 - p_juge) * (1 - p_humain)\`, et enfin le kappa. Cas limite : si \`accord_hasard == 1\` (distributions dégénérées), renvoie \`0.0\`,
3. \`juge_fiable(juge, humain, seuil=0.6)\` — \`True\` si le kappa atteint le seuil.`,
              starterCode: `def taux_accord(juge, humain):
    ...

def kappa_cohen(juge, humain):
    ...

def juge_fiable(juge, humain, seuil=0.6):
    ...

humain = [True, True, False, True, False, True, True, False, True, True]
bon_juge = [True, True, False, True, False, True, False, False, True, True]
paresseux = [True] * 10

print("accord bon juge :", taux_accord(bon_juge, humain))
print("kappa bon juge  :", round(kappa_cohen(bon_juge, humain), 3))
print("accord paresseux:", taux_accord(paresseux, humain))
print("kappa paresseux :", round(kappa_cohen(paresseux, humain), 3))`,
              solution: `def taux_accord(juge, humain):
    return sum(1 for j, h in zip(juge, humain) if j == h) / len(humain)

def kappa_cohen(juge, humain):
    n = len(humain)
    p_juge = sum(juge) / n
    p_humain = sum(humain) / n
    accord_hasard = p_juge * p_humain + (1 - p_juge) * (1 - p_humain)
    if accord_hasard == 1:
        return 0.0
    return (taux_accord(juge, humain) - accord_hasard) / (1 - accord_hasard)

def juge_fiable(juge, humain, seuil=0.6):
    return kappa_cohen(juge, humain) >= seuil

humain = [True, True, False, True, False, True, True, False, True, True]
bon_juge = [True, True, False, True, False, True, False, False, True, True]
paresseux = [True] * 10

print("accord bon juge :", taux_accord(bon_juge, humain))
print("kappa bon juge  :", round(kappa_cohen(bon_juge, humain), 3))
print("accord paresseux:", taux_accord(paresseux, humain))
print("kappa paresseux :", round(kappa_cohen(paresseux, humain), 3))`,
              tests: `_h = [True, True, False, True, False, True, True, False, True, True]
_bon = [True, True, False, True, False, True, False, False, True, True]
_par = [True] * 10
assert taux_accord(_h, _h) == 1.0, "Accord parfait avec soi-même"
assert taux_accord(_bon, _h) == 0.9, "9 verdicts sur 10 identiques"
assert taux_accord(_par, _h) == 0.7, "Le paresseux 'gagne' 70 % d'accord brut sans juger"
assert kappa_cohen(_h, _h) == 1.0, "Kappa d'un juge parfait : 1"
assert kappa_cohen(_par, _h) == 0.0, "Kappa du paresseux : 0 — démasqué malgré ses 70 % d'accord !"
_k = kappa_cohen(_bon, _h)
assert 0.7 < _k < 0.85, "Le bon juge : kappa substantiel (~0.78)"
assert juge_fiable(_bon, _h), "kappa > 0.6 : fiable"
assert not juge_fiable(_par, _h), "Le paresseux n'est pas fiable"
assert kappa_cohen([True, True], [True, True]) == 0.0, "Distributions dégénérées (100 % True des deux côtés) : 0.0 par convention"
print("TESTS_PASS")`,
              hints: [
                'taux_accord : zip(juge, humain) puis compter les paires égales.',
                'sum(liste_de_booleens) compte les True — pratique pour p_juge et p_humain.',
                'Suis la formule pas à pas et gère le cas accord_hasard == 1 AVANT la division.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Un juge affiche 85 % d\'accord brut mais un kappa de 0.1. Interprétation ?',
                options: [
                  'Le juge est excellent',
                  'L\'accord vient presque entièrement du hasard (classes déséquilibrées) : ce juge n\'apporte quasiment aucune information',
                  'Le kappa est buggé',
                  'Il faut plus de données',
                ],
                correct: 1,
                explanation: 'Avec 85 % de réponses "bonnes" dans les données, dire toujours "bonne" donne 85 % d\'accord et kappa ≈ 0. Le kappa mesure ce que le juge ajoute AU-DELÀ de la distribution de base — c\'est lui qu\'il faut regarder.',
              },
              {
                question: 'Le juge est calibré (kappa 0.75 sur 100 cas annotés). Que permet-il désormais ?',
                options: [
                  'De remplacer définitivement toute annotation humaine',
                  'D\'évaluer automatiquement des milliers de réponses avec une confiance quantifiée — en re-vérifiant la calibration à chaque changement de prompt ou de modèle',
                  'De générer de meilleures réponses',
                  'Rien de plus qu\'avant',
                ],
                correct: 1,
                explanation: 'La calibration transforme le juge en instrument de mesure documenté. Mais elle périme : nouveau modèle de juge, nouveau prompt, nouveau domaine → nouvel échantillon annoté. Un juge calibré une fois pour toutes n\'existe pas.',
              },
            ],
          },
        ],
      },
    ],
  }
