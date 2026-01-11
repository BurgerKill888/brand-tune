import { useState, useEffect } from "react";
import { 
  FileText, 
  Calendar,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Newspaper,
  Sun,
  Moon,
  CloudSun,
  Hash,
  Zap,
  TrendingUp,
  ChevronRight,
  PenLine,
  Flame,
  Target,
  Coffee,
  Rocket,
  Heart,
  Star,
  PartyPopper,
  Search,
  Clock,
  ExternalLink,
  ThumbsUp,
  MessageCircle,
  RefreshCw,
  Eye,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandProfile, WatchItem, CalendarItem, Post } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface DashboardViewProps {
  brandProfile: BrandProfile | null;
  watchItems: WatchItem[];
  calendarItems: CalendarItem[];
  posts: Post[];
  onStartOnboarding: () => void;
  onNavigate: (view: 'watch' | 'calendar' | 'posts' | 'ideas' | 'my-posts' | 'free-post') => void;
}

interface DailyTheme {
  id: string;
  title: string;
  description: string;
  angle: string;
  hashtags: string[];
  emoji: string;
}

interface SectorNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  time: string;
  url?: string;
}

interface CompetitorPost {
  id: string;
  name: string;
  avatar: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
}

interface CapturedIdea {
  id: string;
  title: string;
  hook: string;
  source?: string;
  createdAt: Date;
}

const CACHE_KEY = 'daily_dashboard_cache_v4';
const NEWS_CACHE_KEY = 'sector_news_cache';

const getTodayKey = () => new Date().toISOString().split('T')[0];

