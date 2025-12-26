import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeWatchRequest {
  query: string;
  brandProfile: {
    companyName: string;
    sector: string;
    targets: string[];
    businessObjectives: string[];
    values: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, brandProfile }: AnalyzeWatchRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un expert en veille stratégique et marketing de contenu LinkedIn.
Tu dois analyser les tendances et sujets actuels et proposer des sources et angles éditoriaux pertinents.

CONTEXTE DE LA MARQUE:
- Entreprise: ${brandProfile.companyName}
- Secteur: ${brandProfile.sector}
- Cibles: ${brandProfile.targets.join(', ')}
- Objectifs: ${brandProfile.businessObjectives.join(', ')}
- Valeurs: ${brandProfile.values.join(', ')}

Pour chaque tendance ou sujet trouvé, tu dois:
1. Identifier pourquoi c'est pertinent pour la marque
2. Proposer un angle éditorial unique
3. Évaluer la pertinence (high, medium, low)
4. Associer un objectif (reach, credibility, lead, engagement)

Réponds en JSON avec ce format exact:
{
  "items": [
    {
      "title": "Titre de l'article/tendance",
      "summary": "Résumé en 2-3 phrases",
      "source": "Nom de la source",
      "url": "URL fictive mais réaliste",
      "angle": "Angle éditorial suggéré pour créer du contenu",
      "relevance": "high|medium|low",
      "objective": "reach|credibility|lead|engagement",
      "alert": "Alerte optionnelle si sujet sensible ou urgent"
    }
  ]
}

Génère 4-6 résultats pertinents et variés.`;

    console.log("Analyzing watch query:", query);

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
          { role: "user", content: `Analyse les tendances et actualités récentes sur: "${query}". Identifie les sujets pertinents pour créer du contenu LinkedIn.` }
        ],
        temperature: 0.7,
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
      throw new Error("Erreur d'analyse IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("Raw AI response:", content);

    // Parse the JSON response
    let watchData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        watchData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      watchData = { items: [] };
    }

    return new Response(JSON.stringify(watchData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in analyze-watch:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
