import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandProfile } = await req.json();
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

    if (!PERPLEXITY_API_KEY) {
      console.error('PERPLEXITY_API_KEY not configured');
      throw new Error('API key not configured');
    }

    console.log('Generating daily inspiration for:', brandProfile.companyName, brandProfile.sector);

    const systemPrompt = `Tu es un expert en stratégie de contenu LinkedIn pour le secteur ${brandProfile.sector}.
Tu dois fournir des inspirations quotidiennes personnalisées pour ${brandProfile.companyName}.

Contexte de la marque:
- Secteur: ${brandProfile.sector}
- Cibles: ${brandProfile.targets?.join(', ') || 'Professionnels'}
- Ton: ${brandProfile.tone}
- Valeurs: ${brandProfile.values?.join(', ') || 'Excellence, Innovation'}
- Objectifs: ${brandProfile.businessObjectives?.join(', ') || 'Visibilité, Crédibilité'}

Tu dois retourner un JSON valide avec cette structure exacte:
{
  "themes": [
    {
      "id": "theme_1",
      "title": "Titre du thème accrocheur",
      "description": "Description détaillée de l'angle à exploiter (2-3 phrases)",
      "angle": "L'angle éditorial unique à adopter",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
      "relevance": "Pourquoi ce thème est pertinent aujourd'hui pour votre audience"
    }
  ],
  "accounts": [
    {
      "name": "Nom Prénom ou Nom Entreprise",
      "role": "Fonction/Description",
      "reason": "Pourquoi suivre ce compte (expertise, contenu, etc.)",
      "topics": ["sujet1", "sujet2"]
    }
  ],
  "news": [
    {
      "title": "Titre de l'actualité",
      "summary": "Résumé concis de l'actualité",
      "source": "Source de l'info",
      "angle": "Comment transformer cette actu en post LinkedIn"
    }
  ]
}

IMPORTANT:
- Fournis exactement 3 thèmes du jour variés et inspirants
- Fournis 5 comptes LinkedIn influents et pertinents pour le secteur ${brandProfile.sector}
- Fournis 3 actualités récentes du secteur avec des angles de contenu
- Les thèmes doivent être actionnables et donner envie de créer du contenu
- Les comptes suggérés doivent être de vraies personnes/entreprises influentes du secteur
- Retourne UNIQUEMENT le JSON, sans texte avant ou après`;

    const userPrompt = `Génère les inspirations du jour pour ${brandProfile.companyName} dans le secteur ${brandProfile.sector}. 
Recherche les tendances actuelles, les actualités chaudes du secteur, et identifie les influenceurs LinkedIn pertinents.
Date: ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

    console.log('Calling Perplexity API...');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Perplexity response received');

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    // Parse JSON from response
    let inspirationData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        inspirationData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw content:', content);
      
      // Return fallback data
      inspirationData = {
        themes: [
          {
            id: "theme_1",
            title: "L'authenticité dans votre communication",
            description: "Partagez une histoire personnelle qui illustre vos valeurs d'entreprise. Les posts authentiques génèrent 3x plus d'engagement.",
            angle: "Storytelling personnel",
            hashtags: ["authenticité", "leadership", brandProfile.sector?.toLowerCase() || "business"],
            relevance: "L'authenticité est la clé de l'engagement sur LinkedIn en 2024"
          },
          {
            id: "theme_2", 
            title: "Les tendances qui transforment votre secteur",
            description: "Analysez une tendance émergente et partagez votre point de vue d'expert. Positionnez-vous comme thought leader.",
            angle: "Analyse experte",
            hashtags: ["tendances", "innovation", "futur"],
            relevance: "Votre audience recherche des insights exclusifs"
          },
          {
            id: "theme_3",
            title: "Célébrez une réussite d'équipe",
            description: "Mettez en avant une victoire récente de votre équipe. Humanisez votre marque employeur.",
            angle: "Marque employeur",
            hashtags: ["teamwork", "success", "culture"],
            relevance: "Les contenus RH performent très bien auprès des décideurs"
          }
        ],
        accounts: [
          {
            name: "Leaders du secteur",
            role: "Influenceurs " + (brandProfile.sector || "Business"),
            reason: "Contenu de qualité et insights pertinents",
            topics: ["stratégie", "innovation"]
          }
        ],
        news: [
          {
            title: "Actualités du secteur",
            summary: "Restez informé des dernières tendances de votre industrie",
            source: "Veille sectorielle",
            angle: "Partagez votre analyse experte"
          }
        ]
      };
    }

    console.log('Returning inspiration data with', inspirationData.themes?.length, 'themes');

    return new Response(JSON.stringify(inspirationData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in daily-inspiration:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        themes: [],
        accounts: [],
        news: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});