import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeneratePostRequest {
  topic: string;
  length: 'short' | 'medium' | 'long';
  postType: 'instructif' | 'inspirant' | 'promotionnel' | 'storytelling' | 'engagement';
  postCategory: 'explication' | 'conseil' | 'tendance' | 'cas-etude' | 'annonce';
  emojiStyle: 'adapte' | 'beaucoup' | 'peu' | 'aucun';
  registre: 'tutoiement' | 'vouvoiement';
  langue: 'francais' | 'anglais';
  brandProfile: {
    companyName: string;
    sector: string;
    tone: string;
    values: string[];
    forbiddenWords: string[];
    targets: string[];
    businessObjectives: string[];
  };
  includeCta: boolean;
}

// Logique de structure selon le type de post
const getPostStructure = (postType: string, postCategory: string): string => {
  const structures: Record<string, Record<string, string>> = {
    instructif: {
      explication: `STRUCTURE ÉDUCATIVE:
1. Hook: Pose une question ou un constat surprenant
2. Contexte: Explique le "pourquoi" en 2-3 lignes
3. Développement: 3-5 points clés numérotés ou avec bullets
4. Conclusion: Synthèse actionnable
5. CTA: Question ouverte pour engager la discussion`,
      conseil: `STRUCTURE CONSEIL PRATIQUE:
1. Hook: "Voici comment..." ou "La méthode pour..."
2. Le problème commun que les gens rencontrent
3. La solution en étapes claires (numérotées)
4. Un exemple concret d'application
5. CTA: Invite à partager leur expérience`,
      tendance: `STRUCTURE TENDANCE:
1. Hook: Chiffre ou statistique frappante
2. Explication de la tendance
3. Impact sur le secteur/métier
4. Comment s'y adapter
5. CTA: Demande leur avis sur cette évolution`,
      'cas-etude': `STRUCTURE CAS D'ÉTUDE:
1. Hook: Résultat impressionnant obtenu
2. Contexte: La situation de départ
3. Le défi rencontré
4. La solution mise en place
5. Les résultats chiffrés
6. CTA: Question sur leur expérience similaire`,
      annonce: `STRUCTURE ANNONCE:
1. Hook: Nouvelle excitante à partager
2. Le contexte et pourquoi c'est important
3. Les détails clés
4. Ce que ça change pour l'audience
5. CTA: Action concrète (lien, inscription, etc.)`
    },
    inspirant: {
      explication: `STRUCTURE INSPIRATION ANALYTIQUE:
1. Hook: Citation ou observation profonde
2. Réflexion personnelle sur le sujet
3. Leçon tirée de l'expérience
4. Comment appliquer cette sagesse
5. CTA: Inviter au partage d'expérience`,
      conseil: `STRUCTURE INSPIRATION PRATIQUE:
1. Hook: Moment de prise de conscience
2. Ce que j'ai appris
3. Le conseil qui en découle
4. Pourquoi ça fonctionne
5. CTA: Encourager à essayer`,
      tendance: `STRUCTURE VISION INSPIRANTE:
1. Hook: Vision du futur
2. Les signaux faibles observés
3. Pourquoi c'est enthousiasmant
4. Comment se préparer
5. CTA: Partager leur vision`,
      'cas-etude': `STRUCTURE HISTOIRE INSPIRANTE:
1. Hook: Le moment décisif
2. Le contexte et les obstacles
3. La décision courageuse
4. La transformation
5. La leçon universelle
6. CTA: Leur moment similaire`,
      annonce: `STRUCTURE ANNONCE INSPIRANTE:
1. Hook: Le rêve qui devient réalité
2. Le chemin parcouru
3. Ce que ça représente
4. La vision pour la suite
5. CTA: Rejoindre l'aventure`
    },
    promotionnel: {
      explication: `STRUCTURE PROMO ÉDUCATIVE:
1. Hook: Problème que l'audience connaît
2. Pourquoi ce problème persiste
3. Notre approche/solution unique
4. Preuve sociale ou résultat
5. CTA: Découvrir l'offre`,
      conseil: `STRUCTURE PROMO CONSEIL:
1. Hook: Conseil gratuit de valeur
2. Développement du conseil
3. Lien subtil avec notre expertise
4. Offre pour aller plus loin
5. CTA: Passage à l'action`,
      tendance: `STRUCTURE PROMO TENDANCE:
1. Hook: Tendance majeure du secteur
2. Notre positionnement sur cette tendance
3. Ce que nous proposons
4. Témoignage ou preuve
5. CTA: En savoir plus`,
      'cas-etude': `STRUCTURE PROMO CAS CLIENT:
1. Hook: Résultat client impressionnant
2. Situation initiale du client
3. Notre intervention
4. Résultats détaillés
5. CTA: Obtenir les mêmes résultats`,
      annonce: `STRUCTURE LANCEMENT:
1. Hook: Grande nouvelle
2. Ce que nous lançons
3. Pourquoi c'est unique
4. Offre de lancement
5. CTA: Profiter de l'offre`
    },
    storytelling: {
      explication: `STRUCTURE HISTOIRE EXPLICATIVE:
1. Hook: "Il y a [temps], je..."
2. Le contexte de l'histoire
3. Le problème rencontré
4. La révélation/apprentissage
5. La leçon à retenir
6. CTA: Leur histoire similaire`,
      conseil: `STRUCTURE HISTOIRE CONSEIL:
1. Hook: Erreur que j'ai faite
2. Ce qui s'est passé
3. Comment j'ai corrigé
4. Le conseil qui en découle
5. CTA: Leurs erreurs transformées`,
      tendance: `STRUCTURE HISTOIRE TENDANCE:
1. Hook: Ce que j'ai observé récemment
2. L'anecdote révélatrice
3. Ce que ça dit de notre époque
4. Comment je m'adapte
5. CTA: Leurs observations`,
      'cas-etude': `STRUCTURE HISTOIRE COMPLÈTE:
1. Hook: Le moment où tout a changé
2. Acte 1: La situation initiale
3. Acte 2: Le défi et la lutte
4. Acte 3: La résolution
5. La morale de l'histoire
6. CTA: Leur propre histoire`,
      annonce: `STRUCTURE HISTOIRE D'ANNONCE:
1. Hook: Comment cette idée est née
2. Le chemin de création
3. Les obstacles surmontés
4. L'aboutissement
5. CTA: Faire partie de la suite`
    },
    engagement: {
      explication: `STRUCTURE DÉBAT:
1. Hook: Question polarisante
2. Les deux points de vue
3. Ton opinion nuancée
4. CTA: Demander leur avis`,
      conseil: `STRUCTURE SONDAGE:
1. Hook: Dilemme courant
2. Les options possibles
3. Avantages/inconvénients
4. CTA: Quel est ton choix?`,
      tendance: `STRUCTURE DISCUSSION TENDANCE:
1. Hook: Tendance controversée
2. Les pour et les contre
3. Ta position
4. CTA: D'accord ou pas?`,
      'cas-etude': `STRUCTURE QUIZ/DÉFI:
1. Hook: Situation à analyser
2. Les éléments du cas
3. Les options de réponse
4. CTA: Quelle décision prendrais-tu?`,
      annonce: `STRUCTURE ANNONCE PARTICIPATIVE:
1. Hook: On a besoin de vous
2. Ce qu'on prépare
3. Comment participer
4. CTA: Action immédiate`
    }
  };

  return structures[postType]?.[postCategory] || structures.instructif.explication;
};

