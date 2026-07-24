import type { Module } from '@/lib/types'

export const m12: Module = {
    id: 'm12',
    tier: 3,
    title: 'RAG de bout en bout',
    tagline: 'Chunking, retrieval, assemblage de prompt : construire le pattern le plus demandé en entreprise.',
    status: 'ready',
    lessons: [
      {
        id: 'm12l1',
        title: 'Chunking : découper intelligemment',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Pourquoi le RAG, et pourquoi le chunking d'abord

Un LLM ne connaît ni tes documents internes, ni rien de postérieur à son entraînement. Le **RAG** (Retrieval-Augmented Generation) répond en deux temps : *retrouver* les passages pertinents dans ta base documentaire, puis les *injecter* dans le prompt pour que le modèle réponde en s'appuyant dessus. C'est le pattern le plus demandé en entreprise aujourd'hui.

Tout commence par le **chunking** : découper les documents en morceaux indexables. C'est l'étape la plus sous-estimée — et pourtant celle qui fait le plus souvent la différence entre un RAG qui répond juste et un RAG qui hallucine. Le choix de découpage pèse souvent plus lourd que le choix du LLM.

## Les deux paramètres clés

**La taille du chunk.** Trop petit → le contexte est amputé (une phrase orpheline ne veut rien dire). Trop grand → le retrieval devient imprécis (un chunk fourre-tout ressemble à tout et à rien) et le prompt se remplit de bruit. Typiquement 200 à 800 tokens.

**Le chevauchement (overlap).** Les chunks consécutifs partagent une marge (10-20 %) pour qu'une information à cheval sur une frontière ne soit jamais coupée en deux moitiés inutilisables.

\`\`\`
Texte :   [ A B C D E F G H I J ]
taille=4, overlap=1 :
chunk 1 : [ A B C D ]
chunk 2 : [ D E F G ]      # D répété : le chevauchement
chunk 3 : [ G H I J ]
\`\`\`

## En production : respecter la structure

Les découpages réels suivent la *structure* du document — paragraphes, titres, cellules de tableau — plutôt que des fenêtres aveugles. Mais la fenêtre glissante avec chevauchement reste la base de référence, celle que tu implémentes ici.

## Pièges classiques

- **Découper sans chevauchement.** « Le capital de la société [FRONTIÈRE] s'élève à 2 M€ » : sans overlap, aucun chunk ne contient l'information complète, et elle devient introuvable.
- **Des chunks trop gros « pour ne rien perdre ».** L'embedding d'un chunk fourre-tout ne ressemble à rien de précis : il matche mal les questions pointues, et dilue l'attention du modèle sur le passage utile.
- **Ignorer les métadonnées.** Un chunk sans sa source (nom du document, position) est inutilisable pour citer — or sans citation, une réponse RAG est invérifiable.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm12l1e1',
              title: 'Fenêtre glissante avec chevauchement',
              instructions: `Implémente \`decouper(texte, taille, overlap)\` :

1. tokenise par espaces (\`.split()\`),
2. produit des chunks de \`taille\` mots, chaque chunk commençant \`taille - overlap\` mots après le précédent,
3. chaque chunk est la chaîne des mots re-joints par des espaces,
4. le dernier chunk peut être plus court, mais **ne produis pas** de chunk entièrement contenu dans le précédent.

Exemple : 10 mots, taille=4, overlap=1 → chunks aux positions 0, 3, 6, 9… non, 0, 3, 6 (le chunk partant de 9 serait couvert).`,
              starterCode: `def decouper(texte, taille, overlap):
    ...

texte = "a b c d e f g h i j"
for c in decouper(texte, taille=4, overlap=1):
    print(repr(c))`,
              solution: `def decouper(texte, taille, overlap):
    mots = texte.split()
    pas = taille - overlap
    chunks = []
    for debut in range(0, len(mots), pas):
        chunk = mots[debut:debut + taille]
        chunks.append(" ".join(chunk))
        if debut + taille >= len(mots):
            break
    return chunks

texte = "a b c d e f g h i j"
for c in decouper(texte, taille=4, overlap=1):
    print(repr(c))`,
              tests: `_c = decouper("a b c d e f g h i j", 4, 1)
assert _c == ["a b c d", "d e f g", "g h i j"], "Fenêtres de 4 avec 1 mot de chevauchement"
_c2 = decouper("a b c d e", 3, 0)
assert _c2 == ["a b c", "d e"], "Sans overlap : blocs disjoints, dernier incomplet"
_c3 = decouper("a b", 5, 2)
assert _c3 == ["a b"], "Texte plus court qu'un chunk : un seul chunk"
_c4 = decouper("a b c d e f", 4, 2)
assert _c4 == ["a b c d", "c d e f"], "taille=4, overlap=2 : pas de 2"
for _prev, _nxt in zip(_c[:-1], _c[1:]):
    assert _prev.split()[-1] == _nxt.split()[0], "Les chunks consécutifs doivent partager le mot de chevauchement"
print("TESTS_PASS")`,
              hints: [
                'Le pas d\'avancement est taille - overlap ; range(0, len(mots), pas) donne les débuts.',
                'mots[debut:debut + taille] — le slicing tronque tout seul en fin de liste.',
                'Le "break" quand debut + taille >= len(mots) évite un dernier chunk redondant entièrement couvert.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm12l1e2',
              title: "Chunking par paragraphes",
              instructions: `La version « structurelle » du chunking, celle qu'on préfère en production quand les documents ont des paragraphes : \`decouper_paragraphes(texte, max_mots)\` :

1. découpe sur les doubles sauts de ligne (\`texte.split("\\n\\n")\`), en ignorant les paragraphes vides (après strip),
2. regroupe les paragraphes consécutifs tant que le chunk courant reste ≤ \`max_mots\` mots,
3. un paragraphe qui dépasse à lui seul \`max_mots\` forme son propre chunk,
4. les paragraphes d'un même chunk sont rejoints par \`"\\n\\n"\`.`,
              starterCode: `def decouper_paragraphes(texte, max_mots):
    ...

DOC = "Premier paragraphe court.\\n\\nDeuxième paragraphe court aussi.\\n\\nTroisième un peu plus long que les autres ici.\\n\\nQuatrième."
for c in decouper_paragraphes(DOC, max_mots=8):
    print(repr(c))`,
              solution: `def decouper_paragraphes(texte, max_mots):
    paragraphes = [p.strip() for p in texte.split("\\n\\n") if p.strip()]
    chunks = []
    courant = []
    nb_mots = 0
    for p in paragraphes:
        mots_p = len(p.split())
        if courant and nb_mots + mots_p > max_mots:
            chunks.append("\\n\\n".join(courant))
            courant, nb_mots = [], 0
        courant.append(p)
        nb_mots += mots_p
    if courant:
        chunks.append("\\n\\n".join(courant))
    return chunks

DOC = "Premier paragraphe court.\\n\\nDeuxième paragraphe court aussi.\\n\\nTroisième un peu plus long que les autres ici.\\n\\nQuatrième."
for c in decouper_paragraphes(DOC, max_mots=8):
    print(repr(c))`,
              tests: `_c = decouper_paragraphes("Un deux trois.\\n\\nQuatre cinq.\\n\\nSix sept huit neuf dix onze.", max_mots=5)
assert _c[0] == "Un deux trois.\\n\\nQuatre cinq.", "Les deux premiers paragraphes tiennent ensemble (5 mots)"
assert _c[1] == "Six sept huit neuf dix onze.", "Le troisième forme son propre chunk"
_c2 = decouper_paragraphes("a b c d e f g h", max_mots=3)
assert _c2 == ["a b c d e f g h"], "Un paragraphe trop long à lui seul reste entier (chunk unique)"
_c3 = decouper_paragraphes("Un.\\n\\n\\n\\nDeux.", max_mots=10)
assert _c3 == ["Un.\\n\\nDeux."], "Les paragraphes vides sont ignorés"
assert decouper_paragraphes("", 10) == [], "Texte vide"
print("TESTS_PASS")`,
              hints: [
                'Accumule dans une liste "courant" avec un compteur de mots ; vide-la quand le prochain paragraphe ferait déborder.',
                'Le test "if courant" avant de fermer évite un chunk vide en tête.',
                'N\'oublie pas le dernier chunk après la boucle.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm12l1e3',
              title: "Défi — Chunks avec métadonnées de source",
              instructions: `Sans métadonnées, impossible de citer ses sources. Écris \`indexer(documents, taille, overlap)\` où \`documents\` est un dict \`nom → texte\`, en réutilisant \`decouper\` (fourni). Renvoie la liste de dicts :

\`\`\`
{"source": nom, "position": i, "texte": chunk}
\`\`\`

Les documents sont traités dans l'ordre **alphabétique** des noms (reproductibilité !), et \`position\` numérote les chunks au sein de chaque document (0, 1, 2…).`,
              starterCode: `def decouper(texte, taille, overlap):
    mots = texte.split()
    pas = taille - overlap
    chunks = []
    for debut in range(0, len(mots), pas):
        chunks.append(" ".join(mots[debut:debut + taille]))
        if debut + taille >= len(mots):
            break
    return chunks

def indexer(documents, taille, overlap):
    ...

DOCS = {"guide.md": "a b c d e f", "faq.md": "un deux trois"}
for c in indexer(DOCS, taille=4, overlap=1):
    print(c)`,
              solution: `def decouper(texte, taille, overlap):
    mots = texte.split()
    pas = taille - overlap
    chunks = []
    for debut in range(0, len(mots), pas):
        chunks.append(" ".join(mots[debut:debut + taille]))
        if debut + taille >= len(mots):
            break
    return chunks

def indexer(documents, taille, overlap):
    index = []
    for nom in sorted(documents):
        for i, chunk in enumerate(decouper(documents[nom], taille, overlap)):
            index.append({"source": nom, "position": i, "texte": chunk})
    return index

DOCS = {"guide.md": "a b c d e f", "faq.md": "un deux trois"}
for c in indexer(DOCS, taille=4, overlap=1):
    print(c)`,
              tests: `_i = indexer({"guide.md": "a b c d e f", "faq.md": "un deux trois"}, 4, 1)
assert _i[0]["source"] == "faq.md", "Ordre alphabétique : faq.md d'abord"
assert _i[0] == {"source": "faq.md", "position": 0, "texte": "un deux trois"}, "Chunk complet avec métadonnées"
_guide = [c for c in _i if c["source"] == "guide.md"]
assert len(_guide) == 2, "guide.md : 2 chunks (taille 4, overlap 1)"
assert _guide[1]["position"] == 1, "Numérotation par document"
assert _guide[1]["texte"] == "d e f", "Le second chunk chevauche d'un mot"
assert indexer({}, 4, 1) == [], "Aucun document"
print("TESTS_PASS")`,
              hints: [
                'sorted(documents) itère les clés dans l\'ordre alphabétique.',
                'enumerate sur les chunks de chaque document pour la position.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'À quoi sert le chevauchement entre chunks ?',
                options: [
                  'À augmenter artificiellement la taille de la base',
                  'À éviter qu\'une information à cheval sur une frontière de chunk devienne introuvable (coupée en deux moitiés)',
                  'À accélérer le retrieval',
                  'À compresser les documents',
                ],
                correct: 1,
                explanation: '"Le capital de la société [FRONTIÈRE] s\'élève à 2 M€" : sans overlap, aucun des deux chunks ne contient l\'information complète. Le chevauchement est une assurance peu coûteuse.',
              },
              {
                question: 'Quel symptôme typique produit un chunking avec des chunks beaucoup trop grands ?',
                options: [
                  'Le retrieval devient flou (un chunk mélange dix sujets) et le prompt se remplit de contenu non pertinent',
                  'Les réponses sont plus courtes',
                  'La base de données refuse l\'indexation',
                  'Aucun, plus grand est toujours mieux',
                ],
                correct: 0,
                explanation: 'L\'embedding d\'un chunk fourre-tout ne ressemble à rien de précis : il matche mal les questions pointues. Et injecter des pavés dilue l\'attention du modèle sur le passage utile.',
              },
            ],
          },
        ],
      },
      {
        id: 'm12l2',
        title: 'Retrieval et assemblage du prompt',
        minutes: 40,
        sections: [
          {
            kind: 'text',
            md: `# Assembler le pipeline complet

Tu as *toutes* les briques : le chunking (leçon 1), la similarité (module 5), TF-IDF (module 6), la construction de prompts (module 11). Il ne reste qu'à les visser ensemble pour obtenir un RAG de bout en bout.

## Le pipeline canonique

\`\`\`
INDEXATION (une fois) :
  documents -> chunks -> vecteurs -> index

REQUÊTE (à chaque question) :
  1. vectoriser la question
  2. scorer tous les chunks, garder le top-k
  3. assembler le prompt : contexte numéroté + question + consignes
  4. appeler le LLM
\`\`\`

En production, les vecteurs viennent d'un modèle d'embeddings et l'index d'une base vectorielle — mais avec ta similarité TF, le *flux* est identique à 100 %. Le comprendre sur ce jouet, c'est le comprendre partout.

## L'assemblage du prompt : là où tout se joue

Un bon prompt RAG contient trois choses : les passages **numérotés** (pour permettre les citations), la **question**, et des **consignes de fidélité** :

\`\`\`
Réponds UNIQUEMENT à partir des passages ci-dessous.
Cite le numéro du passage utilisé, au format [1].
Si la réponse ne s'y trouve pas, dis-le explicitement.

[1] <chunk 1>
[2] <chunk 2>

Question : <question>
\`\`\`

La consigne « dis-le si la réponse n'y est pas » est ta première défense contre les hallucinations — et le taux de réponses correctement *refusées* est une métrique d'évaluation à part entière.

## Le réflexe de debug

Ton RAG répond mal ? Le premier réflexe n'est pas de changer de LLM, mais d'**inspecter ce que le retrieval a réellement renvoyé**. Si les bons passages n'y sont pas, aucun modèle ne peut bien répondre : « garbage in, garbage out ». Dans la majorité des RAG défaillants, le problème est en amont.

## Pièges classiques

- **Injecter le top-k même quand rien n'est pertinent.** Sans seuil de pertinence, tu forces \`k\` chunks hors sujet dans le prompt, et le modèle brode dessus. Une liste vide est parfois la bonne réponse — elle déclenche le « je n'ai pas trouvé ».
- **Oublier de numéroter les passages.** Sans numéros, le modèle ne peut pas citer, et sa réponse devient invérifiable.
- **Accuser la génération avant le retrieval.** Toujours regarder le top-k d'abord : c'est là que se cachent 80 % des problèmes.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm12l2e1',
              title: 'Le pipeline RAG complet',
              instructions: `Le starter fournit \`score_tf\` (similarité par mots communs pondérés). Implémente :

1. \`top_k(question, chunks, k)\` — renvoie les indices des \`k\` chunks aux meilleurs scores, **triés du meilleur au moins bon** (indice : \`sorted(range(len(scores)), key=..., reverse=True)\`),
2. \`construire_prompt(question, chunks, indices)\` — assemble le prompt exactement au format :

\`\`\`
Réponds uniquement à partir des passages suivants. Cite tes sources au format [n].

[1] <premier chunk retenu>
[2] <second chunk retenu>

Question : <question>
\`\`\`

(numérotation [1], [2]… dans l'ordre des indices fournis, une ligne vide avant "Question").`,
              starterCode: `def score_tf(question, chunk):
    q = set(question.lower().split())
    c = chunk.lower().split()
    return sum(1 for mot in c if mot in q)

CHUNKS = [
    "Le RAG combine recherche documentaire et génération par LLM.",
    "La tour Eiffel mesure 330 mètres depuis 2022.",
    "Le chunking découpe les documents en passages indexables.",
    "Les embeddings encodent le sens des textes en vecteurs.",
]

def top_k(question, chunks, k):
    ...

def construire_prompt(question, chunks, indices):
    ...

q = "Comment le RAG combine recherche et génération ?"
idx = top_k(q, CHUNKS, 2)
print(idx)
print(construire_prompt(q, CHUNKS, idx))`,
              solution: `def score_tf(question, chunk):
    q = set(question.lower().split())
    c = chunk.lower().split()
    return sum(1 for mot in c if mot in q)

CHUNKS = [
    "Le RAG combine recherche documentaire et génération par LLM.",
    "La tour Eiffel mesure 330 mètres depuis 2022.",
    "Le chunking découpe les documents en passages indexables.",
    "Les embeddings encodent le sens des textes en vecteurs.",
]

def top_k(question, chunks, k):
    scores = [score_tf(question, c) for c in chunks]
    ordre = sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)
    return ordre[:k]

def construire_prompt(question, chunks, indices):
    lignes = ["Réponds uniquement à partir des passages suivants. Cite tes sources au format [n].", ""]
    for n, i in enumerate(indices, start=1):
        lignes.append(f"[{n}] {chunks[i]}")
    lignes.append("")
    lignes.append(f"Question : {question}")
    return "\\n".join(lignes)

q = "Comment le RAG combine recherche et génération ?"
idx = top_k(q, CHUNKS, 2)
print(idx)
print(construire_prompt(q, CHUNKS, idx))`,
              tests: `_idx = top_k("Comment le RAG combine recherche et génération ?", CHUNKS, 2)
assert _idx[0] == 0, "Le chunk 0 (RAG/recherche/génération) doit arriver premier"
assert len(_idx) == 2, "top_k doit renvoyer k indices"
assert 1 not in _idx, "La tour Eiffel n'a rien à faire dans le top-2"
_p = construire_prompt("Quoi ?", CHUNKS, [2, 0])
_lignes = _p.split("\\n")
assert _lignes[0].startswith("Réponds uniquement"), "La consigne d'abord"
assert _lignes[1] == "", "Ligne vide après la consigne"
assert _lignes[2] == "[1] " + CHUNKS[2], "Le premier indice fourni devient [1]"
assert _lignes[3] == "[2] " + CHUNKS[0], "Le second devient [2]"
assert _lignes[4] == "" and _lignes[5] == "Question : Quoi ?", "Ligne vide puis la question"
print("TESTS_PASS")`,
              hints: [
                'top_k : calcule la liste des scores, puis sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)[:k].',
                'construire_prompt : construis une liste de lignes puis "\\n".join(lignes) — plus propre que la concaténation.',
                'enumerate(indices, start=1) donne la numérotation [1], [2]… quel que soit l\'indice réel du chunk.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm12l2e2',
              title: "Seuil de pertinence : mieux vaut rien que du bruit",
              instructions: `Le top-k naïf a un défaut : si RIEN n'est pertinent, il injecte quand même k chunks hors sujet — et le modèle brode dessus. Écris \`retenir(scores, seuil, k)\` (scores = liste de floats, un par chunk) qui renvoie les indices :

1. dont le score est **strictement supérieur** au seuil,
2. triés par score décroissant,
3. limités à k.

Une liste vide est un résultat légitime — c'est elle qui déclenchera la réponse « je n'ai pas trouvé » plutôt qu'une hallucination.`,
              starterCode: `def retenir(scores, seuil, k):
    ...

print(retenir([0.1, 0.85, 0.4, 0.92, 0.05], seuil=0.3, k=2))
print(retenir([0.1, 0.05, 0.2], seuil=0.3, k=2))`,
              solution: `def retenir(scores, seuil, k):
    candidats = [(i, s) for i, s in enumerate(scores) if s > seuil]
    candidats.sort(key=lambda p: -p[1])
    return [i for i, _ in candidats[:k]]

print(retenir([0.1, 0.85, 0.4, 0.92, 0.05], seuil=0.3, k=2))
print(retenir([0.1, 0.05, 0.2], seuil=0.3, k=2))`,
              tests: `assert retenir([0.1, 0.85, 0.4, 0.92, 0.05], 0.3, 2) == [3, 1], "Les 2 meilleurs au-dessus du seuil, triés"
assert retenir([0.1, 0.05, 0.2], 0.3, 2) == [], "Rien au-dessus du seuil : liste vide — pas de bruit injecté !"
assert retenir([0.5, 0.6], 0.3, 5) == [1, 0], "k plus grand que les candidats : tous"
assert retenir([0.3], 0.3, 1) == [], "Seuil STRICTEMENT supérieur"
assert retenir([], 0.3, 2) == [], "Aucun chunk"
print("TESTS_PASS")`,
              hints: [
                'enumerate pour garder les indices, filtre, tri par -score, troncature.',
                'Le > strict (pas >=) : un score égal au seuil est écarté.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm12l2e3',
              title: "Défi — Prompt sous budget de tokens",
              instructions: `Ton contexte n'est pas infini, et chaque token injecté coûte. Écris \`construire_prompt_budget(question, chunks, indices, budget)\` — la version budgétée de ton assembleur :

1. parcours les indices **dans l'ordre fourni** (du plus pertinent au moins),
2. inclus chaque chunk si le total estimé (\`len(texte) // 4\`) des chunks inclus reste ≤ budget — mais inclus TOUJOURS le premier, même s'il dépasse (mieux vaut un contexte trop long qu'aucun contexte),
3. les suivants qui ne tiennent pas sont sautés (on continue d'essayer les suivants, plus courts peut-être),
4. assemble le prompt au format habituel (consigne, passages [n], question) et renvoie \`(prompt, indices_inclus)\`.`,
              starterCode: `def estimer(texte):
    return len(texte) // 4

def construire_prompt_budget(question, chunks, indices, budget):
    ...

CHUNKS = ["a" * 400, "b" * 100, "c" * 100, "d" * 800]
prompt, inclus = construire_prompt_budget("Quoi ?", CHUNKS, [0, 3, 1, 2], budget=150)
print("inclus :", inclus)
print(prompt[:120])`,
              solution: `def estimer(texte):
    return len(texte) // 4

def construire_prompt_budget(question, chunks, indices, budget):
    inclus = []
    total = 0
    for i in indices:
        cout = estimer(chunks[i])
        if not inclus:
            inclus.append(i)
            total += cout
        elif total + cout <= budget:
            inclus.append(i)
            total += cout
    lignes = ["Réponds uniquement à partir des passages suivants. Cite tes sources au format [n].", ""]
    for n, i in enumerate(inclus, start=1):
        lignes.append(f"[{n}] {chunks[i]}")
    lignes.append("")
    lignes.append(f"Question : {question}")
    return "\\n".join(lignes), inclus

CHUNKS = ["a" * 400, "b" * 100, "c" * 100, "d" * 800]
prompt, inclus = construire_prompt_budget("Quoi ?", CHUNKS, [0, 3, 1, 2], budget=150)
print("inclus :", inclus)
print(prompt[:120])`,
              tests: `_chunks = ["a" * 400, "b" * 100, "c" * 100, "d" * 800]
_p, _inc = construire_prompt_budget("Quoi ?", _chunks, [0, 3, 1, 2], budget=150)
assert _inc[0] == 0, "Le premier indice est TOUJOURS inclus (100 tokens)"
assert 3 not in _inc, "Le chunk de 200 tokens ferait exploser le budget : sauté"
assert 1 in _inc and 2 in _inc, "Les deux petits (25 chacun) tiennent : 100+25+25 = 150"
assert "[3]" in _p and "[4]" not in _p, "3 passages numérotés dans le prompt"
_p2, _inc2 = construire_prompt_budget("Q", ["x" * 4000], [0], budget=10)
assert _inc2 == [0], "Même énorme, le premier chunk passe toujours"
assert _p2.endswith("Question : Q"), "Le format se termine par la question"
print("TESTS_PASS")`,
              hints: [
                'Le premier chunk a un traitement spécial (toujours inclus) ; les suivants passent le test de budget.',
                'On SAUTE sans break : un chunk plus court peut encore tenir après un refus.',
                'La numérotation [n] suit l\'ordre d\'inclusion, pas les indices d\'origine.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi numéroter les passages dans le prompt RAG ?',
                options: [
                  'Pour faire joli',
                  'Pour que le modèle puisse CITER ses sources ([2]) — traçabilité et vérifiabilité des réponses',
                  'Le LLM ne lit pas les passages non numérotés',
                  'Pour réduire le nombre de tokens',
                ],
                correct: 1,
                explanation: 'Une réponse RAG sans citation est invérifiable. Les citations permettent l\'audit humain ET l\'évaluation automatique (le passage cité contient-il vraiment l\'affirmation ?).',
              },
              {
                question: 'Ton RAG répond mal. Le premier réflexe de debug ?',
                options: [
                  'Changer de LLM',
                  'Regarder ce que le retrieval a réellement renvoyé : si les bons passages n\'y sont pas, aucun modèle ne peut bien répondre',
                  'Augmenter la température',
                  'Raccourcir la question',
                ],
                correct: 1,
                explanation: '"Garbage in, garbage out" : dans la majorité des RAG défaillants, le problème est en amont (chunking, retrieval) — pas dans le modèle. Toujours inspecter le top-k avant d\'accuser la génération.',
              },
            ],
          },
        ],
      },
      {
        id: 'm12l3',
        title: 'Fidélité et citations : le RAG qui prouve',
        minutes: 35,
        sections: [
          {
            kind: 'text',
            md: `# Le contrat du RAG : ne rien affirmer sans source

Ton pipeline injecte des passages numérotés et exige des citations \`[n]\`. Mais rien ne garantit que le modèle respecte le contrat : il peut citer un passage qui ne dit pas ce qu'il affirme, ou inventer un numéro. La **vérification de fidélité** (*faithfulness*) est la couche de contrôle qui ferme la boucle — et l'un des sujets les plus actifs de l'ingénierie RAG, car c'est elle qui maintient la confiance dans un système en production.

## Vérifier mécaniquement ce qui peut l'être

Avant tout LLM-juge (coûteux), une batterie de contrôles *déterministes* (gratuits, fiables) attrape déjà beaucoup :

1. **Extraction des citations** : \`re.findall(r"\\[(\\d+)\\]", reponse)\` — le module 3 au travail ;
2. **Validité** : chaque numéro cité correspond-il à un passage réellement fourni ?
3. **Couverture** : chaque phrase affirmative contient-elle au moins une citation ?
4. **Ancrage lexical** : les mots significatifs d'une phrase se retrouvent-ils dans le passage qu'elle cite ?

## Le score d'ancrage

Version simple et étonnamment efficace : la fraction des mots significatifs (plus de 3 lettres) d'une phrase présents dans le passage qu'elle cite.

\`\`\`
ancrage = |mots(phrase) ∩ mots(passage)| / |mots(phrase)|
\`\`\`

Un ancrage proche de zéro est un signal d'alerte : la phrase n'a presque rien en commun avec sa source citée. Ce n'est pas parfait (paraphrases, synonymes — les limites du lexical, module 6) ; en production, on combine donc : contrôles mécaniques d'abord, LLM-juge ensuite sur ce qui passe le premier filtre.

## L'architecture en entonnoir

Ce n'est pas un hasard si l'on met le déterministe *avant* le LLM-juge : le premier attrape les violations flagrantes (numéro inventé, zéro citation, ancrage nul) pour une fraction du coût ; le second, nuancé mais cher, ne traite que les cas subtils.

## Pièges classiques

- **Citation valide mais infidèle.** Le piège le plus insidieux : une réponse qui *a l'air* parfaitement sourcée, mais dont le passage cité ne contient pas l'affirmation. La validité des numéros ne suffit pas — il faut confronter les *contenus*.
- **Citer un numéro hors limites.** Un \`[7]\` avec 3 passages fournis doit être détecté comme invalide, et ne jamais provoquer d'accès hors tableau dans ton code de vérification.
- **Faire confiance au seul ancrage lexical.** Une paraphrase fidèle peut avoir un ancrage faible ; un plagiat hors sujet, un ancrage trompeur. C'est un filtre, pas un juge final.`,
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm12l3e1',
              title: 'Vérificateur de citations',
              instructions: `Implémente :

1. \`extraire_citations(reponse)\` — la liste des numéros cités \`[n]\` convertis en \`int\` (dans l'ordre, doublons inclus),
2. \`citations_valides(reponse, n_passages)\` — \`True\` si la réponse contient **au moins une** citation et que toutes sont entre 1 et \`n_passages\`,
3. \`score_ancrage(phrase, passage)\` — fraction des mots de plus de 3 lettres de la phrase (minuscules) présents dans le passage (minuscules) ; \`1.0\` si la phrase n'a aucun mot significatif.`,
              starterCode: `import re

def extraire_citations(reponse):
    ...

def citations_valides(reponse, n_passages):
    ...

def score_ancrage(phrase, passage):
    ...

reponse = "Le RAG combine recherche et génération [1]. Il réduit les hallucinations [2]."
print(extraire_citations(reponse))
print(citations_valides(reponse, 2))
print(score_ancrage("Le RAG combine recherche et génération",
                    "Le RAG combine la recherche documentaire et la génération par LLM."))`,
              solution: `import re

def extraire_citations(reponse):
    return [int(n) for n in re.findall(r"\\[(\\d+)\\]", reponse)]

def citations_valides(reponse, n_passages):
    citations = extraire_citations(reponse)
    if not citations:
        return False
    return all(1 <= c <= n_passages for c in citations)

def score_ancrage(phrase, passage):
    mots = {m for m in phrase.lower().split() if len(m) > 3}
    if not mots:
        return 1.0
    mots_passage = set(passage.lower().split())
    return len(mots & mots_passage) / len(mots)

reponse = "Le RAG combine recherche et génération [1]. Il réduit les hallucinations [2]."
print(extraire_citations(reponse))
print(citations_valides(reponse, 2))
print(score_ancrage("Le RAG combine recherche et génération",
                    "Le RAG combine la recherche documentaire et la génération par LLM."))`,
              tests: `assert extraire_citations("Vrai [1] et vrai [2] et re-vrai [1].") == [1, 2, 1], "Numéros dans l'ordre, doublons inclus"
assert extraire_citations("Aucune citation ici.") == [], "Pas de citation : liste vide"
assert citations_valides("Fait [1]. Autre fait [2].", 2), "Citations 1 et 2 avec 2 passages : valide"
assert not citations_valides("Fait [3].", 2), "Citation [3] avec 2 passages : numéro inventé !"
assert not citations_valides("Aucune citation.", 2), "Zéro citation : invalide (le contrat exige des sources)"
_s = score_ancrage("Le RAG combine recherche et génération",
                   "Le RAG combine la recherche documentaire et la génération par LLM.")
assert _s == 1.0, "Tous les mots significatifs (combine, recherche, génération) sont dans le passage"
_s2 = score_ancrage("Les licornes adorent la programmation", "Le RAG combine recherche et génération.")
assert _s2 == 0.0, "Aucun ancrage : phrase probablement hallucinée"
assert score_ancrage("le et de", "peu importe") == 1.0, "Aucun mot significatif : 1.0 par convention"
print("TESTS_PASS")`,
              hints: [
                're.findall(r"\\[(\\d+)\\]", reponse) capture les numéros ; convertis avec int().',
                'citations_valides : deux conditions — non vide, ET all(1 <= c <= n_passages).',
                'score_ancrage : deux sets de mots en minuscules, intersection avec &, attention au cas du set vide.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm12l3e2',
              title: "Couverture : chaque phrase a-t-elle sa source ?",
              instructions: `Un contrôle mécanique de plus : \`phrases_sans_citation(reponse)\` découpe la réponse en phrases (sur \`". "\` après avoir retiré le point final) et renvoie la liste des phrases **affirmatives sans citation** \`[n]\` (utilise \`re.search(r"\\[\\d+\\]", phrase)\`).

Une réponse bien élevée n'en a aucune ; chaque phrase orpheline est un endroit où l'hallucination peut se nicher.`,
              starterCode: `import re

def phrases_sans_citation(reponse):
    ...

r = "Le RAG combine recherche et génération [1]. Il a été inventé récemment. Il réduit les erreurs [2]."
print(phrases_sans_citation(r))`,
              solution: `import re

def phrases_sans_citation(reponse):
    texte = reponse.strip()
    if texte.endswith("."):
        texte = texte[:-1]
    phrases = [p.strip() for p in texte.split(". ") if p.strip()]
    return [p for p in phrases if not re.search(r"\\[\\d+\\]", p)]

r = "Le RAG combine recherche et génération [1]. Il a été inventé récemment. Il réduit les erreurs [2]."
print(phrases_sans_citation(r))`,
              tests: `_r = phrases_sans_citation("Le RAG combine recherche et génération [1]. Il a été inventé récemment. Il réduit les erreurs [2].")
assert _r == ["Il a été inventé récemment"], "Une seule phrase orpheline"
assert phrases_sans_citation("Tout est sourcé [1]. Vraiment [2].") == [], "Réponse parfaitement citée"
_r2 = phrases_sans_citation("Aucune source ici. Ni là.")
assert len(_r2) == 2, "Deux phrases sans citation"
assert phrases_sans_citation("") == [], "Réponse vide"
print("TESTS_PASS")`,
              hints: [
                'Retire le point final avant le split sur ". " — sinon la dernière phrase garde son point.',
                're.search(r"\\[\\d+\\]", phrase) détecte une citation n\'importe où dans la phrase.',
              ],
            },
          },
          {
            kind: 'exercise',
            exercise: {
              id: 'm12l3e3',
              title: "Défi — Le rapport de fidélité complet",
              instructions: `Assemble la couche de contrôle de ton RAG : \`rapport_fidelite(reponse, chunks)\` renvoie un dict :

- \`"citations_valides"\` : bool — au moins une citation, toutes entre 1 et len(chunks) (fonctions fournies),
- \`"phrases_orphelines"\` : le nombre de phrases sans citation (fonction fournie),
- \`"ancrage_moyen"\` : la moyenne des scores d'ancrage (fourni) de chaque phrase CITÉE avec le chunk qu'elle cite (première citation de la phrase), arrondie à 2 décimales — \`1.0\` s'il n'y a aucune phrase citée,
- \`"verdict"\` : \`"ok"\` si citations valides ET zéro orpheline ET ancrage ≥ 0.5, sinon \`"a_verifier"\`.`,
              starterCode: `import re

def extraire_citations(texte):
    return [int(n) for n in re.findall(r"\\[(\\d+)\\]", texte)]

def score_ancrage(phrase, passage):
    mots = {m for m in phrase.lower().split() if len(m) > 3}
    if not mots:
        return 1.0
    return len(mots & set(passage.lower().split())) / len(mots)

def decouper_phrases(reponse):
    texte = reponse.strip()
    if texte.endswith("."):
        texte = texte[:-1]
    return [p.strip() for p in texte.split(". ") if p.strip()]

def rapport_fidelite(reponse, chunks):
    ...

CHUNKS = ["Le RAG combine la recherche documentaire et la génération.",
          "Les erreurs diminuent avec des sources fiables."]
r = "Le RAG combine recherche et génération [1]. Les erreurs diminuent avec des sources [2]."
print(rapport_fidelite(r, CHUNKS))`,
              solution: `import re

def extraire_citations(texte):
    return [int(n) for n in re.findall(r"\\[(\\d+)\\]", texte)]

def score_ancrage(phrase, passage):
    mots = {m for m in phrase.lower().split() if len(m) > 3}
    if not mots:
        return 1.0
    return len(mots & set(passage.lower().split())) / len(mots)

def decouper_phrases(reponse):
    texte = reponse.strip()
    if texte.endswith("."):
        texte = texte[:-1]
    return [p.strip() for p in texte.split(". ") if p.strip()]

def rapport_fidelite(reponse, chunks):
    citations = extraire_citations(reponse)
    valides = bool(citations) and all(1 <= c <= len(chunks) for c in citations)
    phrases = decouper_phrases(reponse)
    orphelines = 0
    ancrages = []
    for p in phrases:
        cit = extraire_citations(p)
        if not cit:
            orphelines += 1
        elif 1 <= cit[0] <= len(chunks):
            phrase_nue = re.sub(r"\\[\\d+\\]", "", p)
            ancrages.append(score_ancrage(phrase_nue, chunks[cit[0] - 1]))
    ancrage = round(sum(ancrages) / len(ancrages), 2) if ancrages else 1.0
    verdict = "ok" if valides and orphelines == 0 and ancrage >= 0.5 else "a_verifier"
    return {"citations_valides": valides, "phrases_orphelines": orphelines,
            "ancrage_moyen": ancrage, "verdict": verdict}

CHUNKS = ["Le RAG combine la recherche documentaire et la génération.",
          "Les erreurs diminuent avec des sources fiables."]
r = "Le RAG combine recherche et génération [1]. Les erreurs diminuent avec des sources [2]."
print(rapport_fidelite(r, CHUNKS))`,
              tests: `_chunks = ["Le RAG combine la recherche documentaire et la génération.",
           "Les erreurs diminuent avec des sources fiables."]
_ok = rapport_fidelite("Le RAG combine recherche et génération [1]. Les erreurs diminuent avec des sources [2].", _chunks)
assert _ok["citations_valides"] and _ok["phrases_orphelines"] == 0, "Réponse bien construite"
assert _ok["ancrage_moyen"] >= 0.8, "Les phrases collent à leurs sources"
assert _ok["verdict"] == "ok", "Verdict positif"
_hallu = rapport_fidelite("Les licornes programment en COBOL [1].", _chunks)
assert _hallu["verdict"] == "a_verifier", "Citation valide mais contenu sans ancrage : signalé"
assert _hallu["ancrage_moyen"] < 0.5, "L'ancrage démasque l'hallucination"
_orph = rapport_fidelite("Le RAG combine recherche et génération [1]. Et il fait le café.", _chunks)
assert _orph["phrases_orphelines"] == 1 and _orph["verdict"] == "a_verifier", "Phrase orpheline : à vérifier"
_faux = rapport_fidelite("Vrai selon [7].", _chunks)
assert not _faux["citations_valides"], "Citation [7] avec 2 chunks : invalide"
print("TESTS_PASS")`,
              hints: [
                'Traite chaque phrase : citée -> ancrage avec chunks[premiere_citation - 1] ; sinon orpheline.',
                'Retire les [n] de la phrase avant le score d\'ancrage (re.sub).',
                'Le verdict combine les trois signaux — un seul rouge suffit à demander vérification.',
              ],
            },
          },
          {
            kind: 'quiz',
            questions: [
              {
                question: 'Pourquoi commencer par des contrôles mécaniques avant un LLM-juge ?',
                options: [
                  'Les LLM-juges sont interdits',
                  'Ils sont gratuits, instantanés, 100 % fiables sur ce qu\'ils vérifient — le juge coûteux ne traite que ce qui passe ce premier filtre',
                  'Les regex comprennent mieux le sens',
                  'Pour éviter d\'écrire des prompts',
                ],
                correct: 1,
                explanation: 'Architecture en entonnoir classique : le déterministe attrape les violations flagrantes (numéro inventé, zéro citation, ancrage nul) pour une fraction du coût. Le nuancé (paraphrase fidèle ?) revient au juge.',
              },
              {
                question: 'Une réponse cite [2], et le passage 2 existe mais ne contient pas l\'information affirmée. Quel contrôle l\'attrape ?',
                options: [
                  'La validité des numéros',
                  'Le score d\'ancrage (ou un LLM-juge) : la citation est syntaxiquement valide mais sémantiquement infidèle',
                  'Aucun contrôle ne peut détecter ça',
                  'Le comptage des tokens',
                ],
                correct: 1,
                explanation: 'C\'est l\'hallucination la plus insidieuse : une réponse qui a l\'air parfaitement sourcée. La validité des numéros ne suffit pas — il faut confronter le CONTENU de la phrase au CONTENU du passage.',
              },
            ],
          },
        ],
      },
    ],
  }
