import type { Module } from '@/lib/types'

export const m4: Module = {
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
      {
        id: 'm4l3',
        title: 'Décorateurs : instrumenter sans modifier',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# La syntaxe @ que tu vois partout

\`@app.route\`, \`@torch.no_grad()\`, \`@lru_cache\`, \`@retry\`… Les décorateurs sont omniprésents dans l'écosystème ML. Et grâce à la leçon sur les pipelines, tu as déjà l'idée clé : *une fonction qui prend une fonction et renvoie une fonction*.

## Le mécanisme, sans magie

\`\`\`
def compter_appels(fonction):
    def enveloppe(*args, **kwargs):
        enveloppe.appels += 1
        return fonction(*args, **kwargs)
    enveloppe.appels = 0
    return enveloppe

@compter_appels
def encoder(texte): ...

# strictement équivalent à : encoder = compter_appels(encoder)
\`\`\`

\`*args, **kwargs\` transmet n'importe quels arguments — l'enveloppe fonctionne pour toute signature.

## Le cas d'usage roi en LLM : la mémoïsation

Appeler deux fois une API d'embeddings avec le *même* texte = payer deux fois pour le même résultat. Un décorateur \`@memoiser\` intercepte l'appel : si les arguments ont déjà été vus, renvoyer le résultat du **cache** sans appeler la fonction. C'est le principe du \`@lru_cache\` de la bibliothèque standard, des caches d'embeddings de production, et — côté serveur — du *prompt caching* des API LLM.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm4l3e1',
              title: 'Écrire @memoiser',
              instructions: `Implémente le décorateur \`memoiser(fonction)\` :

1. crée un dict \`cache\` ; l'enveloppe utilise le tuple \`args\` comme clé,
2. si la clé est au cache → renvoie la valeur stockée **sans** appeler la fonction,
3. sinon → appelle la fonction, stocke, renvoie,
4. expose le cache : \`enveloppe.cache = cache\` avant de renvoyer l'enveloppe.

Le starter fournit \`embed_couteux\` qui compte ses exécutions réelles — les tests vérifient que le cache évite bien les appels répétés.`,
              starterCode: `def memoiser(fonction):
    ...

compteur = {"executions": 0}

@memoiser
def embed_couteux(texte):
    compteur["executions"] += 1
    return [len(mot) for mot in texte.split()]

print(embed_couteux("le chat"))
print(embed_couteux("le chat"))   # même argument : depuis le cache
print(f"exécutions réelles : {compteur['executions']}")`,
              solution: `def memoiser(fonction):
    cache = {}
    def enveloppe(*args):
        if args in cache:
            return cache[args]
        resultat = fonction(*args)
        cache[args] = resultat
        return resultat
    enveloppe.cache = cache
    return enveloppe

compteur = {"executions": 0}

@memoiser
def embed_couteux(texte):
    compteur["executions"] += 1
    return [len(mot) for mot in texte.split()]

print(embed_couteux("le chat"))
print(embed_couteux("le chat"))
print(f"exécutions réelles : {compteur['executions']}")`,
              tests: `compteur["executions"] = 0
embed_couteux.cache.clear()
_r1 = embed_couteux("un deux trois")
assert _r1 == [2, 4, 5], "Premier appel : la fonction s'exécute normalement"
assert compteur["executions"] == 1, "1 exécution réelle"
_r2 = embed_couteux("un deux trois")
assert _r2 == _r1, "Même argument : même résultat"
assert compteur["executions"] == 1, "Le 2e appel doit venir du cache : toujours 1 exécution réelle"
embed_couteux("autre texte")
assert compteur["executions"] == 2, "Un argument nouveau déclenche une vraie exécution"
assert ("un deux trois",) in embed_couteux.cache, "Le cache doit être exposé et contenir la clé (args en tuple)"
print("TESTS_PASS")`,
              hints: [
                'La structure : def enveloppe(*args) → test du cache → appel si absent → return. Puis enveloppe.cache = cache ; return enveloppe.',
                'args est déjà un tuple, donc utilisable directement comme clé de dict.',
                'Si "toujours 1 exécution" échoue : tu appelles la fonction avant de vérifier le cache.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Que fait exactement la syntaxe @memoiser au-dessus d\'une fonction f ?',
                options: [
                  'Elle exécute f immédiatement',
                  'Elle remplace f par memoiser(f) : le nom f désigne désormais l\'enveloppe',
                  'Elle marque f comme privée',
                  'Elle compile f',
                ],
                correct: 1,
                explanation: '@decorateur est du sucre syntaxique pour f = decorateur(f). Rien de plus. Une fois cette équivalence comprise, tous les décorateurs deviennent lisibles.',
              },
              {
                question: 'Pourquoi la mémoïsation est-elle particulièrement rentable avec les API d\'embeddings ?',
                options: [
                  'Les embeddings sont aléatoires',
                  'Même entrée → même sortie (fonction pure côté client), et chaque appel évité économise argent ET latence réseau',
                  'Les API interdisent les appels répétés',
                  'Le cache améliore la qualité des vecteurs',
                ],
                correct: 1,
                explanation: 'Dans un RAG réel, les mêmes requêtes et chunks reviennent sans cesse. Un cache d\'embeddings réduit couramment la facture de 30-70 %. Le même raisonnement vaut pour le prompt caching côté LLM.',
              },
            ],
          },
        ],
      },
    ],
  }
