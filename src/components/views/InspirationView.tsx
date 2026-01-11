import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Lightbulb, 
  RefreshCw, 
  Bookmark, 
  BookmarkCheck,
  Users,
  Newspaper,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Hash
} from "lucide-react";
import { BrandProfile, DailyTheme, LinkedInAccount, InspirationData, SavedInspiration } from "@/types";

interface InspirationViewProps {
  brandProfile: BrandProfile;
  onNavigateToPost?: () => void;
}

export function InspirationView({ brandProfile, onNavigateToPost }: InspirationViewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inspirationData, setInspirationData] = useState<InspirationData | null>(null);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  const fetchInspiration = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('daily-inspiration', {
        body: { brandProfile }
      });

      if (error) throw error;

      setInspirationData(data);
      
      if (isRefresh) {
        toast({
          title: "Inspirations rafraîchies ! ✨",
          description: "Nouvelles idées prêtes à vous inspirer",
        });
      }
    } catch (error) {
      console.error('Error fetching inspiration:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les inspirations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleSaveItem = async (type: SavedInspiration['type'], title: string, description?: string) => {
    const itemKey = `${type}-${title}`;
    const isSaved = savedItems.has(itemKey);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isSaved) {
        // Remove from saved
        await supabase
          .from('saved_inspirations')
          .delete()
          .eq('user_id', user.id)
          .eq('type', type)
          .eq('title', title);
        
        setSavedItems(prev => {
          const next = new Set(prev);
          next.delete(itemKey);
          return next;
        });

        toast({
          title: "Retiré des favoris",
          description: title,
        });
      } else {
        // Add to saved
        await supabase
          .from('saved_inspirations')
          .insert({
            user_id: user.id,
            brand_profile_id: brandProfile.id,
            type,
            title,
            description,
            is_pinned: false
          });

        setSavedItems(prev => new Set([...prev, itemKey]));

        toast({
          title: "Ajouté aux favoris ! 📌",
          description: title,
        });
      }
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder",
        variant: "destructive",
      });
    }
  };

  const loadSavedItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('saved_inspirations')
        .select('type, title')
        .eq('user_id', user.id);

      if (data) {
        const saved = new Set(data.map(item => `${item.type}-${item.title}`));
        setSavedItems(saved);
      }
    } catch (error) {
      console.error('Error loading saved items:', error);
    }
  };

  useEffect(() => {
    fetchInspiration();
    loadSavedItems();
  }, [brandProfile.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-border/50">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Inspiration du Jour
          </h1>
          <p className="text-muted-foreground mt-1">
            Des idées fraîches pour alimenter votre créativité — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button 
          onClick={() => fetchInspiration(true)}
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Nouvelles idées
        </Button>
      </div>

      {/* Thèmes du Jour - Main Feature */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Thèmes du Jour</h2>
          <Badge variant="secondary" className="ml-2">Choisis-en un !</Badge>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {inspirationData?.themes?.map((theme, index) => (
            <ThemeCard 
              key={theme.id || index}
              theme={theme}
              index={index}
              isSaved={savedItems.has(`theme-${theme.title}`)}
              onSave={() => toggleSaveItem('theme', theme.title, theme.description)}
              onCreatePost={onNavigateToPost}
            />
          ))}
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comptes LinkedIn à Suivre */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Comptes à Suivre</h2>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              {inspirationData?.accounts?.map((account, index) => (
                <AccountCard 
                  key={index}
                  account={account}
                  isSaved={savedItems.has(`account-${account.name}`)}
                  onSave={() => toggleSaveItem('account', account.name, account.reason)}
                />
              ))}
              {(!inspirationData?.accounts || inspirationData.accounts.length === 0) && (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  Aucun compte suggéré pour le moment
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Actualités du Secteur */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Actualités du Secteur</h2>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              {inspirationData?.news?.map((item, index) => (
                <NewsCard 
                  key={index}
                  news={item}
                  isSaved={savedItems.has(`news-${item.title}`)}
                  onSave={() => toggleSaveItem('news', item.title, item.summary)}
                />
              ))}
              {(!inspirationData?.news || inspirationData.news.length === 0) && (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  Aucune actualité pour le moment
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Saved Items Summary */}
      {savedItems.size > 0 && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookmarkCheck className="w-5 h-5 text-primary" />
                <span className="font-medium">{savedItems.size} élément(s) sauvegardé(s)</span>
              </div>
              <Button variant="ghost" size="sm" className="text-primary">
                Voir mes favoris
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Sub-components
function ThemeCard({ 
  theme, 
  index, 
  isSaved, 
  onSave, 
  onCreatePost 
}: { 
  theme: DailyTheme; 
  index: number;
  isSaved: boolean;
  onSave: () => void;
  onCreatePost?: () => void;
}) {
  const colors = [
    'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    'from-purple-500/10 to-purple-600/5 border-purple-500/20',
    'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
  ];

  return (
    <Card className={`border bg-gradient-to-br ${colors[index % 3]} hover:shadow-lg transition-all duration-300 group`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg leading-tight">{theme.title}</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 flex-shrink-0"
            onClick={onSave}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 text-primary" />
            ) : (
              <Bookmark className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{theme.description}</p>
        
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">💡 Angle : {theme.angle}</p>
          <p className="text-xs text-muted-foreground">🎯 {theme.relevance}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {theme.hashtags?.map((tag, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              <Hash className="w-3 h-3 mr-0.5" />
              {tag}
            </Badge>
          ))}
        </div>

        <Button 
          className="w-full mt-2" 
          size="sm"
          onClick={onCreatePost}
        >
          Créer un post
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

function AccountCard({ 
  account, 
  isSaved, 
  onSave 
}: { 
  account: LinkedInAccount;
  isSaved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors group">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{account.name}</p>
          <Badge variant="outline" className="text-xs">{account.role}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{account.reason}</p>
        <div className="flex gap-1 mt-2">
          {account.topics?.slice(0, 3).map((topic, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 flex-shrink-0"
        onClick={onSave}
      >
        {isSaved ? (
          <BookmarkCheck className="w-4 h-4 text-primary" />
        ) : (
          <Bookmark className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </Button>
    </div>
  );
}

function NewsCard({ 
  news, 
  isSaved, 
  onSave 
}: { 
  news: { title: string; summary: string; source: string; angle: string };
  isSaved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="p-3 rounded-lg hover:bg-secondary/50 transition-colors group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-sm">{news.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{news.summary}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">{news.source}</Badge>
            <span className="text-xs text-primary">→ {news.angle}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 flex-shrink-0"
          onClick={onSave}
        >
          {isSaved ? (
            <BookmarkCheck className="w-4 h-4 text-primary" />
          ) : (
            <Bookmark className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </Button>
      </div>
    </div>
  );
}