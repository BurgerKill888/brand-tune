import { useState } from "react";
import { 
  Search, 
  ExternalLink, 
  TrendingUp,
  Bookmark,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { WatchItem, BrandProfile } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/appStore";

interface WatchViewProps {
  brandProfile: BrandProfile;
  watchItems: WatchItem[];
  onAddWatchItem: (item: WatchItem) => void;
  onSaveItems: (items: WatchItem[]) => Promise<{ error: any }>;
}

export function WatchView({ brandProfile, watchItems, onAddWatchItem, onSaveItems }: WatchViewProps) {
  const { toast } = useToast();
  const { setCurrentView } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<WatchItem[]>(watchItems);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Entrez une requête",
        description: "Tapez des mots-clés pour lancer la recherche.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use Perplexity-powered watch function
      const { data, error: fnError } = await supabase.functions.invoke('perplexity-watch', {
        body: {
          query: searchQuery,
          brandProfile: {
            companyName: brandProfile.companyName,
            sector: brandProfile.sector,
            targets: brandProfile.targets,
            businessObjectives: brandProfile.businessObjectives,
          }
        }
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      const newItems: WatchItem[] = (data.items || []).map((item: any) => ({
        id: crypto.randomUUID(),
        brandProfileId: brandProfile.id,
        title: item.title,
        summary: item.summary,
        source: item.source,
        url: item.url,
        angle: item.angle,
        relevance: item.relevance,
        objective: item.objective,
        alert: item.alert,
        createdAt: new Date(),
      }));

      setItems(newItems);
      
      // Save to database
      await onSaveItems(newItems);

      toast({
        title: `${newItems.length} tendances trouvées`,
        description: "Perplexity a analysé les sujets pertinents pour votre marque.",
      });
    } catch (err: unknown) {
      console.error("Watch analysis error:", err);
      const message = err instanceof Error ? err.message : "Erreur lors de l'analyse";
      setError(message);
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = (item: WatchItem) => {
    setCurrentView('posts');
    toast({
      title: "Angle sélectionné",
      description: `Créez un post sur: ${item.angle}`,
    });
  };

  const relevanceColors = {
    high: "success",
    medium: "warning", 
    low: "secondary",
  } as const;

  const objectiveLabels = {
    reach: "Reach",
    credibility: "Crédibilité",
    lead: "Lead",
    engagement: "Engagement",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Veille Sourcée
          </h1>
          <p className="text-muted-foreground mt-1">
            Découvrez les dernières tendances et inspirations pour {brandProfile.companyName}
          </p>
        </div>
        <Badge variant="info" className="px-3 py-1">
          <TrendingUp className="w-3 h-3 mr-1" />
          {items.length} sources
        </Badge>
      </div>

      {/* Search Bar */}
      <Card variant="elevated">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Ex: IA marketing B2B, tendances LinkedIn, growth hacking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="h-12 pl-12"
              />
            </div>
            <Button 
              variant="premium" 
              size="lg"
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Rechercher avec Perplexity
            </Button>
          </div>
          
          {error && (
            <div className="flex items-start gap-2 p-3 mt-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {items.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            Lancez une recherche pour découvrir les tendances
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            L'IA analysera les sujets pertinents pour votre secteur
          </p>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {items.map((item) => (
          <Card 
            key={item.id} 
            variant="elevated"
            className="group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="mt-2 flex items-center gap-2">
                    <span className="font-medium">{item.source}</span>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 hover:text-primary" />
                      </a>
                    )}
                  </CardDescription>
                </div>
                <Badge variant={relevanceColors[item.relevance]}>
                  {item.relevance === 'high' ? 'Haute' : item.relevance === 'medium' ? 'Moyenne' : 'Basse'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.summary}
              </p>
              
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Angle suggéré
                </p>
                <p className="text-sm font-medium text-foreground">
                  {item.angle}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Badge variant="outline">
                  {objectiveLabels[item.objective]}
                </Badge>
                
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleCreatePost(item)}
                  >
                    Créer un post
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>

              {item.alert && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-700">{item.alert}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
