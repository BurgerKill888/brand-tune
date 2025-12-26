import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeneratePostRequest {
  topic: string;
  length: 'short' | 'medium' | 'long';
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, length, brandProfile, includeCta }: GeneratePostRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const lengthGuide = {
      short: '300-500 caractères maximum',
      medium: '600-1000 caractères',
      long: '1200-1800 caractères'
    };

    const systemPrompt = `Tu es un expert en création de contenu LinkedIn pour les entreprises B2B.
Tu dois créer des posts LinkedIn engageants, professionnels et optimisés pour l'algorithme LinkedIn.

CHARTE ÉDITORIALE À RESPECTER:
- Entreprise: ${brandProfile.companyName}
- Secteur: ${brandProfile.sector}
- Ton: ${brandProfile.tone}
- Valeurs à transmettre: ${brandProfile.values.join(', ')}
- Mots interdits: ${brandProfile.forbiddenWords.join(', ') || 'Aucun'}
- Cibles: ${brandProfile.targets.join(', ')}
- Objectifs business: ${brandProfile.businessObjectives.join(', ')}

RÈGLES DE RÉDACTION:
1. Commence par un hook percutant (emoji + phrase d'accroche)
2. Structure le contenu avec des sauts de ligne
3. Utilise des bullet points ou numérotation si pertinent
4. ${includeCta ? 'Termine par un CTA engageant (question ouverte de préférence)' : 'Pas de CTA explicite'}
5. Ajoute 3-5 hashtags pertinents à la fin
6. Longueur: ${lengthGuide[length]}
7. Évite absolument les mots interdits listés
8. Reste authentique et aligné avec le ton demandé

Tu dois répondre en JSON avec ce format exact:
{
  "content": "Le post LinkedIn complet prêt à publier",
  "variants": ["Variante 1 du hook", "Variante 2 du hook"],
  "suggestions": ["Suggestion 1 d'amélioration", "Suggestion 2"],
  "readabilityScore": 85,
  "editorialJustification": "Explication de pourquoi ce post est aligné avec la charte",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "keywords": ["mot-clé1", "mot-clé2"]
}`;

    console.log("Generating post for topic:", topic);

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
          { role: "user", content: `Crée un post LinkedIn sur le thème: "${topic}"` }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits épuisés. Ajoutez des crédits à votre espace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erreur de génération IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("Raw AI response:", content);

    // Parse the JSON response
    let postData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        postData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error, using fallback:", parseError);
      // Fallback if JSON parsing fails
      postData = {
        content: content,
        variants: [],
        suggestions: ["Ajoutez une question pour encourager l'engagement"],
        readabilityScore: 75,
        editorialJustification: "Post généré selon la charte éditoriale",
        hashtags: [],
        keywords: []
      };
    }

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
