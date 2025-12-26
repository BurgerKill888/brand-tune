import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateCalendarRequest {
  watchItems: Array<{
    title: string;
    angle: string;
    objective: string;
  }>;
  brandProfile: {
    companyName: string;
    sector: string;
    tone: string;
    publishingFrequency: string;
    businessObjectives: string[];
    values: string[];
  };
  startDate: string;
  weeksCount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { watchItems, brandProfile, startDate, weeksCount }: GenerateCalendarRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const frequencyMap: Record<string, number> = {
      'daily': 5,
      '3-per-week': 3,
      '2-per-week': 2,
      'weekly': 1
    };

    const postsPerWeek = frequencyMap[brandProfile.publishingFrequency] || 2;
    const totalPosts = postsPerWeek * weeksCount;

    const systemPrompt = `Tu es un expert en stratégie éditoriale LinkedIn.
Tu dois créer un calendrier éditorial structuré et équilibré.

CONTEXTE:
- Entreprise: ${brandProfile.companyName}
- Secteur: ${brandProfile.sector}
- Ton: ${brandProfile.tone}
- Fréquence: ${brandProfile.publishingFrequency} (${postsPerWeek} posts/semaine)
- Objectifs: ${brandProfile.businessObjectives.join(', ')}
- Valeurs: ${brandProfile.values.join(', ')}

SOURCES DE VEILLE DISPONIBLES:
${watchItems.map(item => `- ${item.title} (Angle: ${item.angle})`).join('\n')}

RÈGLES DU CALENDRIER:
1. Équilibrer les types de contenu:
   - educational: contenu éducatif, tips, guides
   - storytelling: histoires personnelles, parcours
   - promotional: promotion produit/service (max 20%)
   - engagement: questions, sondages, débats
   - news: actualités secteur, tendances

2. Varier les objectifs (reach, credibility, lead, engagement)
3. Respecter la fréquence demandée
4. Proposer des thèmes alignés avec la veille fournie
5. Suggérer des dates réalistes à partir de ${startDate}

Génère ${totalPosts} posts pour ${weeksCount} semaines.

Réponds en JSON:
{
  "items": [
    {
      "date": "2025-01-06",
      "theme": "Titre/thème du post",
      "type": "educational|storytelling|promotional|engagement|news",
      "objective": "Description courte de l'objectif",
      "status": "scheduled"
    }
  ]
}`;

    console.log("Generating calendar for", weeksCount, "weeks");

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
          { role: "user", content: `Crée le calendrier éditorial pour les ${weeksCount} prochaines semaines.` }
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
      throw new Error("Erreur de génération IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("Raw AI response:", content);

    let calendarData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        calendarData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      calendarData = { items: [] };
    }

    return new Response(JSON.stringify(calendarData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in generate-calendar:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
