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

const getPostStructure = (postType: string, postCategory: string): string => {
  const structures: Record<string, Record<string, string>> = {
    instructif: {
      explication: `STRUCTURE ÉDUCATIVE:
1. Hook: Question ou constat surprenant
2. Contexte en 2-3 lignes
3. 3-5 points clés numérotés
4. Synthèse actionnable
5. CTA: Question ouverte`,
      conseil: `STRUCTURE CONSEIL: Hook "Voici comment...", problème, solution en étapes, exemple concret, CTA partage.`,
      tendance: `STRUCTURE TENDANCE: Hook chiffré, explication, impact, adaptation, CTA avis.`,
      'cas-etude': `STRUCTURE CAS D'ÉTUDE: Hook résultat, contexte, défi, solution, résultats chiffrés, CTA.`,
      annonce: `STRUCTURE ANNONCE: Hook nouvelle, contexte, détails, impact audience, CTA action.`
    },
    inspirant: {
      explication: `STRUCTURE INSPIRATION: Citation, réflexion, leçon, application, CTA partage.`,
      conseil: `STRUCTURE INSPIRATION PRATIQUE: Prise de conscience, apprentissage, conseil, pourquoi, CTA.`,
      tendance: `STRUCTURE VISION: Vision futur, signaux faibles, enthousiasme, préparation, CTA vision.`,
      'cas-etude': `STRUCTURE HISTOIRE INSPIRANTE: Moment décisif, contexte, décision, transformation, leçon, CTA.`,
      annonce: `STRUCTURE ANNONCE INSPIRANTE: Rêve réalisé, chemin, signification, vision suite, CTA.`
    },
    promotionnel: {
      explication: `STRUCTURE PROMO ÉDUCATIVE: Problème, persistance, solution unique, preuve, CTA offre.`,
      conseil: `STRUCTURE PROMO CONSEIL: Conseil gratuit, développement, lien expertise, offre, CTA.`,
      tendance: `STRUCTURE PROMO TENDANCE: Tendance, positionnement, proposition, témoignage, CTA.`,
      'cas-etude': `STRUCTURE PROMO CAS CLIENT: Résultat, situation, intervention, résultats, CTA.`,
      annonce: `STRUCTURE LANCEMENT: Nouvelle, lancement, unicité, offre, CTA.`
    },
    storytelling: {
      explication: `STRUCTURE HISTOIRE: "Il y a X temps...", contexte, problème, révélation, leçon, CTA.`,
      conseil: `STRUCTURE HISTOIRE CONSEIL: Erreur, déroulement, correction, conseil, CTA.`,
      tendance: `STRUCTURE HISTOIRE TENDANCE: Observation, anecdote, époque, adaptation, CTA.`,
      'cas-etude': `STRUCTURE HISTOIRE COMPLÈTE: Moment-clé, situation, défi, résolution, morale, CTA.`,
      annonce: `STRUCTURE HISTOIRE ANNONCE: Naissance idée, création, obstacles, aboutissement, CTA.`
    },
    engagement: {
      explication: `STRUCTURE DÉBAT: Question polarisante, deux points de vue, opinion nuancée, CTA avis.`,
      conseil: `STRUCTURE SONDAGE: Dilemme, options, avantages/inconvénients, CTA choix.`,
      tendance: `STRUCTURE DISCUSSION: Tendance controversée, pour/contre, position, CTA.`,
      'cas-etude': `STRUCTURE QUIZ: Situation, éléments, options, CTA décision.`,
      annonce: `STRUCTURE PARTICIPATIVE: Besoin, projet, participation, CTA action.`
    }
  };
  return structures[postType]?.[postCategory] || structures.instructif.explication;
};

const getEmojiGuidance = (s: string) => ({
  adapte: 'EMOJIS: 3-5 emojis stratégiques (✅ 💡 🎯 📈 🚀).',
  beaucoup: 'EMOJIS: 6-10 emojis expressifs tout au long.',
  peu: 'EMOJIS: Maximum 2 emojis sobres.',
  aucun: 'EMOJIS: Aucun emoji, style sobre.'
} as Record<string,string>)[s] || 'EMOJIS: 3-5 emojis adaptés.';

