import { useState } from "react";
import { Plus, RefreshCw, Heart, ExternalLink, Sparkles } from "lucide-react";
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
};

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
      const { data, error } = await supabase.functions.invoke('generate-post', {
        body: {
          topic: `Génère 6 idées de posts LinkedIn sur le thème: "${theme}". 
          
          Pour chaque idée, génère:
          - Un titre accrocheur de 1-2 phrases maximum
          - Une catégorie parmi: Bonnes pratiques, Explication / analyse, Liste de conseils/règles/etc, Conseil percutant, Tendance du moment, Retour d'expérience
          
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
        // Try to extract JSON from content
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
        // Fallback: generate sample ideas
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
      // Use fallback ideas
      setIdeas(generateFallbackIdeas(theme));
      toast({
        title: "Idées générées",
        description: "Voici quelques suggestions basées sur votre thème.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackIdeas = (themeInput: string): PostIdea[] => {
    const templates = [
      { template: `4 réflexes à adopter pour collaborer efficacement avec ${themeInput}`, category: "Bonnes pratiques" },
      { template: `Pourquoi ${themeInput} a encore besoin de l'humain : petit décryptage sur la relation complémentaire`, category: "Explication / analyse" },
      { template: `13 questions incontournables à se poser avant d'intégrer ${themeInput} dans un projet`, category: "Liste de conseils/règles/etc" },
      { template: `Oublier d'écrire un brief précis pour ${themeInput} ? C'est risquer l'irrelevant.`, category: "Conseil percutant" },
      { template: `3 gestes simples pour sécuriser vos données quand vous utilisez ${themeInput}`, category: "Bonnes pratiques" },
      { template: `8 erreurs fréquentes lors de l'utilisation de ${themeInput} (et comment les éviter)`, category: "Liste de conseils/règles/etc" },
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
            Choisis un thème et génère des idées de posts.
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1.5">
          <span className="text-primary font-semibold">{generationsRemaining}/5</span>
          <span className="ml-1 text-muted-foreground">Lancements gratuits</span>
        </Badge>
      </div>

      {/* Theme Input */}
      <div className="flex items-center gap-3">
        <Button
          onClick={generateIdeas}
          disabled={isGenerating || !theme.trim()}
          className="bg-primary hover:bg-primary/90 gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau thème
        </Button>
        <Input
          placeholder="Ex: IA, marketing digital, leadership..."
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generateIdeas()}
          className="max-w-xs"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={generateIdeas}
          disabled={isGenerating || !theme.trim()}
          className={cn(
            "rounded-full bg-primary text-primary-foreground hover:bg-primary/90",
            isGenerating && "animate-spin"
          )}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Heart className="w-5 h-5" />
        </Button>
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
            Entrez un thème ci-dessus et cliquez sur "Nouveau thème" pour générer des idées de posts LinkedIn.
          </p>
        </div>
      )}
    </div>
  );
}