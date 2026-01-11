import { useState, useEffect } from "react";
import { 
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  Save,
  Lightbulb,
  Sparkles,
  Quote,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BrandProfile, Post } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/appStore";

interface PostsViewProps {
  brandProfile: BrandProfile;
  posts: Post[];
  onSavePost: (post: Partial<Post>) => Promise<{ error: Error | null }>;
  onUpdatePost: (id: string, updates: Partial<Post>) => Promise<{ error: Error | null }>;
  onDeletePost: (id: string) => Promise<{ error: Error | null }>;
  onPublishPost: (id: string) => Promise<void>;
  onNavigateToCalendar: () => void;
}

// ============================================
// CONFIGURATION DES DÉCLENCHEURS
// ============================================
const TRIGGERS = [
  { id: 'conversation', emoji: '💬', label: 'Une conversation', desc: 'Question client, échange avec un collègue...' },
  { id: 'error', emoji: '🤦', label: 'Une erreur', desc: 'Quelque chose qui n\'a pas marché' },
  { id: 'victory', emoji: '🎯', label: 'Une victoire', desc: 'Feedback positif, objectif atteint...' },
  { id: 'frustration', emoji: '😤', label: 'Une frustration', desc: 'Ce qui vous agace dans votre industrie' },
  { id: 'learning', emoji: '📚', label: 'Un apprentissage', desc: 'Article, podcast, formation...' },
  { id: 'insight', emoji: '💡', label: 'Un déclic', desc: 'Réalisation soudaine, pattern remarqué' },
  { id: 'news', emoji: '📰', label: 'Une actualité', desc: 'Tendance, annonce de votre secteur' },
];

// ============================================
// CONFIGURATION DES ANGLES
// ============================================
const ANGLES = [
  { id: 'story', emoji: '📖', label: 'Histoire', desc: 'Racontez ce qui s\'est passé' },
  { id: 'advice', emoji: '🎓', label: 'Conseil', desc: 'Partagez votre expertise' },
  { id: 'opinion', emoji: '🔥', label: 'Opinion', desc: 'Prenez position' },
  { id: 'case', emoji: '📊', label: 'Cas concret', desc: 'Montrez vos résultats' },
  { id: 'question', emoji: '❓', label: 'Question', desc: 'Lancez la conversation' },
];

// ============================================
// QUESTIONS GUIDÉES PAR DÉCLENCHEUR
// ============================================
const GUIDED_QUESTIONS: Record<string, { question: string; placeholder: string }[]> = {
  conversation: [
    { question: "Avec qui avez-vous eu cet échange ?", placeholder: "Un client, un collègue, un prospect..." },
    { question: "Quelle phrase ou question vous a marqué ?", placeholder: "Les mots exacts si possible..." },
    { question: "Pourquoi ça vous a fait réfléchir ?", placeholder: "Ce que ça révèle, ce que vous en avez déduit..." },
  ],
  error: [
    { question: "Quelle erreur avez-vous commise ?", placeholder: "Décrivez ce qui s'est passé..." },
    { question: "Quelles ont été les conséquences ?", placeholder: "L'impact sur vous, votre équipe, vos clients..." },
    { question: "Qu'avez-vous appris de cette erreur ?", placeholder: "Ce que vous feriez différemment..." },
  ],
  victory: [
    { question: "Qu'avez-vous accompli exactement ?", placeholder: "Le résultat concret, les chiffres..." },
    { question: "Quel était le défi ou l'obstacle ?", placeholder: "Ce qui rendait ça difficile..." },
    { question: "Quelle a été la clé du succès ?", placeholder: "L'action décisive, le mindset..." },
  ],
  frustration: [
    { question: "Qu'est-ce qui vous frustre ?", placeholder: "La situation, le comportement, le problème..." },
    { question: "Pourquoi c'est un vrai problème ?", placeholder: "L'impact sur l'industrie, les gens..." },
    { question: "Quelle serait la solution idéale ?", placeholder: "Ce qui devrait changer..." },
  ],
  learning: [
    { question: "Qu'avez-vous appris récemment ?", placeholder: "Le concept, la méthode, l'insight..." },
    { question: "Où/comment l'avez-vous découvert ?", placeholder: "Livre, podcast, expérience, mentor..." },
    { question: "Comment allez-vous l'appliquer ?", placeholder: "L'action concrète que vous allez prendre..." },
  ],
  insight: [
    { question: "Quel a été le moment de déclic ?", placeholder: "Le contexte, ce qui s'est passé..." },
    { question: "Qu'avez-vous réalisé exactement ?", placeholder: "L'insight en une phrase..." },
    { question: "Qu'est-ce que ça change pour vous ?", placeholder: "L'impact sur votre façon de travailler..." },
  ],
  news: [
    { question: "Quelle actualité vous a interpellé ?", placeholder: "La news, la stat, l'annonce..." },
    { question: "Quel est votre angle unique ?", placeholder: "Ce que vous voyez que les autres ne voient pas..." },
    { question: "Quelles implications pour votre secteur ?", placeholder: "Ce que ça change concrètement..." },
  ],
};

