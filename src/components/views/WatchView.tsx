import { useState, useEffect } from "react";
import { 
  Search, 
  Newspaper,
  ExternalLink,
  RefreshCw,
  Clock,
  PenLine,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandProfile, WatchItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useAppStore } from "@/store/appStore";

interface WatchViewProps {
  brandProfile: BrandProfile;
  items: WatchItem[];
  onSaveItems: (items: WatchItem[]) => Promise<{ error: Error | null }>;
  onNavigate?: (view: 'free-post') => void;
}

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url?: string;
  angle: string;
  generating?: boolean;
}

interface SavedWatchData {
  newsItems: NewsItem[];
  lastQuery: string;
  lastUpdated: string;
}

const WATCH_STORAGE_KEY = 'watch_news_cache';

// Fonction pour charger le cache de façon synchrone
function loadCachedData(): SavedWatchData | null {
  try {
    const cachedData = localStorage.getItem(WATCH_STORAGE_KEY);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (e) {
    console.error('Error loading cached news:', e);
  }
  return null;
}

export function WatchView({ brandProfile, items, onSaveItems, onNavigate }: WatchViewProps) {
  const { toast } = useToast();
  const { setPrefillPostData } = useAppStore();
  
  // Charger le cache immédiatement à l'initialisation
  const cachedData = loadCachedData();
  
  const [searchQuery, setSearchQuery] = useState(() => {
    return cachedData?.lastQuery || brandProfile.sector || "";
  });
  
  const [newsItems, setNewsItems] = useState<NewsItem[]>(() => {
    return cachedData?.newsItems || [];
  });
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    return cachedData?.lastUpdated ? new Date(cachedData.lastUpdated) : null;
  });
  
  const [loading, setLoading] = useState(false);

  const saveToCache = (items: NewsItem[], query: string) => {
    const data: SavedWatchData = {
      newsItems: items,
      lastQuery: query,
      lastUpdated: new Date().toISOString()
    };
    try {
      localStorage.setItem(WATCH_STORAGE_KEY, JSON.stringify(data));
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Error saving to cache:', e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('perplexity-watch', {
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

      if (error) throw error;

      const formattedItems: NewsItem[] = (data.items || []).map((item: any) => ({
        title: item.title,
        summary: item.summary,
        source: item.source || 'Source web',
        url: item.url,
        angle: item.angle,
        generating: false,
      }));

      setNewsItems(formattedItems);
      saveToCache(formattedItems, searchQuery);

      toast({
        title: "Veille mise à jour ! 📰",
        description: `${formattedItems.length} actualités trouvées`,
      });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de charger les actualités pour le moment.",
        variant: "destructive"
      });
      // Fallback avec des données mockées
      const fallbackItems: NewsItem[] = [
        {
          title: `Tendances ${brandProfile.sector} 2026 : ce qui change`,
          summary: "Les nouvelles réglementations et attentes du marché transforment les pratiques du secteur.",
          source: "Veille automatique",
          angle: "Que pensez-vous de ces évolutions ?",
          generating: false
        },
        {
          title: `Innovation dans ${brandProfile.sector} : les startups qui transforment le marché`,
          summary: "De nouvelles approches émergent et redéfinissent les standards du secteur.",
          source: "Veille automatique",
          angle: "Comment votre entreprise s'adapte-t-elle ?",
          generating: false
        }
      ];
      setNewsItems(fallbackItems);
      saveToCache(fallbackItems, searchQuery);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (item: NewsItem, index: number) => {
    // Marquer comme en cours de génération
    const updated = [...newsItems];
    updated[index].generating = true;
    setNewsItems(updated);

    try {
      // Générer un post basé sur l'article
      const { data, error } = await supabase.functions.invoke('generate-post', {
        body: {
          topic: `Article: "${item.title}"\n\nRésumé: ${item.summary}\n\nAngle suggéré: ${item.angle}`,
          action: 'complete',
          length: 'medium',
          postType: 'engagement',
          postCategory: 'opinion',
          emojiStyle: 'adapte',
          registre: 'tutoiement',
          langue: 'francais',
          brandProfile: {
            companyName: brandProfile.companyName,
            sector: brandProfile.sector,
            tone: brandProfile.tone,
            values: brandProfile.values,
            forbiddenWords: brandProfile.forbiddenWords,
            targets: brandProfile.targets,
            businessObjectives: brandProfile.businessObjectives,
            firstName: brandProfile.firstName,
          },
          includeCta: true,
        }
      });

      if (error) throw error;

      const generatedContent = data?.content || createFallbackPost(item, brandProfile);

      // Sauvegarder le contenu généré et naviguer
      setPrefillPostData({
        topic: generatedContent,
        category: undefined,
      });

      toast({
        title: "Post créé ! ✨",
        description: "Vous pouvez le modifier avant de publier.",
      });

      // Naviguer vers l'éditeur
      if (onNavigate) {
        onNavigate('free-post');
      }

    } catch (error) {
      console.error('Post generation error:', error);
      
      // Créer un post de fallback
      const fallbackContent = createFallbackPost(item, brandProfile);
      
      setPrefillPostData({
        topic: fallbackContent,
        category: undefined,
      });

      toast({
        title: "Post créé",
        description: "Vous pouvez le personnaliser.",
      });

      if (onNavigate) {
        onNavigate('free-post');
      }
    } finally {
      // Remettre l'état normal
      const resetItems = [...newsItems];
      resetItems[index].generating = false;
      setNewsItems(resetItems);
    }
  };

  // Créer un post de fallback basé sur l'article
  const createFallbackPost = (item: NewsItem, profile: BrandProfile): string => {
    const firstName = profile.firstName || 'Je';
    return `${item.angle}

J'ai lu récemment un article intéressant : "${item.title}"

${item.summary}

Ça m'a fait réfléchir. Dans mon secteur (${profile.sector}), on observe des tendances similaires.

Voici ma vision :
→ [Partagez votre point de vue personnel]
→ [Ajoutez une expérience vécue]
→ [Proposez une piste de réflexion]

Et vous, qu'en pensez-vous ? Comment voyez-vous ces évolutions impacter votre quotidien ?

---
${firstName}`;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          Veille & Actus
        </h1>
        <p className="text-muted-foreground">
          Transformez les actualités en posts LinkedIn authentiques
        </p>
      </div>

      {/* Barre de recherche */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Rechercher des actualités sur un thème..."
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : newsItems.length > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Newspaper className="w-5 h-5 text-primary" />
            Actus {searchQuery || brandProfile.sector}
          </h2>
          {lastUpdated && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: fr })}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-5">
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : newsItems.length > 0 ? (
          <div className="space-y-4">
            {newsItems.map((item, index) => (
              <Card 
                key={index} 
                className="content-card transition-all hover:shadow-md"
              >
                <CardContent className="p-5">
                  {/* Titre et source */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.source}
                        </Badge>
                        {item.url && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            Lire <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Résumé */}
                  <p className="text-sm text-muted-foreground mb-4">
                    {item.summary}
                  </p>

                  {/* Angle suggéré */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                    <p className="text-sm">
                      <span className="font-medium text-primary">💭 Angle suggéré :</span>{" "}
                      <span className="text-foreground">{item.angle}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleCreatePost(item, index)}
                      disabled={item.generating}
                      className="btn-primary"
                    >
                      {item.generating ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <PenLine className="w-4 h-4 mr-2" />
                          Créer un post
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Info de persistance */}
            <div className="text-center py-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                ✓ Ces résultats restent affichés jusqu'à ce que vous cliquiez sur "Actualiser"
              </p>
            </div>
          </div>
        ) : (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="p-8 text-center">
              <Newspaper className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">
                Lancez votre première veille
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Entrez un thème pour découvrir les dernières actualités.
                <br />
                Vous pourrez ensuite <strong>créer un post</strong> directement à partir d'un article !
              </p>
              <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
                <Search className="w-4 h-4 mr-2" />
                Lancer la veille
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Conseil */}
      <div className="help-card">
        <p className="text-sm">
          💡 <strong>Conseil :</strong> Cliquez sur "Créer un post" pour générer automatiquement un post basé sur l'article. Vous pourrez ensuite le personnaliser avec votre propre vécu et votre point de vue.
        </p>
      </div>
    </div>
  );
}
