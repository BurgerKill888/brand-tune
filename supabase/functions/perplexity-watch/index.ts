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

    const systemPrompt = `Tu es un expert en veille stratégique et actualités pour les professionnels LinkedIn.

Contexte de la marque:
- Entreprise: ${brandProfile.companyName}
- Secteur: ${brandProfile.sector}
- Cibles: ${brandProfile.targets.join(', ')}
- Objectifs: ${brandProfile.businessObjectives.join(', ')}

MISSION: Recherche les VRAIES actualités récentes (derniers jours/semaine) sur le sujet demandé.
Tu DOIS citer des sources RÉELLES avec leurs URLs complètes.

Pour chaque actualité trouvée, fournis:
1. Le titre EXACT de l'article/actualité
2. Un résumé factuel en 2-3 phrases
3. Le nom du média/source (ex: Les Echos, TechCrunch, LinkedIn News, etc.)
4. L'URL COMPLÈTE et VALIDE de l'article
5. Un angle éditorial pour créer un post LinkedIn percutant
6. La pertinence pour cette marque (high/medium/low)
7. L'objectif business visé (reach/credibility/lead/engagement)
8. Une alerte si l'info est sensible ou à traiter avec précaution

Retourne EXACTEMENT 5 à 8 résultats au format JSON strict:
{
  "items": [
    {
      "title": "Titre exact de l'article",
      "summary": "Résumé factuel de l'actualité",
      "source": "Nom du média",
      "url": "https://url-complete-de-larticle.com/...",
      "publishedDate": "Date de publication si connue",
      "angle": "Angle éditorial suggéré pour un post LinkedIn engageant",
      "relevance": "high",
      "objective": "reach",
      "alert": "Alerte optionnelle si sujet sensible"
    }
  ]
}

IMPORTANT: Ne fournis QUE des actualités RÉELLES avec des sources vérifiables.`;

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
          { role: 'user', content: `Recherche les dernières actualités et tendances récentes (cette semaine) sur: "${query}". Fournis des sources réelles avec leurs URLs complètes.` }
        ],
        search_recency_filter: 'week',
        return_citations: true,
        return_related_questions: false,
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
    console.log('Citations count:', data.citations?.length || 0);

    const content = data.choices[0]?.message?.content || '';
    const citations = data.citations || [];
    
    // Parse JSON from response
    let items = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        items = parsed.items || [];
        
        // Enrich items with citations and validate URLs
        items = items.map((item: any, index: number) => {
          // Try to get URL from item, then from citations
          let url = item.url || '';
          
          // If URL is empty or invalid, try to use citation
          if (!url || !url.startsWith('http')) {
            url = citations[index] || '';
          }
          
          // Extract domain for source name if not provided
          let source = item.source || '';
          if (!source && url) {
            try {
              const urlObj = new URL(url);
              source = urlObj.hostname.replace('www.', '');
            } catch {
              source = 'Source web';
            }
          }
          
          return {
            ...item,
            id: crypto.randomUUID(),
            url: url,
            source: source,
            publishedDate: item.publishedDate || null,
            createdAt: new Date().toISOString(),
          };
        });
      }
    } catch (parseError) {
      console.error('Failed to parse Perplexity response:', parseError);
      console.log('Raw content:', content.slice(0, 500));
      
      // Create items from citations as fallback
      if (citations.length > 0) {
        items = citations.slice(0, 5).map((citationUrl: string, index: number) => {
          let sourceName = 'Source web';
          try {
            const urlObj = new URL(citationUrl);
            sourceName = urlObj.hostname.replace('www.', '');
          } catch {}
          
          return {
            id: crypto.randomUUID(),
            title: `Actualité #${index + 1} sur "${query}"`,
            summary: content.slice(index * 200, (index + 1) * 200) || 'Voir la source pour plus de détails.',
            source: sourceName,
            url: citationUrl,
            angle: 'À définir selon votre expertise',
            relevance: 'medium' as const,
            objective: 'reach' as const,
            createdAt: new Date().toISOString(),
          };
        });
      } else {
        items = [{
          id: crypto.randomUUID(),
          title: 'Résultat de recherche',
          summary: content.slice(0, 500),
          source: 'Perplexity AI',
          url: '',
          angle: 'À définir',
          relevance: 'medium',
          objective: 'reach',
          createdAt: new Date().toISOString(),
        }];
      }
    }

    console.log(`Returning ${items.length} items`);
    
    return new Response(JSON.stringify({ 
      items, 
      citations,
      query,
      timestamp: new Date().toISOString()
    }), {
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
