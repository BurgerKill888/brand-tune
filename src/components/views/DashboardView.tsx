import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  FileText, 
  Calendar,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Lightbulb,
  Newspaper,
  Sun,
  Hash,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandProfile, WatchItem, CalendarItem, Post } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";

interface DashboardViewProps {
  brandProfile: BrandProfile | null;
  watchItems: WatchItem[];
  calendarItems: CalendarItem[];
  posts: Post[];
  onStartOnboarding: () => void;
  onNavigate: (view: 'watch' | 'calendar' | 'posts' | 'ideas') => void;
}

interface DailyTheme {
  id: string;
  title: string;
  description: string;
  angle: string;
  hashtags: string[];
  relevance: string;
}

interface QuickIdea {
  title: string;
  category: string;
  hook: string;
}

interface CachedInspiration {
  date: string; // YYYY-MM-DD
  theme: DailyTheme | null;
  ideas: QuickIdea[];
  news: {title: string; source: string; angle: string}[];
}

const CACHE_KEY = 'daily_inspiration_cache';

// Get today's date as YYYY-MM-DD
const getTodayKey = () => new Date().toISOString().split('T')[0];

// Check if cache is still valid (same day)
const isCacheValid = (cache: CachedInspiration | null): boolean => {
  if (!cache) return false;
  return cache.date === getTodayKey();
};

