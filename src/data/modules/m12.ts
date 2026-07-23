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

Un LLM ne connaît ni tes documents internes, ni rien de postérieur à son entraînement. Le **RAG** (Retrieval-Augmented Generation) répond en deux temps : *retrouver* les passages pertinents dans ta base documentaire, puis les *injecter* dans le prompt pour que le modèle réponde en s'appuyant dessus.

Tout commence par le **chunking** : découper les documents en morceaux indexables. C'est l'étape la plus sous-estimée — et celle qui fait le plus souvent la différence entre un RAG qui marche et un RAG qui hallucine.

## Les deux paramètres clés

- **Taille du chunk** : trop petit → le contexte est amputé (une phrase orpheline ne veut rien dire) ; trop grand → le retrieval devient imprécis et le prompt se remplit de bruit. Typiquement 200-800 tokens.
- **Chevauchement (overlap)** : les chunks consécutifs partagent une marge (10-20 %) pour qu'une information à cheval sur une frontière ne soit jamais coupée en deux moitiés inutilisables.

\`\`\`
Texte :   [ A B C D E F G H I J ]
taille=4, overlap=1 :
chunk 1 : [ A B C D ]
chunk 2 : [ D E F G ]      # D répété : le chevauchement
chunk 3 : [ G H I J ]
\`\`\`

## En production

Les découpages réels respectent la *structure* : paragraphes, titres, cellules de tableau — plutôt que des fenêtres aveugles. Mais la fenêtre glissante avec chevauchement reste la base de référence, et c'est elle que tu implémentes aujourd'hui.`,
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

Tu as *toutes* les briques : le chunking (leçon 1), la similarité (module 5), TF-IDF (module 6), la construction de prompts (module 11). Il ne reste qu'à les visser ensemble.

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

En production, les vecteurs viennent d'un modèle d'embeddings et l'index d'une base vectorielle — mais avec ta similarité TF, le *flux* est identique à 100 %.

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

La consigne « dis-le si la réponse n'y est pas » est ta première défense contre les hallucinations — et le taux de réponses correctement *refusées* est une métrique d'évaluation à part entière (module 13).`,
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

Ton pipeline injecte des passages numérotés et exige des citations \`[n]\`. Mais rien ne garantit que le modèle respecte le contrat : il peut citer un passage qui ne dit pas ce qu'il affirme, ou inventer un numéro. La **vérification de fidélité** (*faithfulness*) est la couche de contrôle qui ferme la boucle — et l'un des sujets les plus actifs de l'ingénierie RAG.

## Vérifier mécaniquement ce qui peut l'être

Avant tout LLM-juge, une batterie de contrôles *déterministes* attrape déjà beaucoup :

1. **Extraction des citations** : \`re.findall(r"\\[(\\d+)\\]", reponse)\` — le module 3 au travail,
2. **Validité** : chaque numéro cité correspond-il à un passage réellement fourni ?
3. **Couverture** : chaque phrase affirmative contient-elle au moins une citation ?
4. **Ancrage lexical** : les mots significatifs d'une phrase se retrouvent-ils dans le passage qu'elle cite ? Un chevauchement quasi nul = alerte hallucination.

## Le score d'ancrage

Version simple et étonnamment efficace : la fraction des mots significatifs (> 3 lettres) de la phrase présents dans le passage cité :

\`\`\`
ancrage = |mots(phrase) ∩ mots(passage)| / |mots(phrase)|
\`\`\`

Ce n'est pas parfait (paraphrases, synonymes — les limites du lexical, module 6 !), mais en production on combine : contrôles mécaniques d'abord (gratuits, fiables), LLM-juge ensuite (coûteux, nuancé) sur ce qui passe le premier filtre.`,
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
