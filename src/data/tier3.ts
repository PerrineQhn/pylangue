import type { Module } from '@/lib/types'

export const tier3: Module[] = [
  {
    id: 'm9',
    tier: 3,
    title: "L'attention, from scratch",
    tagline: 'Le mécanisme au cœur de tous les LLM, implémenté en NumPy en une trentaine de lignes.',
    status: 'ready',
    lessons: [
      {
        id: 'm9l1',
        title: 'Softmax et scores d\'attention',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# « Attention Is All You Need »

Le papier de 2017 qui a donné naissance aux transformers — donc à GPT, Claude, Llama, Gemini — repose sur une idée qu'on peut implémenter en NumPy avec ce que tu sais déjà : des produits scalaires et une normalisation.

## L'intuition

Pour comprendre le mot « le » dans « le chat noir dort », un modèle doit savoir **quels autres mots regarder**. L'attention calcule, pour chaque token, une **moyenne pondérée** des autres tokens — où les poids reflètent la *pertinence*, mesurée par… un produit scalaire (module 5 !).

## Étape 1 : softmax, transformer des scores en poids

Les produits scalaires donnent des scores quelconques : \`[2.1, -0.3, 0.8]\`. Pour en faire des **poids de moyenne** (positifs, somme = 1), on applique softmax :

\`\`\`
softmax(x)ᵢ = exp(xᵢ) / Σⱼ exp(xⱼ)
\`\`\`

## Le piège numérique (classique en entretien !)

\`exp(1000)\` déborde en \`inf\`. La solution, utilisée dans *toutes* les implémentations réelles : soustraire le max avant l'exponentielle. Mathématiquement identique (ça se simplifie dans la fraction), numériquement stable :

\`\`\`
def softmax(x):
    e = np.exp(x - x.max())
    return e / e.sum()
\`\`\`

> Ce même softmax sert aussi à convertir les *logits* d'un LLM en probabilités sur le prochain token — c'est là qu'agit le paramètre \`temperature\` : on divise les scores par T avant le softmax. T petit → distribution piquée (déterministe) ; T grand → distribution plate (créatif).`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm9l1e1',
              title: 'Softmax stable, avec température',
              instructions: `Implémente \`softmax(x, temperature=1.0)\` :

1. divise \`x\` par \`temperature\`,
2. soustrais le max (stabilité numérique),
3. exponentielle puis normalisation par la somme.

Vérifie ensuite ton intuition : que devient la distribution quand la température baisse ?`,
              starterCode: `import numpy as np

def softmax(x, temperature=1.0):
    ...

logits = np.array([2.0, 1.0, 0.1])
print("T=1.0 :", softmax(logits))
print("T=0.1 :", softmax(logits, temperature=0.1))
print("T=10  :", softmax(logits, temperature=10))`,
              solution: `import numpy as np

def softmax(x, temperature=1.0):
    x = x / temperature
    e = np.exp(x - x.max())
    return e / e.sum()

logits = np.array([2.0, 1.0, 0.1])
print("T=1.0 :", softmax(logits))
print("T=0.1 :", softmax(logits, temperature=0.1))
print("T=10  :", softmax(logits, temperature=10))`,
              tests: `import numpy as np
_p = softmax(np.array([2.0, 1.0, 0.1]))
assert abs(_p.sum() - 1.0) < 1e-9, "Les probabilités doivent sommer à 1"
assert (_p > 0).all(), "Toutes les probabilités doivent être positives"
assert _p[0] > _p[1] > _p[2], "L'ordre des scores doit être préservé"
_stable = softmax(np.array([1000.0, 999.0]))
assert not np.isnan(_stable).any(), "softmax([1000, 999]) ne doit pas produire de NaN — soustrais le max !"
_froid = softmax(np.array([2.0, 1.0, 0.1]), temperature=0.1)
assert _froid[0] > 0.99, "À basse température, la distribution doit devenir quasi déterministe"
_chaud = softmax(np.array([2.0, 1.0, 0.1]), temperature=100)
assert abs(_chaud[0] - 1/3) < 0.01, "À très haute température, la distribution tend vers l'uniforme"
print("TESTS_PASS")`,
              hints: [
                'Divise par la température AVANT de soustraire le max.',
                'np.exp(x - x.max()) puis division par la somme : trois lignes suffisent.',
                'Si le test des NaN échoue : tu as oublié de soustraire x.max().',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi soustrait-on le max avant l\'exponentielle dans softmax ?',
                options: [
                  'Pour accélérer le calcul',
                  'Pour éviter le débordement numérique (exp de grands nombres → inf)',
                  'Pour changer le résultat final',
                  'C\'est une convention sans raison',
                ],
                correct: 1,
                explanation: 'exp(x - max) borne les valeurs entre 0 et 1 avant normalisation, sans changer le résultat mathématique. Question d\'entretien ML très fréquente !',
              },
              {
                question: 'Que fait temperature=0.2 sur la génération d\'un LLM ?',
                options: [
                  'Rend les réponses plus longues',
                  'Rend l\'échantillonnage plus déterministe : le token le plus probable est presque toujours choisi',
                  'Rend les réponses plus créatives et variées',
                  'Désactive le softmax',
                ],
                correct: 1,
                explanation: 'Basse température → distribution piquée → sorties reproductibles (bon pour l\'extraction de données). Haute température → plus de diversité (brainstorming, créativité).',
              },
            ],
          },
        ],
      },
      {
        id: 'm9l2',
        title: 'Self-attention complète en NumPy',
        minutes: 45,
        sections: [
          {
            kind: 'text',
            md: `# Q, K, V : requêtes, clés, valeurs

La self-attention se décrit avec une métaphore de moteur de recherche interne à la phrase :

- **Query (Q)** : ce que chaque token *cherche* (« je suis "le", je cherche mon nom »)
- **Key (K)** : ce que chaque token *offre* comme identité (« je suis un nom commun »)
- **Value (V)** : l'information que chaque token *transmet* si on le regarde

Chaque token est projeté en trois vecteurs (par des matrices apprises \`W_q, W_k, W_v\` — ici on les suppose déjà appliquées).

## La formule complète

\`\`\`
Attention(Q, K, V) = softmax(Q @ K.T / sqrt(d)) @ V
\`\`\`

Décomposons pour \`n\` tokens de dimension \`d\` :

1. \`Q @ K.T\` → matrice \`(n, n)\` : le score de chaque token envers chaque autre. **Un produit scalaire par paire de tokens** — tu sais déjà que produit scalaire = similarité.
2. \`/ sqrt(d)\` : sans cette division, les scores grandissent avec la dimension et saturent le softmax (gradients minuscules). C'est le « scaled » de *scaled dot-product attention*.
3. \`softmax\` **ligne par ligne** : chaque token convertit ses scores en poids qui somment à 1.
4. \`@ V\` : chaque token repart avec une moyenne pondérée des valeurs des autres.

Trente lignes de NumPy, et tu as le cœur d'un LLM. Le reste d'un transformer (module 10) : plusieurs « têtes » d'attention en parallèle, des couches empilées, des MLP, des normalisations.`,
          },
          {
            kind: 'code',
            title: 'Softmax par ligne — brique nécessaire pour l\'exercice',
            runnable: true,
            needsNumpy: true,
            code: `import numpy as np

def softmax_lignes(S):
    """Softmax appliqué à chaque ligne d'une matrice."""
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

S = np.array([[1.0, 2.0], [3.0, 0.0]])
P = softmax_lignes(S)
print(P)
print("sommes par ligne :", P.sum(axis=1))   # [1, 1]`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm9l2e1',
              title: 'Implémenter la scaled dot-product attention',
              instructions: `Implémente \`attention(Q, K, V)\` pour des matrices de shape \`(n, d)\` :

1. scores \`= Q @ K.T / sqrt(d)\` (récupère \`d\` avec \`Q.shape[1]\`)
2. poids \`= softmax\` ligne par ligne (fourni dans le starter)
3. renvoie \`poids @ V\`

C'est la formule exacte du papier de 2017 — celle qui tourne, en version optimisée GPU, à chaque token généré par un LLM.`,
              starterCode: `import numpy as np

def softmax_lignes(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def attention(Q, K, V):
    ...

# 3 tokens, dimension 4
Q = np.array([[1.0, 0.0, 0.0, 0.0],
              [0.0, 1.0, 0.0, 0.0],
              [1.0, 1.0, 0.0, 0.0]])
K = Q.copy()
V = np.array([[10.0, 0.0, 0.0, 0.0],
              [0.0, 10.0, 0.0, 0.0],
              [0.0, 0.0, 10.0, 0.0]])
sortie = attention(Q, K, V)
print(np.round(sortie, 2))`,
              solution: `import numpy as np

def softmax_lignes(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def attention(Q, K, V):
    d = Q.shape[1]
    scores = Q @ K.T / np.sqrt(d)
    poids = softmax_lignes(scores)
    return poids @ V

Q = np.array([[1.0, 0.0, 0.0, 0.0],
              [0.0, 1.0, 0.0, 0.0],
              [1.0, 1.0, 0.0, 0.0]])
K = Q.copy()
V = np.array([[10.0, 0.0, 0.0, 0.0],
              [0.0, 10.0, 0.0, 0.0],
              [0.0, 0.0, 10.0, 0.0]])
sortie = attention(Q, K, V)
print(np.round(sortie, 2))`,
              tests: `import numpy as np
_Q = np.array([[1.0, 0.0], [0.0, 1.0]])
_K = _Q.copy()
_V = np.array([[1.0, 0.0], [0.0, 1.0]])
_out = attention(_Q, _K, _V)
assert _out.shape == (2, 2), "La sortie doit avoir la même shape que V"
assert _out[0, 0] > _out[0, 1], "Le token 0 doit s'accorder plus de poids à lui-même qu'au token 1"
# Vérification numérique exacte contre la formule de référence
_d = _Q.shape[1]
_S = _Q @ _K.T / np.sqrt(_d)
_e = np.exp(_S - _S.max(axis=1, keepdims=True))
_P = _e / _e.sum(axis=1, keepdims=True)
assert np.allclose(_out, _P @ _V), "Le résultat ne correspond pas à softmax(QK^T/√d)V — vérifie l'ordre des opérations"
_rows = attention(np.random.RandomState(0).randn(5, 8), np.random.RandomState(1).randn(5, 8), np.random.RandomState(2).randn(5, 8))
assert _rows.shape == (5, 8), "Avec 5 tokens de dim 8, la sortie doit être (5, 8)"
print("TESTS_PASS")`,
              hints: [
                'd = Q.shape[1], puis scores = Q @ K.T / np.sqrt(d).',
                'K.T transpose la matrice : (n, d) @ (d, n) → (n, n), un score par paire de tokens.',
                'Trois lignes dans le corps de la fonction suffisent.',
              ],
              needsNumpy: true,
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Que représente la matrice softmax(QKᵀ/√d) de shape (n, n) ?',
                options: [
                  'Les embeddings finaux des tokens',
                  'Pour chaque token (ligne), les poids d\'attention qu\'il porte à chaque autre token',
                  'Les probabilités du prochain token',
                  'La matrice des gradients',
                ],
                correct: 1,
                explanation: 'La ligne i dit « à quel point le token i regarde chaque token j ». C\'est cette matrice qu\'on visualise dans les fameuses "cartes d\'attention".',
              },
              {
                question: 'Pourquoi divise-t-on par √d ?',
                options: [
                  'Pour normaliser les embeddings',
                  'Parce que les produits scalaires grandissent avec la dimension, ce qui saturerait le softmax',
                  'Pour réduire le coût mémoire',
                  'C\'est une erreur historique du papier',
                ],
                correct: 1,
                explanation: 'En dimension d, un produit scalaire de vecteurs aléatoires a un écart-type ~√d. Sans la division, le softmax devient quasi one-hot et les gradients s\'évanouissent.',
              },
              {
                question: 'Quel est le coût de la self-attention pour une séquence de n tokens ?',
                options: [
                  'O(n) — linéaire',
                  'O(n²) — chaque token regarde tous les autres',
                  'O(log n)',
                  'O(1) grâce au GPU',
                ],
                correct: 1,
                explanation: 'QKᵀ est une matrice (n, n) : c\'est le fameux coût quadratique qui rend les longs contextes chers, et motive KV-cache, flash attention et les variantes efficientes.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'm10',
    tier: 3,
    title: 'Anatomie complète d\'un transformer',
    tagline: 'Multi-têtes, positional encodings, couches empilées : assembler le puzzle.',
    status: 'outline',
    lessons: [],
    outline: [
      'Multi-head attention : plusieurs "regards" en parallèle',
      'Positional encodings : donner la notion d\'ordre (dont RoPE, utilisé par Llama)',
      'Le bloc transformer : attention + MLP + résidus + normalisation',
      'Du bloc au modèle : GPT en ~200 lignes (lecture guidée de nanoGPT)',
    ],
  },
  {
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
    ],
  },
  {
    id: 'm12',
    tier: 3,
    title: 'RAG de bout en bout',
    tagline: 'Chunking, embeddings, retrieval, assemblage de prompt : construire le pattern le plus demandé en entreprise.',
    status: 'outline',
    lessons: [],
    outline: [
      'Découper des documents en chunks (taille, chevauchement, structure)',
      'Indexer : embeddings + similarité cosinus (modules 5-6 réutilisés tels quels)',
      'Assembler le prompt : contexte récupéré + question + consignes de citation',
      'Évaluer un RAG : rappel du retrieval, fidélité des réponses, hallucinations',
    ],
  },
  {
    id: 'm13',
    tier: 3,
    title: 'Agents, tool use et évaluation',
    tagline: 'La boucle agentique : le LLM qui décide, appelle des outils, et comment mesurer que ça marche.',
    status: 'outline',
    lessons: [],
    outline: [
      'La boucle agent : observer → décider → appeler un outil → recommencer',
      'Implémenter un mini-agent avec 2 outils (calculatrice, recherche) et un mock LLM',
      'Les pièges : boucles infinies, erreurs d\'outils, coût — garde-fous et budgets',
      'Évaluation : jeux de test, LLM-as-judge, métriques métier — le sujet chaud de 2026',
    ],
  },
]