// ============================================
// TEMPLATES PAR COMBINAISON DÉCLENCHEUR × ANGLE
// ============================================
const TEMPLATES: Record<string, Record<string, { structure: string[]; template: string; tips: string[] }>> = {
  // CONVERSATION
  conversation: {
    story: {
      structure: ['Le contexte de l\'échange', 'La phrase marquante', 'La réflexion que ça a déclenchée'],
      template: `La semaine dernière, j'étais en rendez-vous avec [QUI].

À un moment, il/elle m'a dit :
"[LA PHRASE EXACTE]"

Ça m'a fait l'effet d'une claque.

Parce que derrière cette simple phrase, il y avait [CE QUE ÇA RÉVÈLE].

[VOTRE RÉFLEXION / LEÇON]

Et vous, avez-vous déjà eu ce genre de conversation qui change votre perspective ?`,
      tips: ['Les mots exacts créent de l\'émotion', 'Expliquez pourquoi ça vous a touché', 'Terminez par une question ouverte'],
    },
    advice: {
      structure: ['Le problème révélé par la conversation', 'Vos conseils', 'L\'action à prendre'],
      template: `"[LA QUESTION/PHRASE DU CLIENT]"

Cette question, on me la pose souvent.
Et elle révèle un problème plus profond : [LE VRAI PROBLÈME].

Voici ce que je réponds systématiquement :

1️⃣ [CONSEIL 1]
→ Parce que [POURQUOI]

2️⃣ [CONSEIL 2]
→ Exemple : [EXEMPLE CONCRET]

3️⃣ [CONSEIL 3]
→ Résultat : [CE QUE ÇA CHANGE]

La prochaine fois qu'on vous pose cette question, vous saurez quoi répondre.`,
      tips: ['Partez de la question client', 'Donnez 3 conseils max', 'Soyez concret et actionnable'],
    },
    opinion: {
      structure: ['La conversation qui a déclenché votre réflexion', 'Votre position', 'Vos arguments'],
      template: `"[LA PHRASE QUI VOUS A FAIT RÉAGIR]"

Quand j'ai entendu ça, j'ai compris quelque chose.

[VOTRE OPINION TRANCHÉE]

Pourquoi je pense ça ?

→ [ARGUMENT 1 avec exemple]
→ [ARGUMENT 2 avec preuve]
→ [ARGUMENT 3 avec implication]

Je sais que c'est peut-être à contre-courant.
Mais après [X années] dans ce métier, c'est ma conviction.

Qu'en pensez-vous ?`,
      tips: ['Assumez votre position', 'Argumentez avec des exemples', 'Invitez au débat'],
    },
    case: {
      structure: ['La demande initiale', 'Ce que vous avez fait', 'Le résultat'],
      template: `"[LA DEMANDE/PROBLÈME DU CLIENT]"

C'est comme ça que tout a commencé.

Le contexte : [SITUATION INITIALE]

Ce qu'on a mis en place :
→ [ACTION 1]
→ [ACTION 2]
→ [ACTION 3]

Le résultat ?
[CHIFFRES, TÉMOIGNAGE, CHANGEMENT CONCRET]

La clé : [L'INSIGHT PRINCIPAL]`,
      tips: ['Commencez par le verbatim client', 'Soyez précis sur les actions', 'Les chiffres parlent'],
    },
    question: {
      structure: ['La conversation', 'Votre question', 'Votre début de réponse'],
      template: `Un [CLIENT/COLLÈGUE] m'a posé une question la semaine dernière.
Une question simple en apparence :

"[LA QUESTION]"

Et honnêtement... je n'avais pas de réponse parfaite.

Parce que [POURQUOI C'EST COMPLEXE].

Ma première intuition : [VOTRE DÉBUT DE RÉPONSE]

Mais j'aimerais vraiment avoir votre avis.
Comment répondriez-vous à cette question ?`,
      tips: ['Montrez votre vulnérabilité', 'Expliquez la complexité', 'Posez une vraie question'],
    },
  },

  // ERREUR
  error: {
    story: {
      structure: ['Ce qui s\'est passé', 'Les conséquences', 'La leçon'],
      template: `J'ai fait une erreur.
Et je vais vous la raconter.

Il y a [QUAND], j'ai [DÉCRIT L'ERREUR].
Je pensais que [CE QUE VOUS PENSIEZ].

Résultat ?
[LES CONSÉQUENCES - soyez honnête]

Ce que j'aurais dû faire à la place :
[LA BONNE APPROCHE]

Aujourd'hui, à chaque fois que [SITUATION SIMILAIRE], je pense à cette erreur.
Elle m'a appris que [LA LEÇON PRINCIPALE].

Et vous, quelle erreur vous a le plus appris ?`,
      tips: ['Soyez vulnérable et honnête', 'Décrivez les vraies conséquences', 'La leçon doit être universelle'],
    },
    advice: {
      structure: ['L\'erreur commune', 'Pourquoi on la fait', 'Comment l\'éviter'],
      template: `J'ai fait cette erreur.
Et je vois beaucoup de gens la faire aussi.

L'erreur : [DÉCRIVEZ L'ERREUR]

Pourquoi on la fait ?
→ [RAISON 1]
→ [RAISON 2]
→ [RAISON 3]

Comment l'éviter :

1️⃣ [CONSEIL PRÉVENTIF 1]
2️⃣ [CONSEIL PRÉVENTIF 2]
3️⃣ [CONSEIL PRÉVENTIF 3]

Cette erreur m'a coûté [TEMPS/ARGENT/OPPORTUNITÉ].
J'espère que ces conseils vous aideront à l'éviter.`,
      tips: ['Normalisez l\'erreur', 'Expliquez le "pourquoi"', 'Donnez des solutions concrètes'],
    },
    opinion: {
      structure: ['L\'erreur qui révèle un problème plus large', 'Votre analyse', 'Votre position'],
      template: `Cette erreur que j'ai faite révèle quelque chose de plus profond.

[DÉCRIVEZ L'ERREUR BRIÈVEMENT]

Mais le vrai problème, c'est que [PROBLÈME SYSTÉMIQUE].

Dans notre industrie, on [CE QU'ON FAIT DE TRAVERS].

Ma position :
[VOTRE OPINION TRANCHÉE]

Parce que [VOS ARGUMENTS]

Il est temps de [APPEL À L'ACTION / CHANGEMENT].

D'accord ? Pas d'accord ? Je veux entendre vos avis.`,
      tips: ['Reliez l\'erreur à un problème plus large', 'Prenez position', 'Proposez un changement'],
    },
    case: {
      structure: ['L\'erreur', 'Comment vous l\'avez corrigée', 'Le résultat après correction'],
      template: `On a fait une erreur avec un client.
Voici comment on l'a rattrapée.

La situation :
[L'ERREUR ET SON CONTEXTE]

Ce qu'on a fait immédiatement :
→ [ACTION CORRECTIVE 1]
→ [ACTION CORRECTIVE 2]
→ [ACTION CORRECTIVE 3]

Le résultat ?
Non seulement on a corrigé le tir, mais [RÉSULTAT POSITIF].

Le client nous a dit : "[VERBATIM]"

La leçon : [CE QUE VOUS AVEZ MIS EN PLACE POUR ÉVITER ÇA]`,
      tips: ['Montrez la réactivité', 'Le client a le dernier mot', 'Systématisez la solution'],
    },
    question: {
      structure: ['Votre erreur', 'Votre questionnement', 'Invitation à partager'],
      template: `J'ai fait une erreur récemment.
Et ça m'a amené à me poser une question.

L'erreur : [DÉCRIVEZ BRIÈVEMENT]

La question que je me pose maintenant :
[VOTRE QUESTION PROFONDE]

Parce que j'ai réalisé que [CE QUE L'ERREUR RÉVÈLE].

Peut-être que certains d'entre vous ont vécu la même chose.

Comment avez-vous géré ce type de situation ?
J'apprends beaucoup de vos expériences.`,
      tips: ['La vulnérabilité crée la connexion', 'Posez une question sincère', 'Valorisez les réponses'],
    },
  },

  // VICTOIRE
  victory: {
    story: {
      structure: ['Le contexte', 'Le défi', 'La victoire'],
      template: `On l'a fait. 🎯

[LE RÉSULTAT EN UNE PHRASE]

Mais laissez-moi vous raconter le chemin.

Il y a [DURÉE], on était face à [LE DÉFI/PROBLÈME].
La situation semblait [DIFFICILE/IMPOSSIBLE] parce que [OBSTACLES].

Ce qui a changé la donne :
→ [DÉCISION/ACTION CLÉ 1]
→ [DÉCISION/ACTION CLÉ 2]
→ [DÉCISION/ACTION CLÉ 3]

Aujourd'hui, [LE RÉSULTAT CONCRET].

La vraie leçon ? [CE QUE VOUS EN RETENEZ]

Les petites victoires méritent d'être célébrées.
Quelle est la vôtre cette semaine ?`,
      tips: ['Le contraste avant/après est puissant', 'Décrivez le parcours', 'Célébrez authentiquement'],
    },
    advice: {
      structure: ['Le résultat atteint', 'Les étapes clés', 'Conseils pour y arriver'],
      template: `[RÉSULTAT] en [DURÉE].

Voici exactement comment on y est arrivé.

Le point de départ : [SITUATION INITIALE]
L'objectif : [CE QU'ON VISAIT]

Les 5 étapes qui ont fait la différence :

1️⃣ [ÉTAPE 1]
↳ [DÉTAIL/POURQUOI ÇA MARCHE]

2️⃣ [ÉTAPE 2]
↳ [DÉTAIL/POURQUOI ÇA MARCHE]

3️⃣ [ÉTAPE 3]
↳ [DÉTAIL/POURQUOI ÇA MARCHE]

4️⃣ [ÉTAPE 4]
↳ [DÉTAIL/POURQUOI ÇA MARCHE]

5️⃣ [ÉTAPE 5]
↳ [DÉTAIL/POURQUOI ÇA MARCHE]

Le plus dur ? [L'OBSTACLE PRINCIPAL]
La clé ? [LE MINDSET/L'ACTION DÉCISIVE]

Enregistrez ce post si vous voulez atteindre le même résultat.`,
      tips: ['Soyez précis sur les étapes', 'Donnez les détails qui font la différence', 'Rendez ça reproductible'],
    },
    opinion: {
      structure: ['La victoire', 'Ce que ça prouve', 'Votre message'],
      template: `[RÉSULTAT OBTENU]

Certains disaient que c'était impossible.
Que [OBJECTION COURANTE].

Voici ce que cette victoire prouve :

[VOTRE THÈSE/OPINION]

Parce que pendant que d'autres [CE QUE FONT LES AUTRES],
nous avons choisi de [VOTRE APPROCHE DIFFÉRENTE].

Le résultat parle de lui-même.

Mon message : [VOTRE CONVICTION]

Vous n'avez pas besoin de [CE QUI EST SURÉVALUÉ].
Vous avez besoin de [CE QUI COMPTE VRAIMENT].

Qui est d'accord ?`,
      tips: ['Utilisez la victoire comme preuve', 'Prenez position contre le statu quo', 'Inspirez l\'action'],
    },
    case: {
      structure: ['Le contexte client', 'L\'intervention', 'Les résultats mesurables'],
      template: `📊 Étude de cas : [NOM/TYPE DE CLIENT]

Le contexte :
→ [SITUATION INITIALE DU CLIENT]
→ [LE PROBLÈME/DÉFI]
→ [CE QU'ILS AVAIENT DÉJÀ ESSAYÉ]

Notre approche :
1. [ACTION 1] — [POURQUOI]
2. [ACTION 2] — [COMMENT]
3. [ACTION 3] — [LE DÉTAIL QUI CHANGE TOUT]

Les résultats en [DURÉE] :
✅ [MÉTRIQUE 1] : [AVANT] → [APRÈS]
✅ [MÉTRIQUE 2] : [AVANT] → [APRÈS]
✅ [MÉTRIQUE 3] : [AVANT] → [APRÈS]

Le verbatim du client :
"[CE QU'IL A DIT]"

La clé du succès : [L'INSIGHT PRINCIPAL]`,
      tips: ['Les chiffres avant/après sont essentiels', 'Le témoignage client crédibilise', 'Expliquez le "pourquoi"'],
    },
    question: {
      structure: ['La victoire', 'Le doute/question', 'Invitation à réfléchir'],
      template: `On vient d'atteindre [RÉSULTAT].
Je devrais être 100% satisfait.

Mais une question me trotte dans la tête :
[VOTRE QUESTION/DOUTE]

Parce que cette victoire m'a aussi montré [CE QUE VOUS AVEZ RÉALISÉ].

Et je me demande si [QUESTION PLUS LARGE].

C'est peut-être juste moi.
Ou peut-être que d'autres ressentent la même chose ?

Comment gérez-vous ce paradoxe du succès ?`,
      tips: ['La vulnérabilité après une victoire est rare et puissante', 'Posez une vraie question', 'Humanisez le succès'],
    },
  },

  // FRUSTRATION
  frustration: {
    story: {
      structure: ['La situation frustrante', 'Votre réaction', 'Ce que ça révèle'],
      template: `J'en ai marre.

[LA SITUATION QUI VOUS FRUSTRE]

L'autre jour, [EXEMPLE CONCRET].
J'ai [VOTRE RÉACTION].

Parce que ça fait [DURÉE] que je vois ça.
Et à chaque fois, c'est la même chose : [PATTERN RÉCURRENT].

Ce qui me frustre vraiment, c'est que [LE FOND DU PROBLÈME].

On peut faire mieux.
On DOIT faire mieux.

[VOTRE VISION DE CE QUI DEVRAIT CHANGER]

Est-ce que je suis le/la seul(e) à ressentir ça ?`,
      tips: ['L\'émotion authentique résonne', 'Un exemple concret ancre le propos', 'Proposez une direction'],
    },
    advice: {
      structure: ['Le problème répandu', 'Pourquoi ça arrive', 'Comment faire autrement'],
      template: `Arrêtez de [CE QUI VOUS FRUSTRE].

C'est peut-être direct.
Mais quelqu'un doit le dire.

Je vois trop de [PERSONNES] faire [L'ERREUR/LE COMPORTEMENT].
Et à chaque fois, [LA CONSÉQUENCE].

Pourquoi on continue ?
→ [RAISON 1]
→ [RAISON 2]
→ [RAISON 3]

Voici ce qu'il faut faire à la place :

1️⃣ [ALTERNATIVE 1]
2️⃣ [ALTERNATIVE 2]
3️⃣ [ALTERNATIVE 3]

Ce n'est pas plus compliqué.
C'est juste différent de ce qu'on nous a appris.

Prêt(e) à changer ?`,
      tips: ['Soyez direct mais constructif', 'Expliquez les raisons du problème', 'Donnez des solutions claires'],
    },
    opinion: {
      structure: ['Le constat qui vous énerve', 'Votre position', 'L\'appel au changement'],
      template: `[CONSTAT PROVOCATEUR]

Oui, je l'ai dit.

Et je vais aller plus loin :
[VOTRE OPINION TRANCHÉE]

Dans notre industrie, on accepte [CE QUI EST ACCEPTÉ À TORT].
On normalise [CE QUI NE DEVRAIT PAS L'ÊTRE].

Les conséquences ?
→ [CONSÉQUENCE 1]
→ [CONSÉQUENCE 2]
→ [CONSÉQUENCE 3]

Ma position est claire :
[CE QUE VOUS DÉFENDEZ]

Certains ne seront pas d'accord.
Tant pis.

On a besoin de plus de gens qui osent dire les choses.

Vous en pensez quoi ?`,
      tips: ['Assumez la controverse', 'Argumentez solidement', 'Invitez au débat'],
    },
    case: {
      structure: ['Le problème observé chez un client', 'Ce que vous avez changé', 'L\'amélioration'],
      template: `Un client est venu nous voir avec un problème classique :
[LE PROBLÈME FRUSTRANT]

C'est une situation que je vois TOUT LE TEMPS.
Et ça m'énerve parce que c'est [POURQUOI C'EST ÉVITABLE].

Ce qu'on a trouvé :
→ [DIAGNOSTIC 1]
→ [DIAGNOSTIC 2]
→ [DIAGNOSTIC 3]

Ce qu'on a changé :
→ [SOLUTION 1]
→ [SOLUTION 2]
→ [SOLUTION 3]

Le résultat en [DURÉE] :
[AMÉLIORATION MESURABLE]

Ce cas illustre un problème plus large : [LE MESSAGE]

Combien d'entreprises vivent la même chose sans le savoir ?`,
      tips: ['Le diagnostic montre l\'expertise', 'Les solutions doivent être concrètes', 'Généralisez l\'apprentissage'],
    },
    question: {
      structure: ['La frustration', 'La question que ça pose', 'Ouverture au dialogue'],
      template: `Quelque chose me frustre.
Et j'ai besoin d'en parler.

[DÉCRIVEZ LA FRUSTRATION]

Ça m'amène à me poser une question :
[VOTRE QUESTION PROFONDE]

Parce que je ne comprends pas pourquoi [CE QUI VOUS ÉCHAPPE].

Peut-être que je rate quelque chose.
Peut-être que j'ai tort.

Mais j'aimerais vraiment comprendre.

Comment vous voyez ça, vous ?`,
      tips: ['Montrez que vous cherchez vraiment à comprendre', 'La frustration + humilité = engagement', 'Posez une vraie question'],
    },
  },

  // APPRENTISSAGE
  learning: {
    story: {
      structure: ['La découverte', 'Comment vous l\'avez trouvée', 'Ce que ça change'],
      template: `J'ai découvert quelque chose cette semaine.
Et ça a changé ma façon de voir [SUJET].

Je lisais/écoutais [SOURCE] quand je suis tombé sur cette idée :
"[L'IDÉE OU LE CONCEPT]"

Au début, j'étais [VOTRE RÉACTION].
Puis j'ai réalisé que [LA CONNEXION AVEC VOTRE EXPÉRIENCE].

Concrètement, ça veut dire que [IMPLICATION PRATIQUE].

Avant, je [CE QUE VOUS FAISIEZ].
Maintenant, je [CE QUE VOUS ALLEZ FAIRE DIFFÉREMMENT].

C'est le genre de petite découverte qui change tout.

Quel a été votre dernier apprentissage marquant ?`,
      tips: ['Citez la source', 'Montrez le changement de perspective', 'Rendez ça applicable'],
    },
    advice: {
      structure: ['Ce que vous avez appris', 'Pourquoi c\'est important', 'Comment l\'appliquer'],
      template: `[CE QUE VOUS AVEZ APPRIS]

J'aurais aimé savoir ça plus tôt.

Voici pourquoi c'est important :
[EXPLICATION DE L'ENJEU]

Comment j'ai découvert ça :
[LE CONTEXTE DE VOTRE APPRENTISSAGE]

Comment l'appliquer concrètement :

1️⃣ [ÉTAPE 1]
Exemple : [ILLUSTRATION]

2️⃣ [ÉTAPE 2]
Exemple : [ILLUSTRATION]

3️⃣ [ÉTAPE 3]
Exemple : [ILLUSTRATION]

Le piège à éviter : [CE QUI NE MARCHE PAS]

Sauvegardez ce post si vous voulez vous en souvenir.`,
      tips: ['Structurez en étapes claires', 'Donnez des exemples concrets', 'Anticipez les erreurs'],
    },
    opinion: {
      structure: ['L\'apprentissage qui a changé votre vision', 'Ce que ça remet en question', 'Votre nouvelle conviction'],
      template: `Cet apprentissage a tout changé.

[CE QUE VOUS AVEZ APPRIS]

Pendant des années, je croyais que [ANCIENNE CROYANCE].
C'est ce qu'on nous apprend tous.

Puis j'ai découvert [LA NOUVELLE PERSPECTIVE].

Et j'ai réalisé que [CE QUE ÇA REMET EN QUESTION].

Aujourd'hui, ma conviction :
[VOTRE NOUVELLE POSITION]

Je sais que ça va contre ce qu'on entend partout.
Mais l'expérience m'a montré que [PREUVE/ARGUMENT].

Il est temps de repenser [LE SUJET].

Vous en pensez quoi ?`,
      tips: ['Le contraste avant/après crée l\'impact', 'Remettez en question les croyances communes', 'Assumez votre position'],
    },
    case: {
      structure: ['L\'apprentissage', 'Son application concrète', 'Les résultats'],
      template: `J'ai appliqué un apprentissage récent.
Voici ce qui s'est passé.

L'apprentissage : [CE QUE VOUS AVEZ APPRIS]
Source : [OÙ VOUS L'AVEZ TROUVÉ]

Le contexte :
[SITUATION OÙ VOUS L'AVEZ APPLIQUÉ]

Ce que j'ai fait différemment :
→ [CHANGEMENT 1]
→ [CHANGEMENT 2]
→ [CHANGEMENT 3]

Le résultat :
[CE QUI S'EST PASSÉ - CONCRET]

La preuve que [L'INSIGHT PRINCIPAL].

Quel apprentissage avez-vous appliqué récemment ?`,
      tips: ['Montrez l\'application concrète', 'Les résultats valident l\'apprentissage', 'Invitez au partage'],
    },
    question: {
      structure: ['Ce que vous avez appris', 'La question que ça soulève', 'Votre réflexion'],
      template: `Je viens d'apprendre quelque chose.
Et ça me pose une question.

L'apprentissage : [CE QUE VOUS AVEZ DÉCOUVERT]

La question que ça soulève :
[VOTRE QUESTION]

Parce que si c'est vrai, ça veut dire que [IMPLICATION].

Et pourtant, on continue à [CE QU'ON FAIT HABITUELLEMENT].

Je n'ai pas encore de réponse définitive.
Mais j'y réfléchis.

Qu'est-ce que vous en pensez ?
Comment vous réconciliez [LES DEUX ASPECTS] ?`,
      tips: ['Partagez le processus de réflexion', 'Posez une vraie question', 'Montrez que vous cherchez'],
    },
  },

  // DÉCLIC / INSIGHT
  insight: {
    story: {
      structure: ['Le moment du déclic', 'Ce que vous avez compris', 'Ce que ça change'],
      template: `Le déclic.

C'est arrivé [CONTEXTE : où, quand].

Je [CE QUE VOUS FAISIEZ] quand soudain [CE QUI S'EST PASSÉ].

Et là, j'ai compris :
[VOTRE RÉALISATION]

C'était tellement évident après coup.
Mais avant ce moment, j'étais aveugle.

Ce qui a changé depuis :
→ [CHANGEMENT 1]
→ [CHANGEMENT 2]
→ [CHANGEMENT 3]

Parfois, il suffit d'un instant pour voir les choses différemment.

Quel a été votre dernier déclic ?`,
      tips: ['Décrivez le moment précis', 'L\'évidence après-coup est relatable', 'Montrez les conséquences'],
    },
    advice: {
      structure: ['L\'insight', 'Pourquoi c\'est puissant', 'Comment l\'utiliser'],
      template: `J'ai eu un déclic.
Et je pense qu'il peut vous aider.

L'insight : [VOTRE RÉALISATION]

Pourquoi c'est puissant ?
Parce que [EXPLICATION DE L'ENJEU].

La plupart des gens [CE QU'ILS FONT].
Alors qu'ils devraient [CE QU'ILS DEVRAIENT FAIRE].

Comment appliquer cet insight :

1️⃣ [APPLICATION 1]
2️⃣ [APPLICATION 2]
3️⃣ [APPLICATION 3]

Depuis ce déclic, j'ai [RÉSULTAT CONCRET].

Essayez cette semaine. Vous verrez la différence.`,
      tips: ['Rendez l\'insight actionnable', 'Montrez le contraste avant/après', 'Invitez à l\'action'],
    },
    opinion: {
      structure: ['Le déclic', 'Ce que ça remet en question', 'Votre nouvelle vision'],
      template: `Ce déclic a remis en question tout ce que je croyais.

[CE QUE VOUS AVEZ RÉALISÉ]

Pendant longtemps, je pensais que [ANCIENNE CROYANCE].
Tout le monde le dit. C'est le consensus.

Mais ce moment de clarté m'a montré que [NOUVELLE PERSPECTIVE].

Et ça change tout :
→ [IMPLICATION 1]
→ [IMPLICATION 2]
→ [IMPLICATION 3]

Je ne dis pas que j'ai raison.
Je dis qu'on devrait remettre en question [LE SUJET].

Vous avez déjà eu ce genre de révélation ?`,
      tips: ['Remettez en question le consensus', 'Montrez les implications', 'Restez ouvert au dialogue'],
    },
    case: {
      structure: ['L\'insight initial', 'Comment vous l\'avez testé', 'Les résultats'],
      template: `J'ai eu une intuition.
Voici comment je l'ai validée.

L'insight de départ :
[VOTRE RÉALISATION]

L'hypothèse :
[CE QUE VOUS PENSIEZ QU'IL SE PASSERAIT]

Le test :
[CE QUE VOUS AVEZ FAIT POUR VÉRIFIER]

Les résultats :
→ [RÉSULTAT 1]
→ [RÉSULTAT 2]
→ [RÉSULTAT 3]

Conclusion : [CE QUE ÇA PROUVE]

La prochaine fois que vous avez une intuition, testez-la.
C'est là que se trouvent les vraies pépites.`,
      tips: ['Montrez la méthode', 'Les résultats valident l\'insight', 'Encouragez l\'expérimentation'],
    },
    question: {
      structure: ['Le déclic', 'La question qu\'il soulève', 'Votre réflexion'],
      template: `J'ai eu un déclic.
Mais il m'a laissé avec plus de questions que de réponses.

Le déclic : [CE QUE VOUS AVEZ RÉALISÉ]

La question que ça pose :
[VOTRE QUESTION PROFONDE]

Parce que si [IMPLICATION 1], alors [IMPLICATION 2].

Et ça veut dire que [CONSÉQUENCE].

Je n'ai pas encore résolu ce paradoxe.
Peut-être que vous avez des pistes ?

Comment vous voyez ça ?`,
      tips: ['Un déclic peut créer des questions', 'Montrez le raisonnement', 'Invitez à la réflexion collective'],
    },
  },

  // ACTUALITÉ / NEWS
  news: {
    story: {
      structure: ['L\'actualité', 'Votre réaction', 'La connexion avec votre expérience'],
      template: `J'ai lu quelque chose ce matin.
Et ça m'a fait réfléchir.

[L'ACTUALITÉ / LA STAT / L'ANNONCE]

Ma première réaction : [VOTRE RÉACTION]

Parce que ça me rappelle [CONNEXION AVEC VOTRE EXPÉRIENCE].

Il y a [DURÉE], j'ai vécu [SITUATION SIMILAIRE].
Et [CE QUI S'EST PASSÉ].

Cette actualité confirme ce que je pressentais :
[VOTRE ANALYSE]

Qu'est-ce que vous en pensez ?`,
      tips: ['Citez la source', 'Reliez à votre expérience', 'Donnez votre analyse unique'],
    },
    advice: {
      structure: ['L\'actualité', 'Ce que ça implique', 'Ce qu\'il faut faire'],
      template: `[ACTUALITÉ / STAT MARQUANTE]

Si vous êtes [VOTRE AUDIENCE], ça vous concerne.

Voici ce que ça implique :
→ [IMPLICATION 1]
→ [IMPLICATION 2]
→ [IMPLICATION 3]

Ce qu'il faut faire maintenant :

1️⃣ [ACTION 1]
Pourquoi : [EXPLICATION]

2️⃣ [ACTION 2]
Pourquoi : [EXPLICATION]

3️⃣ [ACTION 3]
Pourquoi : [EXPLICATION]

Ceux qui s'adaptent maintenant auront un avantage.
Les autres... [CONSÉQUENCE].

Par quoi allez-vous commencer ?`,
      tips: ['Rendez l\'actualité actionnable', 'Créez de l\'urgence', 'Donnez un plan clair'],
    },
    opinion: {
      structure: ['L\'actualité', 'Ce que personne ne dit', 'Votre position'],
      template: `[L'ACTUALITÉ]

Tout le monde en parle.
Mais personne ne dit [VOTRE ANGLE UNIQUE].

Voici ce que je pense vraiment :

[VOTRE OPINION]

Pourquoi ?
→ [ARGUMENT 1]
→ [ARGUMENT 2]
→ [ARGUMENT 3]

Le consensus dit [CE QUE TOUT LE MONDE DIT].
Je pense l'inverse.

Parce que [VOTRE RAISONNEMENT].

Dans 6 mois, on verra qui avait raison.

RemindMe. 😉`,
      tips: ['Allez à contre-courant du consensus', 'Argumentez solidement', 'Prenez un risque'],
    },
    case: {
      structure: ['L\'actualité', 'Comment ça s\'applique à un cas', 'Les leçons'],
      template: `[L'ACTUALITÉ]

Ça me rappelle un cas récent.

Le contexte :
[SITUATION CLIENT OU PERSONNELLE]

Quand [L'ÉVÉNEMENT SIMILAIRE] s'est produit :
→ [CE QUI S'EST PASSÉ 1]
→ [CE QUI S'EST PASSÉ 2]
→ [CE QUI S'EST PASSÉ 3]

Ce qu'on a appris :
[LES LEÇONS]

Cette actualité valide ce qu'on avait observé.

Pour ceux qui vivent la même situation :
[CONSEIL BASÉ SUR L'EXPÉRIENCE]`,
      tips: ['Reliez macro (actualité) et micro (cas)', 'Montrez que vous avez l\'expérience', 'Donnez des conseils concrets'],
    },
    question: {
      structure: ['L\'actualité', 'La question qu\'elle pose', 'Invitation au débat'],
      template: `[L'ACTUALITÉ]

Ça pose une question intéressante :
[VOTRE QUESTION]

D'un côté, [ARGUMENT 1].
De l'autre, [ARGUMENT 2].

Je ne suis pas sûr de quelle position prendre.

Personnellement, j'ai tendance à penser que [VOTRE INCLINAISON].
Mais je peux me tromper.

Quel est votre avis sur la question ?
J'aimerais vraiment entendre des perspectives différentes.`,
      tips: ['Montrez les deux côtés', 'Soyez humble', 'Invitez sincèrement au débat'],
    },
  },
};