// Logique des emojis
const getEmojiGuidance = (emojiStyle: string): string => {
  const guidance: Record<string, string> = {
    adapte: `EMOJIS - USAGE ADAPTÉ:
- Utilise 3-5 emojis stratégiquement placés
- 1 emoji dans le hook pour attirer l'attention
- 1-2 emojis pour les points clés
- 1 emoji pour le CTA
- Choisis des emojis professionnels: ✅ 💡 🎯 📈 🚀 💪 ⚡ 🔑 📌`,
    beaucoup: `EMOJIS - USAGE GÉNÉREUX:
- Utilise 6-10 emojis tout au long du post
- Chaque point ou paragraphe peut avoir son emoji
- Emoji au début de chaque bullet point
- Emojis expressifs autorisés: 🔥 ❤️ 😊 🙌 ✨ 💥`,
    peu: `EMOJIS - USAGE MINIMAL:
- Maximum 2 emojis dans tout le post
- 1 dans le hook si pertinent
- 1 pour le CTA éventuellement
- Seulement des emojis sobres: ✅ 📌 💡`,
    aucun: `EMOJIS - AUCUN:
- N'utilise AUCUN emoji dans le post
- Style professionnel et sobre
- Mise en forme par le texte uniquement (sauts de ligne, tirets, numéros)`
  };
  return guidance[emojiStyle] || guidance.adapte;
};

