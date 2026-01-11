import { useState } from "react";
import { Plus, RefreshCw, Heart, ExternalLink, Sparkles, Search, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BrandProfile } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface IdeasViewProps {
  brandProfile: BrandProfile;
  onUseIdea: (idea: PostIdea) => void;
}

export interface PostIdea {
  id: string;
  title: string;
  category: string;
  color: string;
  source?: string;
  angle?: string;
}

const IDEA_COLORS = [
  "bg-purple-100 border-purple-200",
  "bg-cyan-100 border-cyan-200",
  "bg-amber-100 border-amber-200",
  "bg-emerald-100 border-emerald-200",
  "bg-pink-100 border-pink-200",
  "bg-blue-100 border-blue-200",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Bonnes pratiques": "text-purple-600",
  "Explication / analyse": "text-cyan-600",
  "Liste de conseils/règles/etc": "text-amber-600",
  "Conseil percutant": "text-emerald-600",
  "Tendance du moment": "text-pink-600",
  "Retour d'expérience": "text-blue-600",
  "Actualité": "text-red-600",
  "Innovation": "text-indigo-600",
};

const CATEGORIES = [
  "Bonnes pratiques",
  "Explication / analyse", 
  "Liste de conseils/règles/etc",
  "Conseil percutant",
  "Tendance du moment",
  "Retour d'expérience",
  "Actualité",
  "Innovation",
];