// Types d'angles pour créer un post
const POST_ANGLES = [
  { id: 'analyse', label: 'Analyse', emoji: '🔍', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { id: 'reaction', label: 'Réaction à chaud', emoji: '⚡', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
  { id: 'prediction', label: 'Prédiction', emoji: '🔮', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  { id: 'contre-courant', label: 'Contre-courant', emoji: '🎯', color: 'bg-rose-100 text-rose-700 hover:bg-rose-200' },
];

// Messages d'encouragement
const getEncouragementMessage = (postsCount: number, firstName: string): { emoji: string; message: string } => {
  if (postsCount === 0) {
    return { emoji: "🌱", message: `${firstName}, c'est le moment de planter votre première graine !` };
  } else if (postsCount < 5) {
    return { emoji: "🚀", message: `Super début ${firstName} ! Continuez sur cette lancée.` };
  } else if (postsCount < 10) {
    return { emoji: "🔥", message: `${firstName}, vous êtes en feu ! ${postsCount} posts déjà !` };
  } else if (postsCount < 25) {
    return { emoji: "⭐", message: `Impressionnant ${firstName} ! Vous devenez une référence.` };
  } else {
    return { emoji: "🏆", message: `${firstName}, vous êtes une vraie machine à contenu !` };
  }
};

// Get greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return { text: "Bonne nuit", emoji: "🌙", icon: Moon };
  if (hour < 12) return { text: "Bonjour", emoji: "☀️", icon: Sun };
  if (hour < 14) return { text: "Bon appétit", emoji: "☕", icon: Coffee };
  if (hour < 18) return { text: "Bon après-midi", emoji: "🌤️", icon: CloudSun };
  return { text: "Bonsoir", emoji: "🌅", icon: Sun };
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
  const [sectorNews, setSectorNews] = useState<SectorNews[]>([]);
  const [competitorPosts, setCompetitorPosts] = useState<CompetitorPost[]>([]);
  const [capturedIdeas, setCapturedIdeas] = useState<CapturedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [lastNewsUpdate, setLastNewsUpdate] = useState<Date | null>(null);
  const [reflectionText, setReflectionText] = useState("");

  useEffect(() => {
    if (brandProfile) {
      loadInspiration();
      loadCapturedIdeas();
      loadSectorNews();
      loadCompetitorPosts();
    } else {
      setLoading(false);
      setNewsLoading(false);
    }
  }, [brandProfile?.id]);

  const loadInspiration = async () => {
    if (!brandProfile) return;

    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const cache = JSON.parse(cachedData);
        if (cache.date === getTodayKey() && cache.profileId === brandProfile.id) {
          setDailyTheme(cache.theme);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error('Cache error:', e);
    }

    // Générer un thème personnalisé
    const theme = generatePersonalizedTheme(brandProfile);
    setDailyTheme(theme);
    
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      date: getTodayKey(),
      profileId: brandProfile.id,
      theme,
    }));
    
    setLoading(false);
  };

  const loadSectorNews = async () => {
    if (!brandProfile) return;

    // Vérifier le cache
    try {
      const cached = localStorage.getItem(NEWS_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        // Cache valide pendant 30 minutes
        if (Date.now() - new Date(data.timestamp).getTime() < 30 * 60 * 1000) {
          setSectorNews(data.news);
          setLastNewsUpdate(new Date(data.timestamp));
          setNewsLoading(false);
          return;
        }
      }
    } catch (e) {}

    await fetchSectorNews();
  };

  const fetchSectorNews = async () => {
    if (!brandProfile) return;
    
    setNewsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('perplexity-watch', {
        body: {
          query: `actualités ${brandProfile.sector} 2026`,
          brandProfile: {
            companyName: brandProfile.companyName,
            sector: brandProfile.sector,
            targets: brandProfile.targets,
            businessObjectives: brandProfile.businessObjectives,
          }
        }
      });

      if (error) throw error;

      const news: SectorNews[] = (data.items || []).slice(0, 3).map((item: any, i: number) => ({
        id: `news-${i}`,
        title: item.title,
        summary: item.summary,
        source: item.source || 'Web',
        time: i === 0 ? 'Il y a 2h' : i === 1 ? 'Il y a 5h' : 'Hier',
        url: item.url,
      }));

      setSectorNews(news);
      setLastNewsUpdate(new Date());

      localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({
        news,
        timestamp: new Date().toISOString(),
      }));

    } catch (error) {
      console.error('Error fetching sector news:', error);
      // Fallback news
      setSectorNews([
        {
          id: 'fallback-1',
          title: `Les tendances ${brandProfile.sector} qui transforment le marché`,
          summary: `Une étude récente révèle les nouvelles pratiques qui redéfinissent le secteur ${brandProfile.sector}.`,
          source: 'Veille Auto',
          time: 'Il y a 2h',
        },
        {
          id: 'fallback-2',
          title: `Innovation dans ${brandProfile.sector} : ce qui change en 2026`,
          summary: `Les entreprises du secteur adoptent de nouvelles approches pour répondre aux attentes du marché.`,
          source: 'Veille Auto',
          time: 'Il y a 5h',
        },
      ]);
      setLastNewsUpdate(new Date());
    } finally {
      setNewsLoading(false);
    }
  };

  const loadCompetitorPosts = () => {
    // Simuler des posts de concurrents (en production, ce serait des données réelles)
    if (!brandProfile) return;
    
    setCompetitorPosts([
      {
        id: 'comp-1',
        name: 'Concurrent A',
        avatar: '🔵',
        time: 'Il y a 3h',
        content: `🚀 Nous lançons notre nouvelle offre de formation ${brandProfile.sector} pour les entreprises ! 50 places disponibles...`,
        likes: 234,
        comments: 45,
      },
      {
        id: 'comp-2',
        name: 'Concurrent B',
        avatar: '🟢',
        time: 'Hier',
        content: `L'IA ne remplacera pas les créatifs. Elle les augmentera. Voici pourquoi nous investissons dans l'humain...`,
        likes: 567,
        comments: 89,
      },
    ]);
  };

  const loadCapturedIdeas = () => {
    try {
      const saved = localStorage.getItem('captured_ideas');
      if (saved) {
        setCapturedIdeas(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading ideas:', e);
    }
  };

  const generatePersonalizedTheme = (profile: BrandProfile): DailyTheme => {
    const themes = [
      {
        id: 'expertise',
        emoji: '🎯',
        title: `L'erreur que tous mes clients font en ${profile.sector}`,
        description: `Partagez une erreur courante et comment l'éviter. Votre expertise peut aider votre audience.`,
        angle: 'Expertise terrain',
        hashtags: [profile.sector?.toLowerCase().replace(/\s/g, ''), 'conseil', 'expertise'],
      },
      {
        id: 'behind-scenes',
        emoji: '🎬',
        title: 'Les coulisses de mon quotidien',
        description: `Montrez ce qui se passe vraiment dans votre métier. L'authenticité crée la connexion.`,
        angle: 'Behind the scenes',
        hashtags: ['coulisses', 'quotidien', 'authentique'],
      },
      {
        id: 'learning',
        emoji: '📚',
        title: 'Ce que j\'aurais aimé savoir avant de commencer',
        description: `Vos apprentissages peuvent faire gagner du temps à d'autres. Partagez-les !`,
        angle: 'Retour d\'expérience',
        hashtags: ['apprentissage', 'conseil', 'experience'],
      },
    ];

    const dayIndex = new Date().getDay();
    return themes[dayIndex % themes.length];
  };

  const handleStartReflection = () => {
    if (reflectionText.trim()) {
      setPrefillPostData({
        topic: reflectionText,
        category: undefined,
      });
      onNavigate('free-post');
    } else {
      onNavigate('posts');
    }
  };

  const handleCreateFromNews = (news: SectorNews, angle: typeof POST_ANGLES[0]) => {
    const prompts: Record<string, string> = {
      'analyse': `📊 ANALYSE : ${news.title}\n\nL'article mentionne : "${news.summary}"\n\nMon analyse :\n→ [Votre point de vue d'expert]\n→ [Les implications pour votre secteur]\n→ [Ce que ça signifie concrètement]\n\nQu'en pensez-vous ? Voyez-vous les mêmes tendances ?`,
      'reaction': `⚡ RÉACTION À CHAUD\n\nJe viens de lire : "${news.title}"\n\nEt franchement... [votre réaction spontanée]\n\nCe qui m'interpelle :\n→ [Point 1]\n→ [Point 2]\n\nVotre avis ?`,
      'prediction': `🔮 MA PRÉDICTION\n\nSuite à l'actualité sur "${news.title}", voici ce que je pense qu'il va se passer :\n\n1. [Prédiction court terme]\n2. [Prédiction moyen terme]\n3. [Impact sur notre secteur]\n\nPari risqué ? Peut-être. Mais je suis convaincu(e) que...\n\nVous voyez les choses différemment ?`,
      'contre-courant': `🎯 OPINION IMPOPULAIRE\n\nTout le monde parle de "${news.title}" comme si c'était révolutionnaire.\n\nMais personne ne dit que...\n→ [Votre point de vue différent]\n→ [Pourquoi vous n'êtes pas d'accord]\n→ [Ce qu'on oublie de mentionner]\n\nJe sais que ça va faire réagir, mais quelqu'un devait le dire.\n\nD'accord ? Pas d'accord ?`,
    };

    setPrefillPostData({
      topic: prompts[angle.id] || prompts['analyse'],
      category: angle.id,
    });
    onNavigate('free-post');
  };

  const handleReactToCompetitor = (post: CompetitorPost) => {
    setPrefillPostData({
      topic: `💭 En réponse à un post que j'ai vu passer...\n\n"${post.content.slice(0, 100)}..."\n\nJe suis d'accord sur un point : [point d'accord]\n\nMais j'aimerais ajouter : [votre perspective unique]\n\nDans mon expérience, [anecdote ou exemple concret].\n\nQu'en pensez-vous ?`,
      category: undefined,
    });
    onNavigate('free-post');
  };

  const handleCreateFromTheme = () => {
    if (dailyTheme) {
      setPrefillPostData({
        topic: `${dailyTheme.emoji} ${dailyTheme.title}\n\n${dailyTheme.description}\n\n[Développez votre point de vue ici]\n\n#${dailyTheme.hashtags.join(' #')}`,
        category: 'tendance',
      });
    }
    onNavigate('free-post');
  };

  if (!brandProfile) {
    return <WelcomeState onStartOnboarding={onStartOnboarding} />;
  }

  const greeting = getGreeting();
  const firstName = brandProfile.firstName || brandProfile.companyName?.split(' ')[0] || "vous";
  const encouragement = getEncouragementMessage(posts.length, firstName);
  const scheduledCount = calendarItems.filter(c => c.status === 'scheduled').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header personnalisé */}
      <div className="text-center pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-sm mb-4">
          <span className="text-lg">{greeting.emoji}</span>
          <span className="font-medium">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          {greeting.text}, {firstName} ! {greeting.emoji}
        </h1>
        
        <p className="text-lg text-muted-foreground">
          {encouragement.emoji} {encouragement.message}
        </p>
      </div>

      {/* Badges de progression */}
      <div className="flex flex-wrap justify-center gap-3">
        {posts.length >= 1 && (
          <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-1.5 text-sm gap-2">
            <Rocket className="w-4 h-4" />
            Premier post !
          </Badge>
        )}
        {posts.length >= 5 && (
          <Badge className="bg-gradient-to-r from-purple-400 to-pink-500 text-white px-4 py-1.5 text-sm gap-2">
            <Star className="w-4 h-4" />
            5 posts
          </Badge>
        )}
        {capturedIdeas.length >= 3 && (
          <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-4 py-1.5 text-sm gap-2">
            <Lightbulb className="w-4 h-4" />
            Chasseur d'idées
          </Badge>
        )}
      </div>

      {/* Zone de réflexion */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-white to-accent/5 shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
            <PenLine className="w-4 h-4" />
            Votre espace de réflexion
          </div>
          
          <p className="text-lg text-foreground mb-4">
            {firstName}, qu'est-ce qui vous a marqué cette semaine ? 🤔
          </p>
          
          <Textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="Une conversation, une réalisation, un défi, une observation..."
            className="zen-textarea text-base mb-4 bg-white/80"
          />

          <Button onClick={handleStartReflection} className="btn-primary">
            <ArrowRight className="w-4 h-4 mr-2" />
            {reflectionText.trim() ? "Transformer en post" : "Réflexion guidée"}
          </Button>
        </CardContent>
      </Card>

      {/* Layout 2 colonnes : Actus + Concurrents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actualités du secteur - 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                    <Newspaper className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg">Actualités de votre secteur</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {lastNewsUpdate && (
                    <span className="text-xs text-muted-foreground">
                      Dernière mise à jour : {formatDistanceToNow(lastNewsUpdate, { addSuffix: false, locale: fr })}
                    </span>
                  )}
                  <Button variant="ghost" size="sm" onClick={fetchSectorNews} disabled={newsLoading}>
                    <RefreshCw className={cn("w-4 h-4", newsLoading && "animate-spin")} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {newsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 rounded-lg border border-border/50">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-3" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                sectorNews.map((news) => (
                  <div key={news.id} className="p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors bg-white">
                    {/* Titre */}
                    <h3 className="font-semibold text-foreground mb-2">{news.title}</h3>
                    
                    {/* Source et temps */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                        {news.source}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{news.time}</span>
                      {news.url && (
                        <a href={news.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    
                    {/* Résumé */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {news.summary}
                    </p>
                    
                    {/* Boutons d'angles */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground mr-1">Créer un post :</span>
                      {POST_ANGLES.map((angle) => (
                        <Button
                          key={angle.id}
                          variant="ghost"
                          size="sm"
                          className={cn("h-8 text-xs font-medium", angle.color)}
                          onClick={() => handleCreateFromNews(news, angle)}
                        >
                          <span className="mr-1">{angle.emoji}</span>
                          {angle.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))
              )}

              <Button variant="ghost" className="w-full" onClick={() => onNavigate('watch')}>
                Voir toutes les actualités
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Posts des concurrents - 1/3 */}
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-lg">Posts des concurrents</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {competitorPosts.map((post) => (
                <div key={post.id} className="p-4 rounded-xl border border-border/50 hover:border-purple-200 transition-colors bg-white">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xl">
                      {post.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{post.name}</p>
                      <p className="text-xs text-muted-foreground">{post.time}</p>
                    </div>
                  </div>
                  
                  {/* Contenu */}
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                    {post.content}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {post.comments}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => handleReactToCompetitor(post)}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Réagir
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Thème du jour */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Thème du jour</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : dailyTheme ? (
                <>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">{dailyTheme.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">
                        {dailyTheme.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {dailyTheme.description}
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleCreateFromTheme} size="sm" className="w-full btn-primary">
                    <Zap className="w-4 h-4 mr-2" />
                    Créer ce post
                  </Button>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          emoji="📝"
          value={posts.length} 
          label="Posts créés"
          color="from-blue-400 to-indigo-500"
          onClick={() => onNavigate('my-posts')}
        />
        <StatCard 
          emoji="📅"
          value={scheduledCount} 
          label="Planifiés"
          color="from-green-400 to-teal-500"
          onClick={() => onNavigate('calendar')}
        />
        <StatCard 
          emoji="💡"
          value={capturedIdeas.length} 
          label="Idées capturées"
          color="from-amber-400 to-orange-500"
          onClick={() => onNavigate('ideas')}
        />
        <StatCard 
          emoji="📰"
          value={watchItems.length} 
          label="Sources veille"
          color="from-purple-400 to-pink-500"
          onClick={() => onNavigate('watch')}
        />
      </div>

      {/* Conseil du jour */}
      <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-none">
        <CardContent className="p-5 text-center">
          <p className="text-foreground">
            <span className="text-2xl mr-2">💡</span>
            <span className="font-medium">Astuce :</span> Réagissez à une actualité de votre secteur pour montrer votre expertise. 
            Les posts d'analyse et d'opinion génèrent 3x plus d'engagement !
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Composants internes

function StatCard({ 
  emoji,
  value, 
  label, 
  color,
  onClick 
}: { 
  emoji: string;
  value: number; 
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <Card 
      className="content-card cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
      onClick={onClick}
    >
      <CardContent className="p-4 text-center">
        <div className={cn(
          "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mx-auto mb-2 text-2xl",
          color
        )}>
          {emoji}
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function WelcomeState({ onStartOnboarding }: { onStartOnboarding: () => void }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
      <div className="text-center max-w-lg mx-auto px-6">
        <div className="text-6xl mb-6">🚀</div>
        
        <h1 className="text-3xl font-display font-bold text-foreground mb-4">
          Bienvenue sur True Content !
        </h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Transformez vos expériences en contenu LinkedIn authentique.
        </p>
        
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Badge className="bg-primary/10 text-primary px-4 py-2">
            <Heart className="w-4 h-4 mr-2" />
            Authentique
          </Badge>
          <Badge className="bg-accent/10 text-accent-foreground px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Personnalisé
          </Badge>
          <Badge className="bg-green-100 text-green-700 px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            Efficace
          </Badge>
        </div>
        
        <Button 
          size="lg" 
          onClick={onStartOnboarding}
          className="btn-primary text-lg px-8 py-6"
        >
          <PartyPopper className="w-5 h-5 mr-2" />
          C'est parti !
        </Button>
      </div>
    </div>
  );
}