// ============================================
// ACCROCHES PERSONNALISÉES PAR COMBINAISON
// ============================================
const getHooks = (trigger: string, angle: string): string[] => {
  const baseHooks: Record<string, string[]> = {
    'conversation-story': [
      '"[Sa phrase exacte]" — Cette phrase m\'a marqué.',
      'L\'autre jour, un client m\'a dit quelque chose qui m\'a fait réfléchir.',
      'Cette conversation a changé ma façon de voir les choses.',
    ],
    'conversation-advice': [
      '"[La question qu\'on vous pose souvent]" — Voici ma réponse.',
      'On me pose souvent cette question. Voici ce que je réponds.',
      'Après 10 ans à répondre à cette question, voici ce qui marche.',
    ],
    'error-story': [
      'J\'ai fait une erreur. Et je vais vous la raconter.',
      'Voici l\'erreur qui m\'a le plus appris.',
      'Je n\'aurais jamais dû faire ça. Voici pourquoi.',
    ],
    'error-advice': [
      'Évitez cette erreur. Je l\'ai faite pour vous.',
      'L\'erreur que je vois TOUT LE TEMPS (et comment l\'éviter).',
      '90% des gens font cette erreur. Voici comment être dans les 10%.',
    ],
    'victory-story': [
      'On l\'a fait. 🎯 Voici comment.',
      'Après [X mois/années] de travail, ça y est.',
      'Petite victoire du jour : [résultat].',
    ],
    'victory-case': [
      '📊 [Résultat] en [durée]. Voici le détail.',
      'Étude de cas : comment on a obtenu [résultat].',
      'Les chiffres sont tombés : [résultat impressionnant].',
    ],
    'frustration-opinion': [
      'Je vais être direct : [constat provocateur].',
      'Ça suffit. On doit parler de [sujet].',
      'Personne n\'ose le dire, alors je le dis.',
    ],
    'learning-advice': [
      'J\'aurais aimé apprendre ça plus tôt.',
      'Ce que [X années] d\'expérience m\'ont appris.',
      'L\'insight qui a tout changé pour moi.',
    ],
    'insight-story': [
      'Le déclic est venu quand j\'ai réalisé que...',
      'Parfois, une seconde suffit pour tout comprendre.',
      'J\'ai enfin compris. Et ça change tout.',
    ],
    'news-opinion': [
      '[Stat ou fait marquant] — Et voici ce que ça signifie vraiment.',
      'Tout le monde parle de [sujet]. Personne ne dit [votre angle].',
      'Cette actualité devrait vous inquiéter/réjouir. Voici pourquoi.',
    ],
  };

  const key = `${trigger}-${angle}`;
  return baseHooks[key] || [
    'Quelque chose s\'est passé. Laissez-moi vous raconter.',
    'J\'ai appris quelque chose. Et je veux le partager.',
    'Voici ce que personne ne vous dit sur [sujet].',
  ];
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export function PostsView({ 
  brandProfile, 
  posts, 
  onSavePost,
}: PostsViewProps) {
  const { toast } = useToast();
  const { prefillPostData, setPrefillPostData } = useAppStore();
  
  const [step, setStep] = useState(1);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [postContent, setPostContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTemplate, setShowTemplate] = useState(true);
  const [showFullPreview, setShowFullPreview] = useState(false);

  useEffect(() => {
    if (prefillPostData?.topic) {
      setPostContent(prefillPostData.topic);
      setPrefillPostData(null);
      toast({ title: "Idée chargée ✨" });
    }
  }, [prefillPostData]);

  const handleNextStep = () => {
    if (step === 1 && selectedTrigger) setStep(2);
    else if (step === 2 && selectedAngle) {
      const template = TEMPLATES[selectedTrigger!]?.[selectedAngle!];
      if (template && !postContent.trim()) {
        setPostContent(template.template);
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step === 3) {
      // Retour de l'étape 3 à 2 : réinitialiser le contenu du post
      setPostContent("");
      setShowTemplate(true);
      setStep(2);
    } else if (step === 2) {
      // Retour de l'étape 2 à 1 : réinitialiser l'angle sélectionné
      setSelectedAngle(null);
      setStep(1);
    }
  };

  const handleReset = () => {
    // Réinitialiser tout le processus
    setStep(1);
    setSelectedTrigger(null);
    setSelectedAngle(null);
    setAnswers([]);
    setPostContent("");
    setShowTemplate(true);
  };

  const handleInsertHook = (hook: string) => {
    setPostContent(hook + "\n\n" + (postContent.startsWith('[') ? '' : postContent));
    toast({ title: "Accroche ajoutée ✨" });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(postContent);
    setCopied(true);
    toast({ title: "Copié ! 📋" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSavePost({
        content: postContent,
        status: 'draft',
        type: selectedTrigger || 'other',
        metadata: { trigger: selectedTrigger, angle: selectedAngle, answers }
      });
      toast({ title: "Sauvegardé ! ✅" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const currentTemplate = selectedTrigger && selectedAngle ? TEMPLATES[selectedTrigger]?.[selectedAngle] : null;
  const currentHooks = selectedTrigger && selectedAngle ? getHooks(selectedTrigger, selectedAngle) : [];
  const currentQuestions = selectedTrigger ? GUIDED_QUESTIONS[selectedTrigger] : [];

  return (
    <div className="min-h-[85vh] flex flex-col animate-fade-in bg-gradient-to-b from-secondary/30 to-background">
      {/* Progress */}
      <div className="flex justify-center items-center gap-3 py-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
              step > s ? "bg-green-500 text-white" : step === s ? "bg-primary text-white" : "bg-border text-muted-foreground"
            )}>
              {step > s ? <Check className="w-4 h-4" /> : s}
        </div>
            {s < 3 && <div className={cn("w-12 h-0.5", step > s ? "bg-green-500" : "bg-border")} />}
          </div>
        ))}
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pt-4">
        <div className="w-full max-w-4xl">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">Qu'est-ce qui s'est passé ?</h1>
                <p className="text-muted-foreground">Choisissez ce qui a déclenché une réflexion</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {TRIGGERS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTrigger(t.id)}
                    className={cn(
                      "p-5 rounded-2xl border-2 bg-white text-left transition-all hover:shadow-md",
                      selectedTrigger === t.id ? "border-primary bg-primary/5 shadow-md" : "border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div className="text-3xl mb-3">{t.emoji}</div>
                    <p className="font-semibold text-foreground text-sm mb-1">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-center">
                <Button onClick={handleNextStep} disabled={!selectedTrigger} className="btn-primary px-8">
                  Continuer <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex justify-center mb-4">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {TRIGGERS.find(t => t.id === selectedTrigger)?.emoji} {TRIGGERS.find(t => t.id === selectedTrigger)?.label}
                </Badge>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">Comment le raconter ?</h1>
                <p className="text-muted-foreground">Choisissez l'angle qui vous parle le plus</p>
            </div>

              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {ANGLES.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAngle(a.id)}
                    className={cn(
                      "px-6 py-4 rounded-2xl border-2 bg-white text-center transition-all hover:shadow-md min-w-[140px]",
                      selectedAngle === a.id ? "border-primary bg-primary/5 shadow-md" : "border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div className="text-2xl mb-2">{a.emoji}</div>
                    <p className="font-semibold text-foreground text-sm">{a.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
                  </button>
                ))}
              </div>

              {selectedAngle && currentTemplate && (
                <div className="bg-white rounded-2xl border border-border/50 p-5 mb-8 animate-fade-in">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Structure suggérée</p>
                  <div className="flex flex-wrap gap-2">
                    {currentTemplate.structure.map((item, i) => (
                      <Badge key={i} variant="outline" className="text-sm px-3 py-1.5 bg-secondary/50">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center mr-2">{i + 1}</span>
                        {item}
                      </Badge>
                    ))}
              </div>
            </div>
              )}

              <div className="flex justify-center gap-3">
                <Button variant="ghost" onClick={handleReset} className="text-muted-foreground">
                  Recommencer
                    </Button>
                <Button variant="outline" onClick={handlePrevStep}><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
                <Button onClick={handleNextStep} disabled={!selectedAngle} className="btn-primary px-8">
                  Continuer <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                </div>
                  </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="flex justify-center gap-2 mb-4">
                <Badge variant="secondary">{TRIGGERS.find(t => t.id === selectedTrigger)?.emoji} {TRIGGERS.find(t => t.id === selectedTrigger)?.label}</Badge>
                <Badge variant="secondary">{ANGLES.find(a => a.id === selectedAngle)?.emoji} {ANGLES.find(a => a.id === selectedAngle)?.label}</Badge>
                </div>

              <div className="text-center mb-6">
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">Rédigez votre post</h1>
                <p className="text-muted-foreground">Écrivez librement ou utilisez les suggestions</p>
                </div>

              {/* Hooks */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Accroches suggérées
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentHooks.map((hook, i) => (
                    <button
                      key={i}
                      onClick={() => handleInsertHook(hook)}
                      className="px-4 py-2 rounded-full border border-border/50 bg-white hover:bg-primary/5 hover:border-primary/30 text-sm transition-all"
                    >
                      <Quote className="w-3 h-3 inline mr-2 text-primary" />
                      {hook.slice(0, 50)}{hook.length > 50 ? '...' : ''}
                    </button>
                  ))}
                </div>
                </div>

              {/* Editor + Template */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Votre post</p>
                  <Textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Écrivez votre post ici..."
                    className="zen-textarea min-h-[400px] text-base bg-white"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className={cn(
                      "text-xs",
                      postContent.length >= 500 && postContent.length <= 1500 ? "text-green-600 font-medium" : "text-muted-foreground"
                    )}>
                      {postContent.length} caractères {postContent.length >= 500 && postContent.length <= 1500 && "✓"}
                    </span>
                </div>
                </div>

                {/* Aperçu LinkedIn */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Aperçu LinkedIn
                  </p>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                    {/* Header du post LinkedIn */}
                    <div className="p-4 flex items-start gap-3 border-b border-gray-100">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {brandProfile.companyName.charAt(0).toUpperCase()}
              </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{brandProfile.companyName}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{brandProfile.sector}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">À l'instant • 🌐</p>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">•••</button>
                    </div>
                    
                    {/* Contenu du post */}
                    <div className="p-4 flex-1 overflow-auto max-h-[300px]">
                      {postContent.trim() ? (
                        <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {postContent.length > 280 && !showFullPreview ? (
                            <>
                              {postContent.slice(0, 280)}
                              <button 
                                onClick={() => setShowFullPreview(true)}
                                className="text-blue-600 font-medium hover:underline"
                              >
                                ...voir plus
                              </button>
                </>
              ) : (
                <>
                              {postContent}
                              {postContent.length > 280 && showFullPreview && (
                                <button 
                                  onClick={() => setShowFullPreview(false)}
                                  className="block mt-2 text-blue-600 font-medium hover:underline text-xs"
                                >
                                  voir moins
                                </button>
                              )}
                </>
              )}
              </div>
            ) : (
                        <div className="text-sm text-gray-400 italic">
                          Votre post apparaîtra ici...
                  </div>
                      )}
                </div>

                    {/* Stats engagement (simulées) */}
                    <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <span className="flex -space-x-1">
                          <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white">👍</span>
                          <span className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center text-[8px] text-white">❤️</span>
                        </span>
                        <span className="ml-1">12</span>
                    </div>
                      <span>3 commentaires</span>
                  </div>
                  
                    {/* Actions LinkedIn */}
                    <div className="px-2 py-2 border-t border-gray-100 flex items-center justify-around text-xs text-gray-600">
                      <button className="flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-100 transition-colors">
                        <span>👍</span> J'aime
                      </button>
                      <button className="flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-100 transition-colors">
                        <span>💬</span> Commenter
                      </button>
                      <button className="flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-100 transition-colors">
                        <span>🔄</span> Republier
                      </button>
                      <button className="flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-100 transition-colors">
                        <span>📤</span> Envoyer
                      </button>
                    </div>
                  </div>
                  
                  {/* Stats rapides */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className={cn(
                      "p-2 rounded-lg text-center border",
                      postContent.length >= 500 && postContent.length <= 1500 
                        ? "bg-green-50 border-green-200 text-green-700" 
                        : "bg-secondary/50 border-border/50 text-muted-foreground"
                    )}>
                      <span className="font-semibold">{postContent.length}</span> car.
                      {postContent.length >= 500 && postContent.length <= 1500 && " ✓"}
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/50 border border-border/50 text-center text-muted-foreground">
                      <span className="font-semibold">{Math.ceil(postContent.split(/\s+/).filter(Boolean).length / 200) || 0}</span> min
                    </div>
                    <div className={cn(
                      "p-2 rounded-lg text-center border",
                      postContent.includes('?') 
                        ? "bg-green-50 border-green-200 text-green-700" 
                        : "bg-secondary/50 border-border/50 text-muted-foreground"
                    )}>
                      CTA {postContent.includes('?') ? "✓" : "—"}
                    </div>
                  </div>
                  </div>
                </div>

              {/* Tips */}
              {currentTemplate && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
                  <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 text-sm mb-2">Conseils pour ce format</p>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {currentTemplate.tips.map((tip, i) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-center gap-3 flex-wrap">
                <Button variant="ghost" onClick={handleReset} className="text-muted-foreground">
                  Recommencer
                  </Button>
                <Button variant="outline" onClick={handlePrevStep}><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
                <Button variant="outline" onClick={handleSave} disabled={saving || !postContent.trim()}>
                  <Save className="w-4 h-4 mr-2" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                <Button onClick={handleCopy} disabled={!postContent.trim()} className="btn-primary">
                  {copied ? <><Check className="w-4 h-4 mr-2" /> Copié !</> : <><Copy className="w-4 h-4 mr-2" /> Copier pour LinkedIn</>}
                  </Button>
                </div>
              </div>
            )}
      </div>
                  </div>
    </div>
  );
}
