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

Un corpus d'entraînement fait souvent des dizaines de gigaoctets. Le charger entier dans une liste ? Impossible sur un laptop. La réponse pythonique : les **générateurs** — des fonctions qui *produisent* les éléments un par un, à la demande, avec \`yield\`, sans jamais tout garder en mémoire.

## L'intuition : produire à la demande

Une liste, c'est un entrepôt : tout est stocké d'un coup. Un générateur, c'est un robinet : l'eau ne coule que quand tu ouvres, goutte à goutte. Tant que personne n'itère, rien ne s'exécute.

\`\`\`
def lire_corpus(lignes):
    for ligne in lignes:
        ligne = ligne.strip().lower()
        if ligne:                # on filtre au vol
            yield ligne          # produit UNE valeur, puis se met en pause
\`\`\`

Appeler \`lire_corpus(...)\` n'exécute *rien* : ça crée un générateur. Le code ne tourne qu'au fil de l'itération (\`for\`, \`next()\`, \`list()\`). Mémoire utilisée : une ligne à la fois, pas le corpus entier.

## Le motif central du ML : les batches

Les GPU traitent les données par **lots** (batches). Tout data loader — y compris ceux de PyTorch — repose sur ce motif : accumuler jusqu'à la taille voulue, céder le lot, recommencer.

\`\`\`
def par_batch(elements, taille):
    batch = []
    for e in elements:
        batch.append(e)
        if len(batch) == taille:
            yield batch
            batch = []
    if batch:            # le dernier lot, souvent incomplet
        yield batch
\`\`\`

## Expressions génératrices

Comme une list comprehension, mais paresseuse — parenthèses au lieu de crochets :

\`\`\`
total_tokens = sum(len(l.split()) for l in lignes)   # aucun stockage intermédiaire
\`\`\`

## Pièges classiques

- **Un générateur ne se consomme qu'UNE fois.** Après un premier \`for\`, il est épuisé — un second \`for\` ne produit rien. Si tu dois le parcourir deux fois, matérialise-le avec \`list(...)\` (mais tu perds l'avantage mémoire).
- **Oublier le dernier batch incomplet.** Sans le \`if batch: yield batch\` final, tu perds silencieusement les derniers éléments quand leur nombre n'est pas un multiple de la taille.
- **Confondre \`[...]\` et \`(...)\`.** Les crochets construisent toute la liste en mémoire ; les parenthèses créent un générateur paresseux. Pour un \`sum()\` sur un gros flux, la version paresseuse évite le pic mémoire.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm4l1e2',
              title: "Générateur filtrant pour fichiers de config",
              instructions: `Le nettoyage de flux le plus courant qui soit : écris le générateur \`lignes_utiles(lignes)\` qui cède (\`yield\`) chaque ligne :

1. débarrassée de ses espaces de bord (\`strip\`),
2. en sautant les lignes vides,
3. en sautant les commentaires (lignes commençant par \`#\`).

C'est le préambule de tout lecteur de fichier de config, de liste de stopwords, de corpus annoté.`,
              starterCode: `def lignes_utiles(lignes):
    ...

brut = ["  chat  ", "", "# commentaire", "chien ", "   ", "# autre", "oiseau"]
for l in lignes_utiles(brut):
    print(repr(l))`,
              solution: `def lignes_utiles(lignes):
    for ligne in lignes:
        ligne = ligne.strip()
        if ligne and not ligne.startswith("#"):
            yield ligne

brut = ["  chat  ", "", "# commentaire", "chien ", "   ", "# autre", "oiseau"]
for l in lignes_utiles(brut):
    print(repr(l))`,
              tests: `import types
_g = lignes_utiles(["a"])
assert isinstance(_g, types.GeneratorType), "Doit être un générateur (yield)"
_r = list(lignes_utiles(["  chat  ", "", "# com", "chien ", "   ", "oiseau"]))
assert _r == ["chat", "chien", "oiseau"], "Nettoyées, sans vides ni commentaires"
assert list(lignes_utiles([])) == [], "Flux vide"
assert list(lignes_utiles(["   # indenté"])) == [], "Un commentaire même indenté est sauté (strip d'abord !)"
print("TESTS_PASS")`,
              hints: [
                'strip() AVANT les tests : une ligne "   " devient vide, un "  # x" devient un commentaire.',
                'Une chaîne vide est falsy : "if ligne and ..." suffit.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm4l1e3',
              title: "Défi — Fenêtres glissantes (n-grammes)",
              instructions: `Les **n-grammes** (suites de n tokens consécutifs) servent aux modèles de langue statistiques, à la détection de plagiat, aux features de classification. Écris le générateur \`fenetres(tokens, n)\` qui cède chaque fenêtre de \`n\` tokens consécutifs sous forme de **tuple** :

\`\`\`
fenetres(["le", "chat", "dort"], 2)  ->  ("le", "chat"), ("chat", "dort")
\`\`\`

Si la séquence est plus courte que \`n\`, le générateur ne cède rien.`,
              starterCode: `def fenetres(tokens, n):
    ...

for f in fenetres("le chat dort profondément".split(), 2):
    print(f)`,
              solution: `def fenetres(tokens, n):
    for i in range(len(tokens) - n + 1):
        yield tuple(tokens[i:i + n])

for f in fenetres("le chat dort profondément".split(), 2):
    print(f)`,
              tests: `import types
assert isinstance(fenetres(["a"], 1), types.GeneratorType), "Doit être un générateur"
assert list(fenetres(["le", "chat", "dort"], 2)) == [("le", "chat"), ("chat", "dort")], "Bigrammes"
assert list(fenetres(["a", "b", "c"], 3)) == [("a", "b", "c")], "Une seule fenêtre pleine"
assert list(fenetres(["a", "b"], 3)) == [], "Séquence trop courte : rien"
assert list(fenetres(["a", "b", "c"], 1)) == [("a",), ("b",), ("c",)], "Unigrammes : tuples à 1 élément"
_compte = {}
for f in fenetres("le chat et le chat".split(), 2):
    _compte[f] = _compte.get(f, 0) + 1
assert _compte[("le", "chat")] == 2, "Composable avec le motif de comptage : compter les bigrammes !"
print("TESTS_PASS")`,
              hints: [
                'range(len(tokens) - n + 1) donne les indices de départ valides.',
                'tuple(tokens[i:i+n]) — le tuple est hachable, donc utilisable comme clé de dict (voir le dernier test).',
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

Un pipeline qui appelle une API LLM sur 10 000 documents *va* rencontrer des erreurs : timeouts, rate limits, JSON malformé. La différence entre un script de démo et un système, c'est ce qui se passe à ce moment-là. Un batch qui crashe au document 12 407 à 3 h du matin, c'est une matinée perdue ; un batch qui encaisse et reprend, c'est un job qu'on confie à un cron sans y penser.

## try / except : précis, jamais silencieux

\`\`\`
try:
    data = json.loads(reponse)
except json.JSONDecodeError:      # on attrape PRÉCISÉMENT ce qu'on attend
    data = None                   # et on décide quoi faire
\`\`\`

Deux règles d'or : ne jamais attraper \`Exception\` à l'aveugle (ça masque les vrais bugs — une faute de frappe, un \`None\` inattendu deviennent invisibles), et ne jamais laisser un \`except: pass\` silencieux (un pipeline qui « réussit » sur des données corrompues est pire qu'un crash).

## Le retry avec backoff : LE pattern des API LLM

Les erreurs de rate limit (429) sont *normales* et *temporaires*. Le réflexe professionnel : réessayer en attendant de plus en plus longtemps — backoff exponentiel : 1 s, 2 s, 4 s… Toutes les bibliothèques clientes le font ; savoir l'écrire soi-même est un classique d'entretien.

## Annotations de type : lire les signatures

Les annotations ne changent pas l'exécution, mais documentent et permettent la vérification statique :

\`\`\`
def encoder(textes: list[str], batch_size: int = 32) -> list[list[float]]:
    ...
\`\`\`

Ça se lit : « prend une liste de chaînes, renvoie une liste de vecteurs ». Les signatures typées sont souvent la *documentation la plus fiable* d'une bibliothèque ML — plus à jour que la doc elle-même — et le premier réflexe de lecture d'une API.

## Pièges classiques

- **\`except Exception: pass\`.** Il avale *toutes* les erreurs, y compris tes propres bugs, qui deviennent invisibles jusqu'à ce que tu les découvres dans les résultats, des semaines plus tard. Attrape précis, loggue toujours.
- **Réessayer sans backoff.** Marteler une API rate-limitée immédiatement aggrave la surcharge (et la facture). L'attente croissante laisse le service respirer.
- **Croire que les annotations sont vérifiées à l'exécution.** Python les *ignore* au runtime : \`def f(x: int)\` accepte une chaîne sans broncher. Ce sont des outils (mypy, pyright) et ton éditeur qui les exploitent.`,
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
            kind: 'exercise',
            exercise: {
              id: 'm4l2e2',
              title: "Valider un lot en collectant les erreurs",
              instructions: `Dans un batch de production, on ne s'arrête pas à la première donnée invalide : on traite tout, puis on rapporte. Écris \`valider_lot(textes, valideur)\` qui :

1. applique \`valideur(texte)\` à chaque texte (le valideur renvoie une version normalisée ou lève \`ValueError\`),
2. renvoie le tuple \`(valides, erreurs)\` : la liste des résultats valides, et la liste des tuples \`(texte_brut, message_d_erreur)\` — récupère le message avec \`str(e)\`.`,
              starterCode: `def valideur_exemple(texte):
    texte = texte.strip()
    if not texte:
        raise ValueError("texte vide")
    if len(texte) > 20:
        raise ValueError("texte trop long")
    return texte.lower()

def valider_lot(textes, valideur):
    ...

v, e = valider_lot(["  Bonjour ", "", "Un texte beaucoup trop long pour passer", "OK"], valideur_exemple)
print("valides :", v)
print("erreurs :", e)`,
              solution: `def valideur_exemple(texte):
    texte = texte.strip()
    if not texte:
        raise ValueError("texte vide")
    if len(texte) > 20:
        raise ValueError("texte trop long")
    return texte.lower()

def valider_lot(textes, valideur):
    valides, erreurs = [], []
    for t in textes:
        try:
            valides.append(valideur(t))
        except ValueError as e:
            erreurs.append((t, str(e)))
    return valides, erreurs

v, e = valider_lot(["  Bonjour ", "", "Un texte beaucoup trop long pour passer", "OK"], valideur_exemple)
print("valides :", v)
print("erreurs :", e)`,
              tests: `_v, _e = valider_lot(["  Bonjour ", "", "Un texte beaucoup trop long pour passer", "OK"], valideur_exemple)
assert _v == ["bonjour", "ok"], "Les textes valides, normalisés"
assert len(_e) == 2, "Deux erreurs collectées — le lot ne s'arrête jamais"
assert _e[0] == ("", "texte vide"), "Le texte brut ET le message d'erreur"
assert _e[1][1] == "texte trop long", "Le message de la seconde erreur"
_v2, _e2 = valider_lot([], valideur_exemple)
assert _v2 == [] and _e2 == [], "Lot vide : deux listes vides"
print("TESTS_PASS")`,
              hints: [
                'Le try/except est DANS la boucle : une erreur ne stoppe pas le lot.',
                'except ValueError as e — puis str(e) pour le message.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm4l2e3',
              title: "Défi — Le disjoncteur (circuit breaker)",
              instructions: `Quand une API est en panne, insister aggrave tout (et coûte). Le pattern **circuit breaker** coupe le circuit après N échecs consécutifs. Implémente la classe \`Disjoncteur(seuil)\` avec la méthode \`appeler(fonction)\` :

1. si le circuit est **ouvert** (échecs consécutifs ≥ seuil) → lève \`RuntimeError("circuit ouvert")\` SANS appeler la fonction,
2. sinon appelle la fonction : en cas de succès, remet le compteur à zéro et renvoie le résultat ; si elle lève une exception, incrémente le compteur et relaie l'exception (\`raise\`).`,
              starterCode: `class Disjoncteur:
    def __init__(self, seuil=3):
        ...

    def appeler(self, fonction):
        ...

d = Disjoncteur(seuil=2)
def echoue():
    raise ConnectionError("api en panne")

for _ in range(2):
    try:
        d.appeler(echoue)
    except ConnectionError:
        print("échec encaissé")
try:
    d.appeler(echoue)
except RuntimeError as e:
    print(e)`,
              solution: `class Disjoncteur:
    def __init__(self, seuil=3):
        self.seuil = seuil
        self.echecs = 0

    def appeler(self, fonction):
        if self.echecs >= self.seuil:
            raise RuntimeError("circuit ouvert")
        try:
            resultat = fonction()
            self.echecs = 0
            return resultat
        except Exception:
            self.echecs += 1
            raise

d = Disjoncteur(seuil=2)
def echoue():
    raise ConnectionError("api en panne")

for _ in range(2):
    try:
        d.appeler(echoue)
    except ConnectionError:
        print("échec encaissé")
try:
    d.appeler(echoue)
except RuntimeError as e:
    print(e)`,
              tests: `_d = Disjoncteur(seuil=2)
def _boom():
    raise ConnectionError("panne")
def _ok():
    return 42

assert _d.appeler(_ok) == 42, "Circuit fermé : l'appel passe"
for _ in range(2):
    try:
        _d.appeler(_boom)
    except ConnectionError:
        pass
try:
    _d.appeler(_ok)
    assert False, "Après 2 échecs consécutifs (seuil=2), le circuit doit être OUVERT même pour un appel sain"
except RuntimeError as e:
    assert str(e) == "circuit ouvert", "Le message exact"
_d2 = Disjoncteur(seuil=2)
try:
    _d2.appeler(_boom)
except ConnectionError:
    pass
assert _d2.appeler(_ok) == 42, "Un succès avant le seuil…"
try:
    _d2.appeler(_boom)
except ConnectionError:
    pass
assert _d2.appeler(_ok) == 42, "…remet le compteur à zéro : le circuit reste fermé"
print("TESTS_PASS")`,
              hints: [
                'Deux attributs : self.seuil et self.echecs (compteur).',
                'Le test d\'ouverture se fait AVANT le try.',
                'Dans le except : incrémente puis "raise" seul pour relayer l\'exception d\'origine.',
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

Le décorateur *emballe* la fonction d'origine dans une enveloppe qui ajoute un comportement, puis renvoie cette enveloppe. \`*args, **kwargs\` transmet n'importe quels arguments — l'enveloppe fonctionne pour toute signature.

## Le cas d'usage roi en LLM : la mémoïsation

Appeler deux fois une API d'embeddings avec le *même* texte = payer deux fois pour le même résultat. Un décorateur \`@memoiser\` intercepte l'appel : si les arguments ont déjà été vus, il renvoie le résultat du **cache** sans rappeler la fonction. C'est le principe du \`@lru_cache\` de la bibliothèque standard, des caches d'embeddings de production (souvent -30 à -70 % de coût sur un RAG réel), et — côté serveur — du *prompt caching* des API LLM.

## Décorateurs paramétrés

Un cran au-dessus : \`@limiter(3)\` autorise 3 appels puis bloque. C'est une *fabrique* de décorateurs — trois niveaux de fonctions imbriquées (une closure du module 2 !). Ce budget d'appels par fonction est le garde-fou de base des agents (module 13).

## Pièges classiques

- **\`return enveloppe()\` au lieu de \`return enveloppe\`.** Avec les parenthèses, tu *exécutes* l'enveloppe et renvoies son résultat, au lieu de renvoyer la fonction elle-même. Le décorateur ne marche plus.
- **Oublier \`*args, **kwargs\`.** Une enveloppe qui ne transmet pas les arguments casse toute fonction qui en prend. Transmets-les à la déclaration *et* à l'appel.
- **Mémoïser une fonction non pure.** Si la fonction dépend de l'heure, du réseau ou d'un état changeant, le cache renverra une valeur périmée. La mémoïsation ne vaut que pour les fonctions déterministes (mêmes arguments → même résultat).`,
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
            kind: 'exercise',
            exercise: {
              id: 'm4l3e2',
              title: "Le décorateur @compter_appels",
              instructions: `L'instrumentation la plus simple qui soit — très utilisée pour suivre la consommation d'API : écris le décorateur \`compter_appels(fonction)\` dont l'enveloppe :

1. incrémente son propre compteur à chaque appel (\`enveloppe.appels\`, initialisé à 0),
2. transmet tous les arguments avec \`*args, **kwargs\` et renvoie le résultat tel quel.`,
              starterCode: `def compter_appels(fonction):
    ...

@compter_appels
def saluer(nom, ponctuation="!"):
    return f"Bonjour {nom}{ponctuation}"

print(saluer("Ada"))
print(saluer("Alan", ponctuation="?"))
print(f"{saluer.appels} appels")`,
              solution: `def compter_appels(fonction):
    def enveloppe(*args, **kwargs):
        enveloppe.appels += 1
        return fonction(*args, **kwargs)
    enveloppe.appels = 0
    return enveloppe

@compter_appels
def saluer(nom, ponctuation="!"):
    return f"Bonjour {nom}{ponctuation}"

print(saluer("Ada"))
print(saluer("Alan", ponctuation="?"))
print(f"{saluer.appels} appels")`,
              tests: `_avant = saluer.appels
assert saluer("Grace") == "Bonjour Grace!", "La fonction décorée garde son comportement"
assert saluer.appels == _avant + 1, "Chaque appel incrémente"
assert saluer("X", ponctuation=".") == "Bonjour X.", "Les kwargs passent à travers l'enveloppe"

@compter_appels
def _double(x):
    return x * 2
assert _double.appels == 0, "Chaque fonction décorée a SON compteur, initialisé à 0"
_double(5)
assert _double.appels == 1, "Compteur indépendant"
print("TESTS_PASS")`,
              hints: [
                'La structure exacte du cours : enveloppe interne, attribut initialisé après sa définition, return enveloppe.',
                '*args, **kwargs à la déclaration ET à la transmission.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm4l3e3',
              title: "Défi — @limiter, un décorateur paramétré",
              instructions: `Un cran au-dessus : un décorateur **avec paramètre** — c'est une fabrique (closure, module 2 !) qui renvoie un décorateur. Écris \`limiter(max_appels)\` tel que :

\`\`\`
@limiter(3)
def appel_api(): ...
\`\`\`

autorise 3 appels, puis lève \`RuntimeError("limite atteinte")\` pour tous les suivants. Trois niveaux imbriqués : \`limiter(n)\` → \`decorateur(fonction)\` → \`enveloppe(*args)\`. Le budget d'appels par fonction est LE garde-fou de base des agents (module 13).`,
              starterCode: `def limiter(max_appels):
    ...

@limiter(2)
def appel_api(x):
    return x * 10

print(appel_api(1))
print(appel_api(2))
try:
    appel_api(3)
except RuntimeError as e:
    print("bloqué :", e)`,
              solution: `def limiter(max_appels):
    def decorateur(fonction):
        def enveloppe(*args, **kwargs):
            if enveloppe.restants <= 0:
                raise RuntimeError("limite atteinte")
            enveloppe.restants -= 1
            return fonction(*args, **kwargs)
        enveloppe.restants = max_appels
        return enveloppe
    return decorateur

@limiter(2)
def appel_api(x):
    return x * 10

print(appel_api(1))
print(appel_api(2))
try:
    appel_api(3)
except RuntimeError as e:
    print("bloqué :", e)`,
              tests: `@limiter(2)
def _f(x):
    return x + 1
assert _f(1) == 2 and _f(2) == 3, "Les 2 premiers appels passent"
try:
    _f(3)
    assert False, "Le 3e appel doit être bloqué"
except RuntimeError as e:
    assert str(e) == "limite atteinte", "Le message exact"

@limiter(1)
def _g():
    return "ok"
assert _g() == "ok", "Chaque fonction décorée a son propre budget"
try:
    _g()
    assert False, "Budget de _g épuisé indépendamment de _f"
except RuntimeError:
    pass
print("TESTS_PASS")`,
              hints: [
                'limiter(n) renvoie decorateur ; decorateur(f) renvoie enveloppe. Trois def imbriqués.',
                'Le budget vit sur l\'enveloppe (enveloppe.restants = max_appels), fixé juste avant son return.',
                'Teste et décrémente AVANT d\'appeler la fonction.',
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