export function IdeasView({ brandProfile, onUseIdea }: IdeasViewProps) {
  const { toast } = useToast();
  const [theme, setTheme] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<Set<string>>(new Set());
  const [generationsRemaining, setGenerationsRemaining] = useState(5);

  const generateIdeas = async () => {
    if (!theme.trim()) {
      toast({
        title: "Thème requis",
        description: "Veuillez entrer un thème pour générer des idées.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Use Perplexity to search for trending topics related to the theme
      const { data, error } = await supabase.functions.invoke('perplexity-watch', {
        body: {
          query: `Actualités, tendances et sujets chauds sur "${theme}" pour créer du contenu LinkedIn professionnel engageant. Focus sur les dernières nouveautés, études de cas, statistiques récentes et bonnes pratiques.`,
          brandProfile: {
            companyName: brandProfile.companyName,
            sector: brandProfile.sector,
            targets: brandProfile.targets || [],
            businessObjectives: brandProfile.businessObjectives || [],
          },
        }
      });

      if (error) throw error;

      // Transform Perplexity results into post ideas
      const perplexityItems = data.items || [];
      
      const parsedIdeas: PostIdea[] = perplexityItems.map((item: {
        title: string;
        summary?: string;
        source?: string;
        angle?: string;
        objective?: string;
      }, index: number) => {
        // Map objective to category
        let category = "Tendance du moment";
        if (item.objective === "credibility") category = "Explication / analyse";
        else if (item.objective === "engagement") category = "Conseil percutant";
        else if (item.objective === "lead") category = "Bonnes pratiques";
        else if (item.title?.toLowerCase().includes("étude") || item.title?.toLowerCase().includes("rapport")) {
          category = "Actualité";
        } else if (item.title?.toLowerCase().includes("conseil") || item.title?.toLowerCase().includes("astuce")) {
          category = "Liste de conseils/règles/etc";
        }

        return {
          id: crypto.randomUUID(),
          title: item.angle || item.title || item.summary?.slice(0, 100) || "Idée de post",
          category,
          color: IDEA_COLORS[index % IDEA_COLORS.length],
          source: item.source,
          angle: item.angle,
        };
      });

      // If we got results, add some creative variations
      if (parsedIdeas.length > 0) {
        setIdeas(parsedIdeas);
        setGenerationsRemaining(prev => Math.max(0, prev - 1));
        
        toast({
          title: "Idées générées avec Perplexity !",
          description: `${parsedIdeas.length} idées basées sur les dernières actualités de "${theme}".`,
        });
      } else {
        // Fallback to generate-post if no Perplexity results
        await generateWithAI();
      }
    } catch (err) {
      console.error("Perplexity error, falling back to AI generation:", err);
      await generateWithAI();
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWithAI = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-post', {
        body: {
          topic: `Génère 6 idées de posts LinkedIn originales et percutantes sur le thème: "${theme}". 
          
          Chaque idée doit être:
          - Basée sur une tendance actuelle ou un angle original
          - Adaptée au secteur: ${brandProfile.sector}
          - Pertinente pour la cible: ${brandProfile.targets?.join(', ') || 'professionnels'}
          
          Pour chaque idée, génère:
          - Un titre accrocheur de 1-2 phrases maximum (angle éditorial précis)
          - Une catégorie parmi: ${CATEGORIES.join(', ')}
          
          Retourne un JSON avec le format:
          {
            "ideas": [
              {"title": "...", "category": "..."},
              ...
            ]
          }`,
          brandProfile: {
            companyName: brandProfile.companyName,
            sector: brandProfile.sector,
            tone: brandProfile.tone,
            values: brandProfile.values,
            targets: brandProfile.targets,
          },
          returnIdeas: true,
        }
      });

      if (error) throw error;

      // Parse the response
      let parsedIdeas: PostIdea[] = [];
      
      try {
        const content = data.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.ideas && Array.isArray(parsed.ideas)) {
            parsedIdeas = parsed.ideas.map((idea: { title: string; category: string }, index: number) => ({
              id: crypto.randomUUID(),
              title: idea.title,
              category: idea.category || "Bonnes pratiques",
              color: IDEA_COLORS[index % IDEA_COLORS.length],
            }));
          }
        }
      } catch {
        parsedIdeas = generateFallbackIdeas(theme);
      }

      if (parsedIdeas.length === 0) {
        parsedIdeas = generateFallbackIdeas(theme);
      }

      setIdeas(parsedIdeas);
      setGenerationsRemaining(prev => Math.max(0, prev - 1));

      toast({
        title: "Idées générées !",
        description: `${parsedIdeas.length} nouvelles idées de posts disponibles.`,
      });
    } catch (err) {
      console.error("Error generating ideas:", err);
      setIdeas(generateFallbackIdeas(theme));
      toast({
        title: "Idées générées",
        description: "Voici quelques suggestions basées sur votre thème.",
      });
    }
  };

  const generateFallbackIdeas = (themeInput: string): PostIdea[] => {
    const templates = [
      { template: `Les 5 tendances ${themeInput} qui vont transformer votre métier en 2025`, category: "Tendance du moment" },
      { template: `Pourquoi ${themeInput} change la donne : retour d'expérience après 6 mois`, category: "Retour d'expérience" },
      { template: `10 erreurs que tout le monde fait avec ${themeInput} (et comment les éviter)`, category: "Liste de conseils/règles/etc" },
      { template: `${themeInput} : le guide ultime pour les débutants qui veulent se démarquer`, category: "Bonnes pratiques" },
      { template: `Ce que personne ne vous dit sur ${themeInput} (insights exclusifs)`, category: "Conseil percutant" },
      { template: `Comment ${themeInput} a doublé notre productivité : étude de cas détaillée`, category: "Explication / analyse" },
    ];

    return templates.map((t, index) => ({
      id: crypto.randomUUID(),
      title: t.template,
      category: t.category,
      color: IDEA_COLORS[index % IDEA_COLORS.length],
    }));
  };

  const toggleSaveIdea = (id: string) => {
    setSavedIdeas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Générateur d'idées
          </h1>
          <p className="text-muted-foreground mt-1">
            Recherche les dernières tendances et génère des idées de posts pertinentes.
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1.5">
          <span className="text-primary font-semibold">{generationsRemaining}/5</span>
          <span className="ml-1 text-muted-foreground">Lancements gratuits</span>
        </Badge>
      </div>

      {/* Theme Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ex: IA générative, marketing B2B, leadership, cybersécurité..."
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateIdeas()}
            className="pl-10"
          />
        </div>
        <Button
          onClick={generateIdeas}
          disabled={isGenerating || !theme.trim()}
          className="bg-primary hover:bg-primary/90 gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Recherche...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Générer des idées
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={generateIdeas}
          disabled={isGenerating || !theme.trim()}
          className="rounded-full"
        >
          <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Heart className="w-5 h-5" />
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-secondary/50 border border-border rounded-lg p-3 flex items-center gap-3">
        <Search className="w-5 h-5 text-primary" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Recherche intelligente :</span> Les idées sont générées à partir des dernières actualités et tendances du web grâce à Perplexity AI.
        </p>
      </div>

      {/* Ideas Grid */}
      {ideas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <Card
              key={idea.id}
              className={cn(
                "relative p-4 border-2 transition-all hover:shadow-md cursor-pointer group",
                idea.color
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSaveIdea(idea.id);
                }}
              >
                <Heart
                  className={cn(
                    "w-4 h-4",
                    savedIdeas.has(idea.id) && "fill-red-500 text-red-500"
                  )}
                />
              </Button>

              <p className="text-sm font-medium text-foreground pr-8 min-h-[60px]">
                {idea.title}
              </p>

              {idea.source && (
                <p className="text-xs text-muted-foreground mt-2">
                  Source: {idea.source}
                </p>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/10">
                <span className={cn("text-xs font-medium", CATEGORY_COLORS[idea.category] || "text-muted-foreground")}>
                  {idea.category}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 hover:bg-white/50"
                  onClick={() => onUseIdea(idea)}
                >
                  Utiliser
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucune idée générée
          </h3>
          <p className="text-muted-foreground max-w-md">
            Entrez un thème ci-dessus (ex: "intelligence artificielle", "recrutement", "développement durable") 
            et cliquez sur "Générer des idées" pour découvrir les dernières tendances.
          </p>
        </div>
      )}
    </div>
  );
}
