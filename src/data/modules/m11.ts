import type { Module } from '@/lib/types'

export const m11: Module = {
    id: 'm11',
    tier: 3,
    title: 'Coder avec les API LLM',
    tagline: 'Messages, rôles, température, sorties structurées : les gestes professionnels de 2026.',
    status: 'ready',
    lessons: [
      {
        id: 'm11l1',
        title: 'Anatomie d\'un appel LLM',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Le format universel : une liste de messages

Toutes les API LLM modernes (Anthropic, OpenAI, Mistral, modèles locaux via Ollama…) partagent la même structure de requête : une **liste de messages**, chacun avec un \`role\` et un \`content\` :

\`\`\`
messages = [
    {"role": "user", "content": "Explique le RAG en une phrase."},
    {"role": "assistant", "content": "Le RAG combine..."},
    {"role": "user", "content": "Et en anglais ?"},
]
\`\`\`

- \`system\` (ou paramètre dédié) : les instructions de cadrage — ton, format, contraintes
- \`user\` / \`assistant\` : l'historique de conversation, en alternance
- Le modèle est **sans état** : à chaque appel, tu renvoies *tout* l'historique. La « mémoire » d'un chatbot, c'est toi qui la gères, dans cette liste.

## Les paramètres qui comptent

- \`model\` : le modèle choisi (compromis coût / capacité / latence)
- \`temperature\` : tu l'as implémentée au module 9 ! 0 → extraction fiable, ~1 → créativité
- \`max_tokens\` : borne de longueur de la réponse (et de la facture)

## S'entraîner sans clé d'API

Dans cette leçon, tu travailles avec \`MockLLM\`, un faux client qui reproduit fidèlement l'interface d'un vrai SDK. C'est une pratique professionnelle standard : on développe et on teste contre un *mock*, puis on branche le vrai client — l'interface étant identique, le reste du code ne change pas.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm11l1e1',
              title: 'Gérer une conversation multi-tours',
              instructions: `Le \`MockLLM\` du starter imite un vrai SDK : \`client.chat(messages, temperature=...)\` renvoie un dict \`{"role": "assistant", "content": "..."}\`.

Écris la classe \`Conversation\` :

- \`__init__(client, system)\` : stocke le client et initialise \`self.messages\` avec le message system
- \`demander(question)\` : ajoute le message user, appelle \`client.chat(self.messages)\`, **ajoute la réponse à l'historique** (sinon le modèle « oublie » !), et renvoie le \`content\` de la réponse

C'est le squelette de tout chatbot — celui que tu réécrirais avec le vrai SDK Anthropic ou OpenAI en changeant deux lignes.`,
              starterCode: `class MockLLM:
    """Faux client LLM, interface identique à un vrai SDK."""
    def chat(self, messages, temperature=0.7):
        assert messages[0]["role"] == "system", "Le premier message doit être system"
        n_users = sum(1 for m in messages if m["role"] == "user")
        dernier = messages[-1]["content"]
        return {"role": "assistant",
                "content": f"[Réponse au tour {n_users} à : {dernier}]"}

class Conversation:
    def __init__(self, client, system):
        ...

    def demander(self, question):
        ...

conv = Conversation(MockLLM(), "Tu es un tuteur Python concis.")
print(conv.demander("C'est quoi un embedding ?"))
print(conv.demander("Donne un exemple."))
print(f"Historique : {len(conv.messages)} messages")`,
              solution: `class MockLLM:
    def chat(self, messages, temperature=0.7):
        assert messages[0]["role"] == "system", "Le premier message doit être system"
        n_users = sum(1 for m in messages if m["role"] == "user")
        dernier = messages[-1]["content"]
        return {"role": "assistant",
                "content": f"[Réponse au tour {n_users} à : {dernier}]"}

class Conversation:
    def __init__(self, client, system):
        self.client = client
        self.messages = [{"role": "system", "content": system}]

    def demander(self, question):
        self.messages.append({"role": "user", "content": question})
        reponse = self.client.chat(self.messages)
        self.messages.append(reponse)
        return reponse["content"]

conv = Conversation(MockLLM(), "Tu es un tuteur Python concis.")
print(conv.demander("C'est quoi un embedding ?"))
print(conv.demander("Donne un exemple."))
print(f"Historique : {len(conv.messages)} messages")`,
              tests: `_c = Conversation(MockLLM(), "Tu es utile.")
_r1 = _c.demander("Question A")
assert "tour 1" in _r1, "Le premier appel doit être le tour 1"
_r2 = _c.demander("Question B")
assert "tour 2" in _r2, "Le mock doit voir 2 messages user : as-tu bien conservé l'historique ?"
assert len(_c.messages) == 5, "Après 2 tours : system + 2×(user + assistant) = 5 messages"
assert _c.messages[0]["role"] == "system", "Le message system doit rester en tête"
assert _c.messages[-1]["role"] == "assistant", "Le dernier message doit être la réponse de l'assistant"
print("TESTS_PASS")`,
              hints: [
                'self.messages démarre avec [{"role": "system", "content": system}].',
                'demander : append du user, appel au client, append de la réponse, return du content.',
                'Si le test "tour 2" échoue : tu n\'ajoutes pas la réponse assistant à l\'historique.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi doit-on renvoyer tout l\'historique à chaque appel d\'API ?',
                options: [
                  'Pour des raisons de facturation',
                  'Parce que les API LLM sont sans état : le modèle ne "se souvient" que de ce qu\'on lui envoie',
                  'C\'est optionnel, le serveur garde l\'historique',
                  'Pour chiffrer la conversation',
                ],
                correct: 1,
                explanation: 'Chaque appel est indépendant. C\'est aussi pour ça que les longues conversations coûtent de plus en plus cher en tokens d\'entrée — d\'où les stratégies de résumé d\'historique et le prompt caching.',
              },
              {
                question: 'Pour extraire des données structurées d\'un document, quelle température choisir ?',
                options: ['1.5', '0.9', '0 (ou proche de 0)', 'La température n\'a aucun effet'],
                correct: 2,
                explanation: 'L\'extraction demande de la reproductibilité, pas de la créativité : température minimale. Tu as vu au module 9 pourquoi : la distribution devient quasi déterministe.',
              },
            ],
          },
        ],
      },
      {
        id: 'm11l2',
        title: 'Sorties structurées et robustesse',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Le LLM comme composant logiciel

Dans une vraie application, la sortie du LLM n'est pas lue par un humain : elle alimente **du code**. Il faut donc des sorties *structurées* (JSON) et un code *robuste* face aux réponses imparfaites.

## Demander du JSON

Le geste de base : spécifier le schéma dans le prompt.

\`\`\`
prompt = """Extrais du texte suivant un JSON avec les clés
"nom" (str), "sentiment" ("positif"|"negatif"|"neutre") et "score" (float 0-1).
Réponds UNIQUEMENT avec le JSON, sans texte autour.

Texte : {texte}"""
\`\`\`

(Les API modernes offrent aussi des modes JSON garantis et le *function calling* / *tool use* — même principe, contraintes appliquées côté serveur.)

## Le problème : le modèle « déborde »

Malgré la consigne, un modèle peut répondre :

\`\`\`
Voici le JSON demandé :
{"nom": "produit X", "sentiment": "positif", "score": 0.9}
J'espère que cela vous aide !
\`\`\`

Un \`json.loads\` naïf explose. Le réflexe professionnel : **extraire** le JSON de la réponse (chercher le premier \`{\` et le dernier \`}\`), parser, **valider** les champs, et prévoir un plan B (nouvelle tentative, valeur par défaut, erreur explicite).

> Cette « couche de défiance » entre le LLM et ton code, c'est ce qui distingue une démo d'un produit. Les bibliothèques comme Pydantic ou Instructor industrialisent exactement ça.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm11l2e1',
              title: 'Parser robuste de réponses LLM',
              instructions: `Écris \`extraire_json(reponse)\` qui :

1. localise le premier \`{\` et le dernier \`}\` de la chaîne (méthodes \`.find()\` et \`.rfind()\`),
2. si l'un des deux est absent → renvoie \`None\`,
3. tente \`json.loads\` sur la sous-chaîne ; en cas de \`json.JSONDecodeError\` → renvoie \`None\`,
4. sinon renvoie le dictionnaire.

Puis \`extraire_sentiment(reponse)\` qui utilise la première et renvoie la valeur de \`"sentiment"\` si elle vaut \`"positif"\`, \`"negatif"\` ou \`"neutre"\` — sinon \`"inconnu"\`.`,
              starterCode: `import json

def extraire_json(reponse):
    ...

def extraire_sentiment(reponse):
    ...

brut = 'Voici : {"sentiment": "positif", "score": 0.9} Voilà !'
print(extraire_json(brut))
print(extraire_sentiment(brut))
print(extraire_sentiment("Désolé, je ne peux pas."))`,
              solution: `import json

def extraire_json(reponse):
    debut = reponse.find("{")
    fin = reponse.rfind("}")
    if debut == -1 or fin == -1:
        return None
    try:
        return json.loads(reponse[debut:fin + 1])
    except json.JSONDecodeError:
        return None

def extraire_sentiment(reponse):
    data = extraire_json(reponse)
    if data and data.get("sentiment") in ("positif", "negatif", "neutre"):
        return data["sentiment"]
    return "inconnu"

brut = 'Voici : {"sentiment": "positif", "score": 0.9} Voilà !'
print(extraire_json(brut))
print(extraire_sentiment(brut))
print(extraire_sentiment("Désolé, je ne peux pas."))`,
              tests: `assert extraire_json('{"a": 1}') == {"a": 1}, "JSON propre : doit être parsé"
assert extraire_json('bla {"a": 1} bla') == {"a": 1}, "JSON entouré de texte : doit être extrait"
assert extraire_json('pas de json ici') is None, "Aucun JSON : None"
assert extraire_json('{"cassé": ') is None, "JSON invalide : None, pas une exception !"
assert extraire_sentiment('ok {"sentiment": "negatif"}') == "negatif", "Doit extraire 'negatif'"
assert extraire_sentiment('{"sentiment": "euphorique"}') == "inconnu", "Valeur hors schéma : 'inconnu'"
assert extraire_sentiment('rien') == "inconnu", "Pas de JSON : 'inconnu'"
print("TESTS_PASS")`,
              hints: [
                '.find("{") renvoie -1 si absent — teste-le avant de découper.',
                'La tranche est reponse[debut:fin + 1] — le +1 pour inclure la dernière accolade.',
                'try/except json.JSONDecodeError autour de json.loads, return None dans le except.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi valider les champs du JSON même après un parsing réussi ?',
                options: [
                  'Par pur formalisme',
                  'Le modèle peut renvoyer un JSON valide mais avec des valeurs hors schéma (clé manquante, catégorie inventée)',
                  'json.loads valide déjà le schéma',
                  'Pour améliorer la vitesse',
                ],
                correct: 1,
                explanation: 'Syntaxe valide ≠ schéma respecté. Un LLM peut inventer "sentiment": "mitigé". Pydantic/Instructor automatisent cette validation — le principe reste identique.',
              },
              {
                question: 'Qu\'est-ce que le "tool use" (function calling) d\'une API LLM ?',
                options: [
                  'Le modèle exécute lui-même du code sur le serveur',
                  'On déclare des fonctions avec leur schéma ; le modèle répond par un appel structuré que NOTRE code exécute',
                  'Un plugin de l\'éditeur de code',
                  'Une technique de fine-tuning',
                ],
                correct: 1,
                explanation: 'Le modèle ne fait que produire une demande d\'appel structurée (nom + arguments JSON validés). C\'est ton code qui exécute et renvoie le résultat — c\'est la brique de base des agents (module 13).',
              },
            ],
          },
        ],
      },
      {
        id: 'm11l3',
        title: 'Tokens, coûts et gestion du contexte',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# L'économie des tokens : la compétence invisible

Une application LLM en production vit sous trois contraintes chiffrées : le **coût** (facturé au million de tokens, entrée et sortie à des tarifs différents), la **fenêtre de contexte** (au-delà, l'API refuse), et la **latence** (proportionnelle aux tokens générés). Savoir estimer et maîtriser ces chiffres est ce qui sépare le prototype du produit rentable.

## Estimer sans tokenizer

L'ordre de grandeur à connaître : **~4 caractères par token** en anglais, un peu plus en français. Pour dimensionner, l'estimation \`len(texte) // 4\` suffit largement — les bibliothèques officielles (tiktoken…) donnent le compte exact quand il le faut.

## Le coût d'une conversation qui s'allonge

Souviens-toi du module 11 : l'API est sans état, on renvoie *tout l'historique à chaque tour*. Conséquence arithmétique brutale : le coût d'une conversation croît **quadratiquement** avec le nombre de tours — le tour 20 renvoie les 19 précédents. D'où les stratégies de production :

- **Troncature** : ne garder que les derniers messages qui tiennent dans un budget de tokens (en préservant TOUJOURS le message system !),
- **Résumé** : compresser les vieux tours en un résumé,
- **Prompt caching** : les préfixes stables (system, exemples) sont facturés à prix réduit s'ils ne changent pas — une raison de plus de structurer ses prompts avec le stable au début.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm11l3e1',
              title: 'Budget de contexte et facture',
              instructions: `Implémente :

1. \`estimer_tokens(texte)\` — \`len(texte) // 4\` (minimum 1 pour un texte non vide, 0 si vide),
2. \`cout_appel(messages, prix_entree, prix_sortie, tokens_sortie)\` — somme des tokens estimés des \`content\` × \`prix_entree\` + \`tokens_sortie × prix_sortie\` (prix par token),
3. \`tronquer(messages, budget)\` — garde le message \`system\` (index 0) **plus** les messages les plus récents dont le total estimé (system compris) tient dans \`budget\` ; les messages gardés restent dans l'ordre chronologique.`,
              starterCode: `def estimer_tokens(texte):
    ...

def cout_appel(messages, prix_entree, prix_sortie, tokens_sortie):
    ...

def tronquer(messages, budget):
    ...

MESSAGES = [
    {"role": "system", "content": "Tu es un assistant concis."},   # ~6 tokens
    {"role": "user", "content": "a" * 400},                        # ~100 tokens
    {"role": "assistant", "content": "b" * 200},                   # ~50 tokens
    {"role": "user", "content": "c" * 100},                        # ~25 tokens
]

print(cout_appel(MESSAGES, 0.000003, 0.000015, 500))
court = tronquer(MESSAGES, 90)
print([m["role"] for m in court])`,
              solution: `def estimer_tokens(texte):
    if not texte:
        return 0
    return max(1, len(texte) // 4)

def cout_appel(messages, prix_entree, prix_sortie, tokens_sortie):
    tokens_entree = sum(estimer_tokens(m["content"]) for m in messages)
    return tokens_entree * prix_entree + tokens_sortie * prix_sortie

def tronquer(messages, budget):
    system = messages[0]
    reste = messages[1:]
    total = estimer_tokens(system["content"])
    gardes = []
    for m in reversed(reste):
        t = estimer_tokens(m["content"])
        if total + t > budget:
            break
        gardes.append(m)
        total += t
    return [system] + gardes[::-1]

MESSAGES = [
    {"role": "system", "content": "Tu es un assistant concis."},
    {"role": "user", "content": "a" * 400},
    {"role": "assistant", "content": "b" * 200},
    {"role": "user", "content": "c" * 100},
]

print(cout_appel(MESSAGES, 0.000003, 0.000015, 500))
court = tronquer(MESSAGES, 90)
print([m["role"] for m in court])`,
              tests: `assert estimer_tokens("") == 0, "Texte vide : 0 token"
assert estimer_tokens("abc") == 1, "Texte court non vide : au moins 1 token"
assert estimer_tokens("a" * 400) == 100, "400 caractères : ~100 tokens"
_c = cout_appel(MESSAGES, 0.000003, 0.000015, 500)
_attendu = (6 + 100 + 50 + 25) * 0.000003 + 500 * 0.000015
assert abs(_c - _attendu) < 1e-9, "Coût = tokens d'entrée x prix_entree + tokens de sortie x prix_sortie"
_court = tronquer(MESSAGES, 90)
assert _court[0]["role"] == "system", "Le message system doit TOUJOURS survivre à la troncature"
assert [m["role"] for m in _court] == ["system", "assistant", "user"], "Budget 90 : system (6) + assistant (50) + user (25) = 81 ; le gros user de 100 tokens saute"
_tout = tronquer(MESSAGES, 10000)
assert len(_tout) == 4, "Budget large : tout est conservé"
assert [m["role"] for m in _tout] == ["system", "user", "assistant", "user"], "L'ordre chronologique doit être préservé"
print("TESTS_PASS")`,
              hints: [
                'tronquer : pars de la FIN (reversed), accumule tant que ça tient, puis remets à l\'endroit avec [::-1].',
                'Initialise le total avec les tokens du system : il fait partie du budget.',
                'Le break s\'arrête au premier message qui ne tient pas — on ne "saute" pas pour prendre un plus vieux.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi le coût d\'un chatbot croît-il quadratiquement avec la longueur de la conversation ?',
                options: [
                  'Les API augmentent leurs prix en cours de session',
                  'Chaque tour renvoie TOUT l\'historique : le tour n paie ~n messages, et la somme 1+2+...+n est quadratique',
                  'Les réponses deviennent plus longues',
                  'C\'est faux, le coût est constant',
                ],
                correct: 1,
                explanation: 'C\'est LA surprise des factures de chatbots en production. Troncature, résumé d\'historique et prompt caching sont les trois réponses standard — souvent combinées.',
              },
              {
                question: 'Pourquoi placer le contenu stable (system, exemples) au DÉBUT du prompt ?',
                options: [
                  'Pour la lisibilité uniquement',
                  'Le prompt caching facture à prix réduit les préfixes identiques entre appels : un début stable = cache efficace',
                  'Le modèle ignore la fin des prompts',
                  'C\'est une obligation des API',
                ],
                correct: 1,
                explanation: 'Le cache fonctionne par préfixe exact : tout ce qui précède le premier octet différent est réutilisé. Structurer ses prompts stable→variable est une optimisation de coût quasi gratuite.',
              },
            ],
          },
        ],
      },
    ],
  }