// Logique du registre
const getRegistreGuidance = (registre: string): string => {
  const guidance: Record<string, string> = {
    tutoiement: `REGISTRE - TUTOIEMENT:
- Utilise "tu", "toi", "ton", "ta", "tes"
- Ton direct et proche
- Crée une connexion personnelle
- Ex: "Tu veux progresser?", "Voici ce que tu dois savoir"`,
    vouvoiement: `REGISTRE - VOUVOIEMENT:
- Utilise "vous", "votre", "vos"
- Ton respectueux et professionnel
- Distance appropriée pour le B2B
- Ex: "Vous souhaitez améliorer?", "Voici ce que vous devez retenir"`
  };
  return guidance[registre] || guidance.vouvoiement;
};

// Logique de la langue
const getLangueGuidance = (langue: string): string => {
  const guidance: Record<string, string> = {
    francais: `LANGUE - FRANÇAIS:
- Rédige intégralement en français
- Utilise un français professionnel mais accessible
- Évite les anglicismes sauf s'ils sont courants dans le secteur
- Hashtags en français quand possible`,
    anglais: `LANGUE - ENGLISH:
- Write entirely in English
- Use professional but accessible language
- Suitable for international LinkedIn audience
- Hashtags in English`
  };
  return guidance[langue] || guidance.francais;
};

// Logique de longueur
const getLengthGuidance = (length: string): string => {
  const guidance: Record<string, string> = {
    short: `LONGUEUR - COURT (300-500 caractères):
- Post percutant et direct
- 1-2 paragraphes maximum
- Idéal pour les messages forts
- Hook + Message clé + CTA`,
    medium: `LONGUEUR - MOYEN (600-1200 caractères):
- Post développé mais concis
- 3-4 paragraphes
- Permet d'argumenter
- Structure classique LinkedIn`,
    long: `LONGUEUR - LONG (1300-2500 caractères):
- Post approfondi
- 5-6 paragraphes
- Idéal pour storytelling ou analyses
- Utilise le format "See more" à ton avantage`
  };
  return guidance[length] || guidance.medium;
};

