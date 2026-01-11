import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WatchRequest {
  query: string;
  brandProfile: {
    companyName: string;
    sector: string;
    targets: string[];
    businessObjectives: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, brandProfile } = await req.json() as WatchRequest;
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

    if (!perplexityApiKey) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    console.log('Perplexity watch query:', query);
    console.log('Brand context:', brandProfile.companyName, brandProfile.sector);

    const systemPrompt = `Tu es un expert en veille stratégique LinkedIn pour les entreprises B2B.
    
Contexte de la marque:
- Entreprise: ${brandProfile.companyName}
- Secteur: ${brandProfile.sector}
- Cibles: ${brandProfile.targets.join(', ')}
- Objectifs: ${brandProfile.businessObjectives.join(', ')}

Tu dois rechercher des actualités, tendances et informations pertinentes pour créer du contenu LinkedIn engageant.

Retourne EXACTEMENT 5 résultats au format JSON:
{
  "items": [
    {
      "title": "Titre accrocheur de l'actualité",
      "summary": "Résumé en 2-3 phrases",
      "source": "Nom de la source",
      "url": "URL de la source si disponible",
      "angle": "Angle éditorial suggéré pour un post LinkedIn",
      "relevance": "high" | "medium" | "low",
      "objective": "reach" | "credibility" | "lead" | "engagement"
    }
  ]
}`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Recherche les dernières actualités et tendances sur: ${query}` }
        ],
        search_recency_filter: 'week',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Perplexity response received');

    const content = data.choices[0]?.message?.content || '';
    const citations = data.citations || [];
    
    // Parse JSON from response
    let items = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        items = parsed.items || [];
        
        // Enrich with citations if available
        items = items.map((item: any, index: number) => ({
          ...item,
          url: item.url || citations[index] || '',
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }));
      }
    } catch (parseError) {
      console.error('Failed to parse Perplexity response:', parseError);
      // Return raw content as fallback
      items = [{
        id: crypto.randomUUID(),
        title: 'Résultat de recherche',
        summary: content.slice(0, 500),
        source: 'Perplexity AI',
        url: citations[0] || '',
        angle: 'À définir',
        relevance: 'medium',
        objective: 'reach',
        createdAt: new Date().toISOString(),
      }];
    }

    return new Response(JSON.stringify({ items, citations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Perplexity watch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
