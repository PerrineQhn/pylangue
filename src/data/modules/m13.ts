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

Un chatbot répond. Un **agent** *agit* : il décide d'appeler des outils (recherche, calcul, code, API), observe les résultats, et recommence jusqu'à pouvoir répondre. Claude Code, les « Deep Research », les agents d'entreprise : tous reposent sur la même boucle, étonnamment simple. La connaître à nu te rend autonome vis-à-vis des frameworks qui l'enrobent.

## La boucle canonique

\`\`\`
messages = [question]
tant que True :
    decision = llm(messages)
    si decision est une réponse finale :
        retourner-la
    sinon (c'est un appel d'outil) :
        resultat = executer_outil(decision.outil, decision.args)
        messages += [decision, resultat]     # l'agent VOIT le résultat
\`\`\`

Le point crucial : **le LLM ne fait que décider**. C'est *ton code* qui exécute les outils, contrôle ce qui est permis, et renvoie les résultats dans l'historique. Le modèle produit du texte structuré (« je veux appeler la calculatrice avec 6×7 ») ; ton programme fait le reste. C'est la frontière de sécurité fondamentale : le modèle propose, ton code dispose.

## Les garde-fous non négociables

Une boucle pilotée par un modèle probabiliste *peut* ne jamais s'arrêter, appeler un outil avec des arguments invalides, ou tourner en rond. Tout agent de production possède :

- un **budget d'itérations** (\`max_tours\`) — jamais de \`while True\` nu ;
- une **validation des arguments** avant exécution (liste blanche d'outils, vérification des types) ;
- une gestion d'erreur qui renvoie l'échec *au modèle* — souvent, il se corrige au tour suivant.

## Pièges classiques

- **Exécuter une décision sans la valider.** Un modèle peut « décider » d'appeler un outil inexistant ou dangereux. Valide le nom (liste blanche) et les arguments *avant* toute exécution.
- **La boucle infinie.** Sans budget d'itérations, un agent qui hésite peut tourner indéfiniment — et facturer à chaque tour. Le \`max_tours\` est obligatoire.
- **Cacher les erreurs d'outils.** Renvoyer « fichier introuvable » *au modèle* lui permet de corriger le chemin et réessayer. Crasher à la place casse cette capacité d'auto-réparation.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm13l1e2',
              title: "Valider les décisions de l'agent",
              instructions: `Ne JAMAIS exécuter une décision de LLM sans la valider — c'est la frontière de sécurité. Écris \`valider_decision(decision, outils)\` qui renvoie \`(True, "")\` ou \`(False, raison)\` :