const getRegistreGuidance = (r: string) =>
  r === 'tutoiement' ? 'REGISTRE: Tutoiement (tu, toi, ton).' : 'REGISTRE: Vouvoiement (vous, votre).';

const getLangueGuidance = (l: string) =>
  l === 'anglais' ? 'LANGUE: Write entirely in English, professional tone.' : 'LANGUE: Rédige en français professionnel.';

const getLengthGuidance = (l: string) => ({
  short: 'LONGUEUR: 300-500 caractères, percutant.',
  medium: 'LONGUEUR: 600-1200 caractères, 3-4 paragraphes.',
  long: 'LONGUEUR: 1300-2500 caractères, approfondi.'
} as Record<string,string>)[l] || 'LONGUEUR: 600-1200 caractères.';

const getPostTypeGuidance = (t: string) => ({
  instructif: 'TYPE: Éduquer, apporter de la valeur, montrer expertise.',
  inspirant: 'TYPE: Motiver, partager vision, connecter émotionnellement.',
  promotionnel: 'TYPE: Convertir subtilement, 80% valeur 20% promo.',
  storytelling: 'TYPE: Créer connexion via narration (début, milieu, fin).',
  engagement: 'TYPE: Générer interactions, questions, débat.'
} as Record<string,string>)[t] || 'TYPE: Éduquer.';

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un expert en création de contenu LinkedIn avec plus de 10 ans d'expérience.

═══════════════════════════════════════════════════════════
PROFIL DE MARQUE À RESPECTER
═══════════════════════════════════════════════════════════
🏢 Entreprise: ${brandProfile.companyName}
📊 Secteur: ${brandProfile.sector}
🎯 Cibles: ${brandProfile.targets.join(', ')}
💼 Objectifs: ${brandProfile.businessObjectives.join(', ')}
💎 Valeurs: ${brandProfile.values.join(', ')}
🎨 Ton: ${brandProfile.tone}
🚫 Mots INTERDITS: ${brandProfile.forbiddenWords.length > 0 ? brandProfile.forbiddenWords.join(', ') : 'Aucun'}

═══════════════════════════════════════════════════════════
PARAMÈTRES
═══════════════════════════════════════════════════════════
${getPostTypeGuidance(postType)}
${getPostStructure(postType, postCategory)}
${getLengthGuidance(length)}
${getEmojiGuidance(emojiStyle)}
${getRegistreGuidance(registre)}
${getLangueGuidance(langue)}

═══════════════════════════════════════════════════════════
RÈGLES LINKEDIN
═══════════════════════════════════════════════════════════
1. HOOK PUISSANT (2 premières lignes)
2. AÉRATION: sauts de ligne, paragraphes courts
3. Phrases courtes, langage clair
4. Évite jargon corporate vide
5. ${includeCta ? 'CTA engageant à la fin' : 'Pas de CTA explicite'}
6. 3-5 hashtags pertinents à la fin uniquement

FORMAT DE RÉPONSE (JSON STRICT, aucun texte avant/après):
{
  "content": "Le post LinkedIn complet",
  "variants": ["Variante hook 1", "Variante hook 2"],
  "suggestions": ["Amélioration 1", "Amélioration 2"],
  "readabilityScore": 85,
  "editorialJustification": "Pourquoi ce post performe",
  "hashtags": ["hashtag1", "hashtag2"],
  "keywords": ["mot1", "mot2"]
}`;

    const userMessage = langue === 'anglais'
      ? `Create a LinkedIn post about: "${topic}". Respond ONLY with valid JSON.`
      : `Crée un post LinkedIn sur le thème: "${topic}". Réponds UNIQUEMENT avec un JSON valide.`;

    console.log("Generating post via Lovable AI for topic:", topic);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits Lovable AI épuisés. Ajoutez des crédits dans les paramètres." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Erreur Lovable AI: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    console.log("Raw AI response received");

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