export function DashboardView({ 
  brandProfile, 
  watchItems, 
  calendarItems, 
  posts,
  onStartOnboarding,
  onNavigate
}: DashboardViewProps) {
  const { setPrefillPostData } = useAppStore();
  const [dailyTheme, setDailyTheme] = useState<DailyTheme | null>(null);
  const [quickIdeas, setQuickIdeas] = useState<QuickIdea[]>([]);
  const [sectorNews, setSectorNews] = useState<{title: string; source: string; angle: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // Handle creating a post from the daily theme
  const handleCreatePostFromTheme = () => {
    if (dailyTheme) {
      setPrefillPostData({
        topic: `${dailyTheme.title}\n\n${dailyTheme.description}\n\nAngle suggéré: ${dailyTheme.angle}`,
        category: 'tendance',
      });
    }
    onNavigate('posts');
  };

  // Handle creating a post from a quick idea
  const handleCreatePostFromIdea = (idea: QuickIdea) => {
    setPrefillPostData({
      topic: `${idea.title}\n\n${idea.hook}`,
      category: idea.category,
    });
    onNavigate('posts');
  };

  // Load from cache or fetch new data
  useEffect(() => {
    if (brandProfile) {
      loadInspiration();
    }
  }, [brandProfile?.id]);

  const loadInspiration = async () => {
    if (!brandProfile) return;

    // Try to load from localStorage cache
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const cache: CachedInspiration = JSON.parse(cachedData);
        if (isCacheValid(cache)) {
          // Use cached data
          setDailyTheme(cache.theme);
          setQuickIdeas(cache.ideas);
          setSectorNews(cache.news);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error('Error reading cache:', e);
    }

    // Fetch new data
    await fetchDailyInspiration();
  };

  const fetchDailyInspiration = async () => {
    if (!brandProfile) return;

    try {
      const { data, error } = await supabase.functions.invoke('daily-inspiration', {
        body: { brandProfile }
      });

      if (error) throw error;

      // Set the main daily theme
      const theme = data.themes?.[0] || null;
      setDailyTheme(theme);

      // Generate quick ideas from themes
      const ideas: QuickIdea[] = (data.themes || []).slice(0, 3).map((t: DailyTheme) => ({
        title: t.title,
        category: t.angle,
        hook: t.description.slice(0, 80) + '...'
      }));
      setQuickIdeas(ideas);

      // Set sector news
      const news = data.news || [];
      setSectorNews(news);

      // Cache the data with today's date
      const cacheData: CachedInspiration = {
        date: getTodayKey(),
        theme,
        ideas,
        news
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

    } catch (error) {
      console.error('Error fetching daily inspiration:', error);
      // Use fallback data
      const fallbackTheme: DailyTheme = {
        id: "default",
        title: "Partagez votre expertise du jour",
        description: `Qu'avez-vous appris récemment dans le domaine ${brandProfile.sector} ? Partagez cette connaissance avec votre audience.`,
        angle: "Partage d'expertise",
        hashtags: [brandProfile.sector.toLowerCase(), "expertise", "linkedin"],
        relevance: "Votre audience cherche des insights exclusifs"
      };
      
      const fallbackIdeas: QuickIdea[] = [
        { title: "Une leçon apprise cette semaine", category: "Storytelling", hook: "Racontez un défi récent et ce que vous en avez tiré..." },
        { title: "Une tendance de votre secteur", category: "Analyse", hook: "Partagez votre point de vue sur une évolution..." },
        { title: "Un conseil pratique", category: "Éducatif", hook: "Donnez une astuce actionnable à votre audience..." }
      ];

      setDailyTheme(fallbackTheme);
      setQuickIdeas(fallbackIdeas);

      // Cache fallback data too
      const cacheData: CachedInspiration = {
        date: getTodayKey(),
        theme: fallbackTheme,
        ideas: fallbackIdeas,
        news: []
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } finally {
      setLoading(false);
    }
  };

  if (!brandProfile) {
    return <WelcomeState onStartOnboarding={onStartOnboarding} />;
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const stats = [
    { 
      label: "Posts créés", 
      value: posts.length, 
      icon: FileText, 
      color: "text-violet-600",
      bgColor: "bg-violet-100"
    },
    { 
      label: "Planifiés", 
      value: calendarItems.filter(c => c.status === 'scheduled').length, 
      icon: Calendar, 
      color: "text-teal-600",
      bgColor: "bg-teal-100"
    },
    { 
      label: "Sources veille", 
      value: watchItems.length, 
      icon: TrendingUp, 
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            {getGreeting()}, {brandProfile.companyName.split(' ')[0]}
            <Sun className="w-6 h-6 text-amber-500" />
          </h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Badge variant="success" className="px-3 py-1">
          <Sparkles className="w-3 h-3 mr-1" />
          Profil actif
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bgColor)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT: Theme of the Day (3/5) */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* 🌟 THEME DU JOUR */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-teal-500/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Thème du Jour</CardTitle>
                  <CardDescription className="text-xs">Valable jusqu'à demain matin</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : dailyTheme ? (
                <>
                  <h3 className="text-lg font-semibold text-foreground">
                    {dailyTheme.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {dailyTheme.description}
                  </p>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/80 border border-border">
                    <Target className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground flex-1">{dailyTheme.angle}</span>
                    <div className="flex gap-1">
                      {dailyTheme.hashtags.slice(0, 2).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <Hash className="w-2.5 h-2.5 mr-0.5" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button 
                    variant="premium" 
                    className="w-full"
                    onClick={handleCreatePostFromTheme}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Créer ce post
                  </Button>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* 💡 Quick Ideas */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Idées de contenu
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('ideas')}>
                  Voir tout
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {quickIdeas.map((idea, i) => (
                    <button
                      key={i}
                      onClick={() => handleCreatePostFromIdea(idea)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left group"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        i === 0 && "bg-blue-100 text-blue-600",
                        i === 1 && "bg-purple-100 text-purple-600",
                        i === 2 && "bg-emerald-100 text-emerald-600"
                      )}>
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {idea.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {idea.hook}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (2/5) */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* 📰 Sector News */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-primary" />
                Actus {brandProfile.sector}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : sectorNews.length > 0 ? (
                <div className="space-y-2">
                  {sectorNews.slice(0, 3).map((news, i) => (
                    <div 
                      key={i}
                      className="p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => onNavigate('watch')}
                    >
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {news.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-xs py-0">{news.source}</Badge>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-1"
                    onClick={() => onNavigate('watch')}
                  >
                    Voir la veille
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Newspaper className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Lancez une veille</p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => onNavigate('watch')}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Lancer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickActionButton 
                title="Créer un post"
                icon={FileText}
                onClick={() => onNavigate('posts')}
                variant="primary"
              />
              <QuickActionButton 
                title="Voir le calendrier"
                icon={Calendar}
                onClick={() => onNavigate('calendar')}
              />
              <QuickActionButton 
                title="Générer des idées"
                icon={Sparkles}
                onClick={() => onNavigate('ideas')}
              />
            </CardContent>
          </Card>

          {/* Brand Mini Card */}
          <Card className="border-border/50 bg-gradient-to-br from-secondary/50 to-background">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{brandProfile.companyName}</p>
                  <p className="text-xs text-muted-foreground">{brandProfile.sector}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function WelcomeState({ onStartOnboarding }: { onStartOnboarding: () => void }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
      <div className="text-center max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-glow">
          <Sparkles className="w-8 h-8 text-primary-foreground" />
        </div>
        
        <h1 className="text-3xl font-display font-bold text-foreground mb-3">
          Bienvenue sur Brand Tune
        </h1>
        <p className="text-muted-foreground mb-6">
          Créez une stratégie LinkedIn percutante en quelques étapes.
        </p>
        
        <Button 
          size="lg" 
          variant="premium"
          onClick={onStartOnboarding}
          className="gap-2"
        >
          Commencer
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function QuickActionButton({ 
  title, 
  icon: Icon, 
  onClick,
  variant = 'default'
}: { 
  title: string; 
  icon: any; 
  onClick: () => void;
  variant?: 'default' | 'primary';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group text-left",
        variant === 'primary' 
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-border bg-background hover:bg-secondary hover:border-primary/30"
      )}
    >
      <Icon className={cn(
        "w-4 h-4",
        variant === 'primary' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
      )} />
      <span className={cn(
        "font-medium text-sm",
        variant === 'primary' ? "text-primary-foreground" : "text-foreground"
      )}>{title}</span>
      <ArrowRight className={cn(
        "w-4 h-4 ml-auto transition-transform group-hover:translate-x-1",
        variant === 'primary' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
      )} />
    </button>
  );
}