// Logique du type de post
const getPostTypeGuidance = (postType: string): string => {
  const guidance: Record<string, string> = {
    instructif: `TYPE - INSTRUCTIF:
- Objectif: Éduquer et informer
- Apporte une vraie valeur ajoutée
- Montre ton expertise
- Donne des informations actionnables`,
    inspirant: `TYPE - INSPIRANT:
- Objectif: Motiver et élever
- Partage une vision ou des valeurs
- Connecte émotionnellement
- Pousse à l'action positive`,
    promotionnel: `TYPE - PROMOTIONNEL:
- Objectif: Convertir subtilement
- 80% valeur, 20% promotion
- Preuve sociale importante
- CTA clair mais pas agressif`,
    storytelling: `TYPE - STORYTELLING:
- Objectif: Créer une connexion
- Utilise la structure narrative (début, milieu, fin)
- Inclus des détails concrets
- Finis par une leçon universelle`,
    engagement: `TYPE - ENGAGEMENT:
- Objectif: Générer des interactions
- Pose des questions
- Crée un débat constructif
- Invite explicitement à commenter`
  };
  return guidance[postType] || guidance.instructif;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: GeneratePostRequest = await req.json();
    const { 
      topic, 
      length = 'medium', 
      postType = 'instructif',
      postCategory = 'explication',
      emojiStyle = 'adapte',
      registre = 'vouvoiement',
      langue = 'francais',
      brandProfile, 
      includeCta = true 
    } = requestData;

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    // Construction du prompt avec toute la logique
    const systemPrompt = `Tu es un expert en création de contenu LinkedIn avec plus de 10 ans d'expérience.
Tu crées des posts qui génèrent de l'engagement, de la crédibilité et des opportunités business.

═══════════════════════════════════════════════════════════
PROFIL DE MARQUE À RESPECTER ABSOLUMENT
═══════════════════════════════════════════════════════════
🏢 Entreprise: ${brandProfile.companyName}
📊 Secteur: ${brandProfile.sector}
🎯 Cibles: ${brandProfile.targets.join(', ')}
💼 Objectifs business: ${brandProfile.businessObjectives.join(', ')}
💎 Valeurs: ${brandProfile.values.join(', ')}
🎨 Ton de marque: ${brandProfile.tone}
🚫 Mots/expressions INTERDITS: ${brandProfile.forbiddenWords.length > 0 ? brandProfile.forbiddenWords.join(', ') : 'Aucun'}

═══════════════════════════════════════════════════════════
PARAMÈTRES DE GÉNÉRATION
═══════════════════════════════════════════════════════════

${getPostTypeGuidance(postType)}

${getPostStructure(postType, postCategory)}

${getLengthGuidance(length)}

${getEmojiGuidance(emojiStyle)}

${getRegistreGuidance(registre)}

${getLangueGuidance(langue)}

═══════════════════════════════════════════════════════════
RÈGLES LINKEDIN OBLIGATOIRES
═══════════════════════════════════════════════════════════
1. HOOK PUISSANT: Les 2 premières lignes sont cruciales (avant le "...voir plus")
2. AÉRATION: Sauts de ligne entre chaque idée (max 2-3 lignes par paragraphe)
3. LISIBILITÉ: Phrases courtes, langage clair
4. AUTHENTICITÉ: Évite le jargon corporate vide de sens
5. ${includeCta ? 'CTA ENGAGEANT: Termine par une question ouverte ou un appel à l\'action' : 'Pas de CTA explicite'}
6. HASHTAGS: 3-5 hashtags pertinents à la fin, jamais dans le corps du texte

═══════════════════════════════════════════════════════════
FORMAT DE RÉPONSE (JSON STRICT)
═══════════════════════════════════════════════════════════
{
  "content": "Le post LinkedIn complet, prêt à être publié",
  "variants": [
    "Variante alternative du hook #1",
    "Variante alternative du hook #2"
  ],
  "suggestions": [
    "Suggestion d'amélioration #1",
    "Suggestion d'amélioration #2"
  ],
  "readabilityScore": 85,
  "editorialJustification": "Explication de comment ce post respecte la charte éditoriale et pourquoi il devrait performer",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "keywords": ["mot-clé1", "mot-clé2", "mot-clé3"]
}`;

    const userMessage = langue === 'anglais' 
      ? `Create a LinkedIn post about: "${topic}"`
      : `Crée un post LinkedIn sur le thème: "${topic}"`;

    console.log("Generating post with Claude for topic:", topic);
    console.log("Parameters:", { postType, postCategory, emojiStyle, registre, langue, length });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          { role: "user", content: userMessage }
        ],
        system: systemPrompt,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Clé API Anthropic invalide ou expirée." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Erreur API Anthropic: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    
    console.log("Raw Claude response received");

    // Parse the JSON response
    let postData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        postData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error, using fallback:", parseError);
      postData = {
        content: content,
        variants: [],
        suggestions: ["Le post a été généré mais le format JSON n'a pas pu être parsé"],
        readabilityScore: 75,
        editorialJustification: "Post généré avec les paramètres demandés",
        hashtags: [],
        keywords: []
      };
    }

    // Validation et nettoyage
    postData.content = postData.content || '';
    postData.variants = Array.isArray(postData.variants) ? postData.variants : [];
    postData.suggestions = Array.isArray(postData.suggestions) ? postData.suggestions : [];
    postData.hashtags = Array.isArray(postData.hashtags) ? postData.hashtags : [];
    postData.keywords = Array.isArray(postData.keywords) ? postData.keywords : [];
    postData.readabilityScore = typeof postData.readabilityScore === 'number' ? postData.readabilityScore : 75;

    return new Response(JSON.stringify(postData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in generate-post:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
