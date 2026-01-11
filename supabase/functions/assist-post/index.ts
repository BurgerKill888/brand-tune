import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { content, action, brandProfile } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prompts personnalisés selon l'action
    const prompts: Record<string, string> = {
      improve: `Tu es un expert en copywriting LinkedIn. Améliore ce post pour le rendre plus engageant, professionnel et impactant.

Règles :
- Garde le sens et le message original
- Améliore la fluidité et le rythme
- Utilise des phrases courtes et percutantes
- Ajoute des retours à la ligne pour aérer
- Garde un ton authentique et humain
- Ne mets PAS de hashtags

Post original :
${content}

Réponds UNIQUEMENT avec le post amélioré, sans explication.`,

      punchier: `Tu es un expert en copywriting LinkedIn. Rends ce post plus percutant et direct.

Règles :
- Raccourcis les phrases (max 15 mots par phrase)
- Supprime les mots inutiles
- Ajoute de l'impact et de l'énergie
- Utilise des verbes d'action
- Garde le message essentiel
- Ne mets PAS de hashtags

Post original :
${content}

Réponds UNIQUEMENT avec le post amélioré, sans explication.`,

      rephrase: `Tu es un expert en copywriting LinkedIn. Reformule ce post de manière différente tout en gardant le même message.

Règles :
- Change la structure et les tournures de phrases
- Garde le sens et l'intention
- Propose une approche narrative différente
- Reste authentique et humain
- Ne mets PAS de hashtags

Post original :
${content}

Réponds UNIQUEMENT avec le post reformulé, sans explication.`,

      hook: `Tu es un expert en copywriting LinkedIn. Ajoute une accroche percutante au début de ce post.

Règles pour l'accroche :
- Maximum 10 mots
- Doit créer la curiosité ou l'émotion
- Peut être une question, une affirmation forte, ou une stat
- Doit donner envie de lire la suite
- Pas de clichés type "Je vais vous révéler..."

Post original :
${content}

Réponds UNIQUEMENT avec le post complet (accroche + contenu), sans explication.`,

      question: `Tu es un expert en copywriting LinkedIn. Ajoute une question engageante à la fin de ce post pour encourager les commentaires.

Règles pour la question :
- Question ouverte (pas de oui/non)
- Doit inviter au partage d'expérience
- Liée au sujet du post
- Authentique, pas marketing

Post original :
${content}

Réponds UNIQUEMENT avec le post complet (contenu + question finale), sans explication.`,

      complete: `Tu es un expert en copywriting LinkedIn. Complète et améliore cette ébauche de post.

Contexte de l'auteur :
- Entreprise : ${brandProfile?.companyName || 'Non spécifié'}
- Secteur : ${brandProfile?.sector || 'Non spécifié'}
- Ton souhaité : ${brandProfile?.tone || 'professionnel et authentique'}

Règles :
- Développe l'idée de manière cohérente
- Ajoute une accroche si absente
- Structure avec des retours à la ligne
- Termine par une question ou un call-to-action
- Reste authentique, pas de jargon marketing
- Entre 800 et 1200 caractères idéalement
- Ne mets PAS de hashtags

Ébauche :
${content}

Réponds UNIQUEMENT avec le post complet, sans explication.`,
    };

    const systemPrompt = `Tu es un coach expert en création de contenu LinkedIn authentique. 
Tu aides les professionnels à créer des posts qui reflètent leur vécu et leur expertise.
Tu écris en français, de manière naturelle et humaine.
Tu ne fais JAMAIS de réponse explicative, tu donnes UNIQUEMENT le post demandé.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompts[action] || prompts.improve,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Erreur API Anthropic (${response.status}): ${errorText.slice(0, 100)}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Anthropic response:', JSON.stringify(data).slice(0, 200));
    const generatedContent = data.content?.[0]?.text || '';
    
    if (!generatedContent) {
      return new Response(
        JSON.stringify({ error: 'Pas de contenu généré par l\'IA' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ content: generatedContent.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in assist-post function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