- \`"type manquant"\` si la clé \`type\` est absente,
- \`"type inconnu : X"\` si le type n'est ni \`"reponse"\` ni \`"outil"\`,
- pour un outil : \`"outil inconnu : X"\` si le nom n'est pas dans le dict \`outils\`, \`"args invalides"\` si \`args\` absent ou pas un dict,
- pour une réponse : \`"contenu manquant"\` si \`contenu\` absent.`,
              starterCode: `OUTILS = {"calculatrice": None, "recherche": None}

def valider_decision(decision, outils):
    ...

print(valider_decision({"type": "outil", "nom": "calculatrice", "args": {"expression": "1+1"}}, OUTILS))
print(valider_decision({"type": "outil", "nom": "rm_rf", "args": {}}, OUTILS))
print(valider_decision({"type": "poeme"}, OUTILS))`,
              solution: `OUTILS = {"calculatrice": None, "recherche": None}

def valider_decision(decision, outils):
    if "type" not in decision:
        return False, "type manquant"
    t = decision["type"]
    if t not in ("reponse", "outil"):
        return False, f"type inconnu : {t}"
    if t == "outil":
        nom = decision.get("nom")
        if nom not in outils:
            return False, f"outil inconnu : {nom}"
        if not isinstance(decision.get("args"), dict):
            return False, "args invalides"
    else:
        if "contenu" not in decision:
            return False, "contenu manquant"
    return True, ""

print(valider_decision({"type": "outil", "nom": "calculatrice", "args": {"expression": "1+1"}}, OUTILS))
print(valider_decision({"type": "outil", "nom": "rm_rf", "args": {}}, OUTILS))
print(valider_decision({"type": "poeme"}, OUTILS))`,
              tests: `assert valider_decision({"type": "outil", "nom": "calculatrice", "args": {}}, OUTILS) == (True, ""), "Outil connu, args dict : valide"
assert valider_decision({"type": "reponse", "contenu": "ok"}, OUTILS) == (True, ""), "Réponse avec contenu : valide"
assert valider_decision({}, OUTILS) == (False, "type manquant"), "Dict vide"
assert valider_decision({"type": "poeme"}, OUTILS) == (False, "type inconnu : poeme"), "Type fantaisiste"
assert valider_decision({"type": "outil", "nom": "rm_rf", "args": {}}, OUTILS) == (False, "outil inconnu : rm_rf"), "Outil hors liste blanche : REFUSÉ"
assert valider_decision({"type": "outil", "nom": "recherche", "args": "oups"}, OUTILS) == (False, "args invalides"), "args doit être un dict"
assert valider_decision({"type": "reponse"}, OUTILS) == (False, "contenu manquant"), "Réponse sans contenu"
print("TESTS_PASS")`,
              hints: [
                'Une cascade de vérifications, du plus général au plus spécifique, avec return anticipé.',
                'isinstance(decision.get("args"), dict) couvre à la fois absent et mauvais type.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm13l1e3',
              title: "Défi — L'agent blindé, avec journal",
              instructions: `La version production de ta boucle : \`executer_agent_securise(llm, question, outils, max_tours)\` combine tout :

1. valide chaque décision (\`valider_decision\` fournie) — décision invalide : ajoute \`"decision invalide : <raison>"\` au journal et renvoie ce message au LLM comme résultat d'outil (role \`outil\`) pour qu'il se corrige,
2. décision valide type outil : exécute, journalise \`"outil : <nom>"\`, ajoute le résultat à l'historique,
3. type réponse : journalise \`"reponse"\` et renvoie \`(contenu, journal)\`,
4. budget épuisé : renvoie \`("[budget épuisé]", journal)\`.`,
              starterCode: `def valider_decision(decision, outils):
    if "type" not in decision:
        return False, "type manquant"
    t = decision["type"]
    if t not in ("reponse", "outil"):
        return False, f"type inconnu : {t}"
    if t == "outil":
        if decision.get("nom") not in outils:
            return False, f"outil inconnu : {decision.get('nom')}"
        if not isinstance(decision.get("args"), dict):
            return False, "args invalides"
    elif "contenu" not in decision:
        return False, "contenu manquant"
    return True, ""

OUTILS = {"calculatrice": lambda args: str(eval(args["expression"], {"__builtins__": {}}, {}))}

class MockCapricieux:
    # Demande un outil INTERDIT, puis se corrige, puis répond.
    def __init__(self):
        self.etape = 0
    def decider(self, messages):
        self.etape += 1
        if self.etape == 1:
            return {"type": "outil", "nom": "acces_disque", "args": {}}
        if self.etape == 2:
            return {"type": "outil", "nom": "calculatrice", "args": {"expression": "6*7"}}
        return {"type": "reponse", "contenu": f"Résultat : {messages[-1]['content']}"}

def executer_agent_securise(llm, question, outils, max_tours=5):
    ...

reponse, journal = executer_agent_securise(MockCapricieux(), "Combien font 6x7 ?", OUTILS)
print(reponse)
print(journal)`,
              solution: `def valider_decision(decision, outils):
    if "type" not in decision:
        return False, "type manquant"
    t = decision["type"]
    if t not in ("reponse", "outil"):
        return False, f"type inconnu : {t}"
    if t == "outil":
        if decision.get("nom") not in outils:
            return False, f"outil inconnu : {decision.get('nom')}"
        if not isinstance(decision.get("args"), dict):
            return False, "args invalides"
    elif "contenu" not in decision:
        return False, "contenu manquant"
    return True, ""

OUTILS = {"calculatrice": lambda args: str(eval(args["expression"], {"__builtins__": {}}, {}))}

class MockCapricieux:
    def __init__(self):
        self.etape = 0
    def decider(self, messages):
        self.etape += 1
        if self.etape == 1:
            return {"type": "outil", "nom": "acces_disque", "args": {}}
        if self.etape == 2:
            return {"type": "outil", "nom": "calculatrice", "args": {"expression": "6*7"}}
        return {"type": "reponse", "contenu": f"Résultat : {messages[-1]['content']}"}

def executer_agent_securise(llm, question, outils, max_tours=5):
    messages = [{"role": "user", "content": question}]
    journal = []
    for _ in range(max_tours):
        decision = llm.decider(messages)
        ok, raison = valider_decision(decision, outils)
        if not ok:
            journal.append(f"decision invalide : {raison}")
            messages.append({"role": "outil", "content": f"decision invalide : {raison}"})
            continue
        if decision["type"] == "reponse":
            journal.append("reponse")
            return decision["contenu"], journal
        resultat = outils[decision["nom"]](decision["args"])
        journal.append(f"outil : {decision['nom']}")
        messages.append({"role": "assistant", "content": str(decision)})
        messages.append({"role": "outil", "content": resultat})
    return "[budget épuisé]", journal

reponse, journal = executer_agent_securise(MockCapricieux(), "Combien font 6x7 ?", OUTILS)
print(reponse)
print(journal)`,
              tests: `_r, _j = executer_agent_securise(MockCapricieux(), "Combien font 6x7 ?", OUTILS)
assert _r == "Résultat : 42", "L'agent aboutit malgré le faux départ"
assert _j == ["decision invalide : outil inconnu : acces_disque", "outil : calculatrice", "reponse"], "Le journal raconte toute l'histoire"

class _Fou:
    def decider(self, messages):
        return {"type": "outil", "nom": "acces_disque", "args": {}}
_r2, _j2 = executer_agent_securise(_Fou(), "?", OUTILS, max_tours=3)
assert _r2 == "[budget épuisé]", "Un agent qui insiste sur l'interdit est arrêté par le budget"
assert len(_j2) == 3 and all("invalide" in e for e in _j2), "3 refus journalisés"
print("TESTS_PASS")`,
              hints: [
                'La décision invalide ne consomme pas d\'outil : on renvoie la raison AU MODÈLE (message role outil) et on continue la boucle.',
                'Le journal est une simple liste de chaînes, appendée à chaque événement.',
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

Construire une démo LLM prend une journée. Savoir **prouver qu'elle marche** — et qu'elle marche *encore* après un changement de prompt ou de modèle — est ce qui distingue l'ingénieur du bricoleur. Les evals sont devenues le nerf de la guerre, au point qu'« eval engineer » est un intitulé de poste à part entière.

## Les trois étages de l'évaluation

**1. Métriques exactes** — quand la sortie est vérifiable mécaniquement :

\`\`\`
exact_match : la réponse normalisée est-elle exactement l'attendue ?
inclusion   : la réponse contient-elle l'information clé ?
\`\`\`

Rapides, objectives, parfaites pour l'extraction, la classification, le calcul.

**2. LLM-as-judge** — quand la qualité est subjective (ton, clarté, fidélité à une source) : on demande à un *autre* modèle de noter la réponse selon une grille précise. Puissant, mais à manier avec précaution (biais de position, préférence pour les réponses longues, auto-complaisance). Règle d'or : **calibrer le juge** sur un échantillon annoté par des humains avant de lui faire confiance (leçon suivante).

**3. Métriques métier** — taux de résolution des tickets, satisfaction, coût par requête. La seule vérité finale.

## Le jeu de test (golden set)

Un fichier de cas \`{entrée, sortie attendue}\`, construit à la main et versionné avec le code. À chaque modification du prompt ou du modèle, on rejoue *tout* et on compare les scores : c'est le **test de régression** du monde LLM. 50 bons exemples battent 5 000 exemples médiocres.

## Lire au-delà de la moyenne

Un score global qui monte peut cacher des *régressions* graves : le nouveau prompt gagne sur dix cas mais casse trois cas critiques. D'où l'importance de lister les cas passés de réussite à échec (et l'inverse), pas seulement le delta moyen.

## Pièges classiques

- **Un exact match trop strict.** « Paris » et « paris. » sont la même réponse : sans normalisation, tu comptes des faux échecs de pure forme qui noient les vrais problèmes.
- **Supprimer les cas gênants du jeu de test.** L'équivalent LLM de supprimer les tests qui échouent : on se ment à soi-même. On lit les échecs, on ne les efface pas.
- **Ne regarder que la moyenne.** Toujours inspecter les régressions cas par cas avant de déployer — une amélioration moyenne peut masquer une catastrophe locale.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm13l2e2',
              title: "L'inclusion : plus souple que l'exact match",
              instructions: `L'exact match est trop strict pour les réponses en langage naturel : « La capitale est Paris » doit compter juste si l'attendu est « paris ». Écris :

1. \`inclusion(prediction, attendu)\` — \`True\` si l'attendu normalisé est **contenu dans** la prédiction normalisée (\`normaliser\` fournie),
2. \`inclusion_multiple(prediction, attendus)\` — \`True\` si AU MOINS UN des attendus (liste de variantes acceptables) est inclus.

C'est la métrique des benchmarks de QA (SQuAD et compagnie) — et son défaut est aussi à connaître : « la réponse n'est PAS paris » contient « paris »…`,
              starterCode: `import re

def normaliser(texte):
    texte = texte.lower()
    texte = re.sub(r"[.,!?]", "", texte)
    return re.sub(r"\s+", " ", texte).strip()

def inclusion(prediction, attendu):
    ...

def inclusion_multiple(prediction, attendus):
    ...

print(inclusion("La capitale est Paris.", "paris"))
print(inclusion_multiple("Il s'agit de l'Hexagone", ["france", "hexagone"]))`,
              solution: `import re

def normaliser(texte):
    texte = texte.lower()
    texte = re.sub(r"[.,!?]", "", texte)
    return re.sub(r"\s+", " ", texte).strip()

def inclusion(prediction, attendu):
    return normaliser(attendu) in normaliser(prediction)

def inclusion_multiple(prediction, attendus):
    return any(inclusion(prediction, a) for a in attendus)

print(inclusion("La capitale est Paris.", "paris"))
print(inclusion_multiple("Il s'agit de l'Hexagone", ["france", "hexagone"]))`,
              tests: `assert inclusion("La capitale est Paris.", "paris"), "Ponctuation et casse ignorées"
assert not inclusion("La capitale est Lyon", "paris"), "Mauvaise réponse"
assert inclusion("PARIS", "Paris."), "Normalisation des deux côtés"
assert inclusion_multiple("Il s'agit de l'Hexagone", ["france", "hexagone"]), "Une variante suffit"
assert not inclusion_multiple("Aucune idée", ["france", "hexagone"]), "Aucune variante"
assert inclusion("la réponse n'est pas paris", "paris"), "LE défaut connu de l'inclusion : les négations passent — d'où le LLM-juge pour les cas fins"
print("TESTS_PASS")`,
              hints: [
                'normaliser les DEUX chaînes, puis l\'opérateur in.',
                'any(...) sur les variantes pour la version multiple.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm13l2e3',
              title: "Défi — Comparer deux prompts en A/B",
              instructions: `LA question qu'on te posera chaque semaine : « le nouveau prompt est-il meilleur ? ». Écris \`comparer_ab(systeme_a, systeme_b, jeu, metrique)\` qui renvoie :

- \`"score_a"\`, \`"score_b"\` : les taux de réussite (arrondis à 3 décimales),
- \`"regressions"\` : les entrées où A réussissait et B échoue — LES cas à lire en priorité,
- \`"gains"\` : l'inverse,
- \`"verdict"\` : \`"b_meilleur"\`, \`"a_meilleur"\` ou \`"egalite"\`.

Une amélioration moyenne peut cacher des régressions graves : c'est tout l'intérêt de lister les deux colonnes plutôt qu'un simple delta.`,
              starterCode: `def systeme_a(entree):
    return {"q1": "paris", "q2": "4", "q3": "bleu", "q4": "je ne sais pas"}[entree]

def systeme_b(entree):
    return {"q1": "paris", "q2": "quatre", "q3": "bleu", "q4": "berlin"}[entree]

JEU = [
    {"entree": "q1", "attendu": "paris"},
    {"entree": "q2", "attendu": "4"},
    {"entree": "q3", "attendu": "bleu"},
    {"entree": "q4", "attendu": "berlin"},
]

def metrique(prediction, attendu):
    return prediction.strip().lower() == attendu

def comparer_ab(systeme_a, systeme_b, jeu, metrique):
    ...

import json
print(json.dumps(comparer_ab(systeme_a, systeme_b, JEU, metrique), ensure_ascii=False, indent=2))`,
              solution: `def systeme_a(entree):
    return {"q1": "paris", "q2": "4", "q3": "bleu", "q4": "je ne sais pas"}[entree]

def systeme_b(entree):
    return {"q1": "paris", "q2": "quatre", "q3": "bleu", "q4": "berlin"}[entree]

JEU = [
    {"entree": "q1", "attendu": "paris"},
    {"entree": "q2", "attendu": "4"},
    {"entree": "q3", "attendu": "bleu"},
    {"entree": "q4", "attendu": "berlin"},
]

def metrique(prediction, attendu):
    return prediction.strip().lower() == attendu

def comparer_ab(systeme_a, systeme_b, jeu, metrique):
    ok_a, ok_b = [], []
    for cas in jeu:
        ok_a.append(metrique(systeme_a(cas["entree"]), cas["attendu"]))
        ok_b.append(metrique(systeme_b(cas["entree"]), cas["attendu"]))
    n = len(jeu)
    score_a = round(sum(ok_a) / n, 3)
    score_b = round(sum(ok_b) / n, 3)
    regressions = [jeu[i]["entree"] for i in range(n) if ok_a[i] and not ok_b[i]]
    gains = [jeu[i]["entree"] for i in range(n) if ok_b[i] and not ok_a[i]]
    if score_b > score_a:
        verdict = "b_meilleur"
    elif score_a > score_b:
        verdict = "a_meilleur"
    else:
        verdict = "egalite"
    return {"score_a": score_a, "score_b": score_b,
            "regressions": regressions, "gains": gains, "verdict": verdict}

import json
print(json.dumps(comparer_ab(systeme_a, systeme_b, JEU, metrique), ensure_ascii=False, indent=2))`,
              tests: `_r = comparer_ab(systeme_a, systeme_b, JEU, metrique)
assert _r["score_a"] == 0.75 and _r["score_b"] == 0.75, "3/4 chacun"
assert _r["regressions"] == ["q2"], "B a cassé q2 (répond 'quatre' au lieu de '4')"
assert _r["gains"] == ["q4"], "B a gagné q4"
assert _r["verdict"] == "egalite", "Scores égaux… mais les listes racontent une autre histoire !"
_r2 = comparer_ab(systeme_a, systeme_a, JEU, metrique)
assert _r2["regressions"] == [] and _r2["gains"] == [] and _r2["verdict"] == "egalite", "Un système contre lui-même"
print("TESTS_PASS")`,
              hints: [
                'Évalue les deux systèmes cas par cas dans des listes de booléens parallèles.',
                'Régression = ok_a[i] and not ok_b[i]. Gain = l\'inverse.',
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

La leçon précédente l'a annoncé : avant d'automatiser l'évaluation avec un LLM-juge, il faut **mesurer son accord avec des humains**. Un juge, c'est un capteur — et un capteur, ça se calibre. Cette leçon t'apprend à le faire proprement, avec les deux métriques standard.

## Le taux d'accord brut, et son mensonge

Sur un échantillon annoté par des humains, la fraction des cas où le juge donne le même verdict :

\`\`\`
accord = verdicts identiques / total
\`\`\`

Simple, mais trompeur : si 90 % des réponses sont « bonnes », un juge paresseux qui répond *toujours* « bonne » atteint 90 % d'accord… sans rien juger du tout. L'accord brut ne fait pas la différence entre un vrai juge et une girouette.

## Kappa de Cohen : l'accord corrigé du hasard

Le kappa compare l'accord *observé* à celui qu'on obtiendrait *par pur hasard*, compte tenu des tendances de chacun :

\`\`\`
kappa = (accord_observé - accord_hasard) / (1 - accord_hasard)

accord_hasard = P(les deux disent oui) + P(les deux disent non)
              = p_juge_oui × p_humain_oui + p_juge_non × p_humain_non
\`\`\`

- kappa ≈ 1 : accord réel excellent,
- kappa ≈ 0 : le juge ne fait pas mieux que le hasard (même si l'accord brut est haut !).

Repères usuels : < 0,4 faible · 0,4-0,6 modéré · 0,6-0,8 substantiel · > 0,8 excellent. Le juge paresseux du paragraphe précédent ? Accord brut 90 %, **kappa 0** — démasqué. C'est exactement pour ça que les articles d'évaluation rapportent le kappa, pas l'accord brut.

## Une calibration qui périme

Un juge calibré une fois pour toutes n'existe pas. Nouveau modèle de juge, nouveau prompt, nouveau domaine → nouvel échantillon annoté. La calibration transforme le juge en instrument de mesure *documenté*, à revérifier régulièrement.

## Pièges classiques

- **Se fier à l'accord brut sur des classes déséquilibrées.** C'est là qu'il ment le plus. Regarde toujours le kappa, qui mesure ce que le juge ajoute *au-delà* de la distribution de base.
- **Oublier le cas des distributions dégénérées.** Si tout le monde dit « oui » à 100 %, l'accord hasard vaut 1 et le kappa devient indéfini (division par zéro) : renvoie 0 par convention.
- **Automatiser un juge non calibré.** C'est un générateur de fausse assurance : il produit des scores qui *paraissent* rigoureux mais ne mesurent rien de fiable.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm13l3e2',
              title: "La matrice d'accord détaillée",
              instructions: `Avant le kappa, le tableau croisé — il montre OÙ le juge diverge : \`matrice_accord(juge, humain)\` renvoie \`{"oui_oui": n, "oui_non": n, "non_oui": n, "non_non": n}\` (juge d'abord : \`oui_non\` = juge dit oui, humain dit non — les **faux positifs du juge**, souvent les plus dangereux car ils laissent passer de mauvaises réponses).`,
              starterCode: `def matrice_accord(juge, humain):
    ...

juge   = [True, True, False, True, False]
humain = [True, False, False, True, True]
print(matrice_accord(juge, humain))`,
              solution: `def matrice_accord(juge, humain):
    m = {"oui_oui": 0, "oui_non": 0, "non_oui": 0, "non_non": 0}
    for j, h in zip(juge, humain):
        if j and h:
            m["oui_oui"] += 1
        elif j and not h:
            m["oui_non"] += 1
        elif not j and h:
            m["non_oui"] += 1
        else:
            m["non_non"] += 1
    return m

juge   = [True, True, False, True, False]
humain = [True, False, False, True, True]
print(matrice_accord(juge, humain))`,
              tests: `_m = matrice_accord([True, True, False, True, False], [True, False, False, True, True])
assert _m == {"oui_oui": 2, "oui_non": 1, "non_oui": 1, "non_non": 1}, "Le tableau croisé complet"
_p = matrice_accord([True, False], [True, False])
assert _p == {"oui_oui": 1, "oui_non": 0, "non_oui": 0, "non_non": 1}, "Accord parfait : diagonale seulement"
assert sum(_m.values()) == 5, "Les quatre cases couvrent tous les cas"
print("TESTS_PASS")`,
              hints: [
                'zip(juge, humain) puis quatre branches — ou un dict indexé par le couple (j, h).',
                'La convention : le juge en premier dans le nom des clés.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm13l3e3',
              title: "Défi — Le concours de juges",
              instructions: `Tu as 3 prompts de juge candidats et un échantillon annoté : lequel industrialiser ? Écris \`concours(juges, humain, seuil=0.6)\` où \`juges\` est un dict \`nom → verdicts\` (kappa_cohen fourni) :

1. calcule le kappa de chaque juge (arrondi à 3 décimales),
2. renvoie \`{"kappas": {nom: kappa}, "fiables": [noms avec kappa ≥ seuil, triés par kappa décroissant], "champion": nom du meilleur (ou None si aucun fiable)}\`.

C'est le protocole exact de sélection d'un LLM-juge avant sa mise en production.`,
              starterCode: `def taux_accord(a, b):
    return sum(1 for x, y in zip(a, b) if x == y) / len(b)

def kappa_cohen(juge, humain):
    n = len(humain)
    p_j, p_h = sum(juge) / n, sum(humain) / n
    hasard = p_j * p_h + (1 - p_j) * (1 - p_h)
    if hasard == 1:
        return 0.0
    return (taux_accord(juge, humain) - hasard) / (1 - hasard)

HUMAIN = [True, True, False, True, False, True, True, False, True, False]

JUGES = {
    "juge_strict":   [True, False, False, True, False, True, False, False, True, False],
    "juge_laxiste":  [True] * 10,
    "juge_aligne":   [True, True, False, True, False, True, True, False, False, False],
}

def concours(juges, humain, seuil=0.6):
    ...

import json
print(json.dumps(concours(JUGES, HUMAIN), ensure_ascii=False, indent=2))`,
              solution: `def taux_accord(a, b):
    return sum(1 for x, y in zip(a, b) if x == y) / len(b)

def kappa_cohen(juge, humain):
    n = len(humain)
    p_j, p_h = sum(juge) / n, sum(humain) / n
    hasard = p_j * p_h + (1 - p_j) * (1 - p_h)
    if hasard == 1:
        return 0.0
    return (taux_accord(juge, humain) - hasard) / (1 - hasard)

HUMAIN = [True, True, False, True, False, True, True, False, True, False]

JUGES = {
    "juge_strict":   [True, False, False, True, False, True, False, False, True, False],
    "juge_laxiste":  [True] * 10,
    "juge_aligne":   [True, True, False, True, False, True, True, False, False, False],
}

def concours(juges, humain, seuil=0.6):
    kappas = {nom: round(kappa_cohen(v, humain), 3) for nom, v in juges.items()}
    fiables = sorted([n for n, k in kappas.items() if k >= seuil], key=lambda n: -kappas[n])
    champion = fiables[0] if fiables else None
    return {"kappas": kappas, "fiables": fiables, "champion": champion}

import json
print(json.dumps(concours(JUGES, HUMAIN), ensure_ascii=False, indent=2))`,
              tests: `_r = concours(JUGES, HUMAIN)
assert _r["kappas"]["juge_laxiste"] == 0.0, "Le laxiste (toujours oui) : kappa nul, démasqué"
assert _r["kappas"]["juge_aligne"] > _r["kappas"]["juge_strict"], "L'aligné bat le strict"
assert _r["champion"] == "juge_aligne", "Le champion"
assert "juge_laxiste" not in _r["fiables"], "Le laxiste n'est pas fiable"
_aucun = concours({"mauvais": [not h for h in HUMAIN]}, HUMAIN)
assert _aucun["champion"] is None, "Aucun juge fiable : champion None"
print("TESTS_PASS")`,
              hints: [
                'Une dict comprehension pour les kappas, un tri par -kappa pour les fiables.',
                'Le champion est le premier de la liste triée — s\'il y en a un.',
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
