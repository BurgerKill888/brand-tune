import { useState } from "react";
import { 
  Search, 
  ExternalLink, 
  TrendingUp,
  Bookmark,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Filter
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { WatchItem, BrandProfile } from "@/types";
import { cn } from "@/lib/utils";

interface WatchViewProps {
  brandProfile: BrandProfile;
  watchItems: WatchItem[];
  onAddWatchItem: (item: WatchItem) => void;
}

// Mock data for demonstration
const MOCK_WATCH_ITEMS: WatchItem[] = [
  {
    id: '1',
    brandProfileId: '1',
    title: "L'IA générative transforme le marketing B2B",
    summary: "Les entreprises adoptent massivement les outils d'IA pour automatiser la création de contenu tout en maintenant la qualité.",
    source: "Harvard Business Review",
    url: "https://hbr.org",
    angle: "Montrer comment votre solution intègre l'IA de manière éthique",
    relevance: 'high',
    objective: 'credibility',
    createdAt: new Date(),
  },
  {
    id: '2',
    brandProfileId: '1',
    title: "Tendances LinkedIn 2025 : l'authenticité prime",
    summary: "Les posts personnels et authentiques génèrent 3x plus d'engagement que le contenu corporate classique.",
    source: "Social Media Today",
    url: "https://socialmediatoday.com",
    angle: "Partager une histoire personnelle liée à votre parcours entrepreneurial",
    relevance: 'high',
    objective: 'engagement',
    createdAt: new Date(),
  },
  {
    id: '3',
    brandProfileId: '1',
    title: "Le format carrousel domine sur LinkedIn",
    summary: "Les carrousels obtiennent un reach 2x supérieur aux posts texte simples selon les dernières statistiques.",
    source: "LinkedIn News",
    url: "https://linkedin.com",
    angle: "Créer un carrousel éducatif sur votre expertise principale",
    relevance: 'medium',
    objective: 'reach',
    createdAt: new Date(),
  },
];

export function WatchView({ brandProfile, watchItems, onAddWatchItem }: WatchViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<WatchItem[]>(
    watchItems.length > 0 ? watchItems : MOCK_WATCH_ITEMS
  );

  const handleSearch = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
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
                placeholder="Rechercher des tendances, articles, sujets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12"
              />
            </div>
            <Button variant="secondary" size="lg">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
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
              Analyser
            </Button>
          </div>
        </CardContent>
      </Card>

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
                    <ExternalLink className="w-3 h-3" />
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
                  <Button variant="secondary" size="sm">
                    Créer un post
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
