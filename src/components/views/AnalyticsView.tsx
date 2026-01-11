import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Eye, 
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Linkedin,
  AlertCircle,
  Sparkles,
  Target,
  Zap,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandProfile } from "@/types";
import { cn } from "@/lib/utils";

interface AnalyticsViewProps {
  brandProfile: BrandProfile | null;
  postsCount: number;
}

// Données fictives mais cohérentes
const generateMockData = (postsCount: number) => {
  const baseImpressions = postsCount * 850;
  const baseFollowers = 1247 + postsCount * 12;
  
  return {
    overview: {
      followers: baseFollowers,
      followersGrowth: 12.4,
      impressions: baseImpressions,
      impressionsGrowth: 23.7,
      engagement: 4.8,
      engagementGrowth: 8.2,
      posts: postsCount,
      postsGrowth: postsCount > 5 ? 15 : 0,
    },
    weeklyImpressions: [
      { day: 'Lun', value: Math.round(baseImpressions * 0.12) },
      { day: 'Mar', value: Math.round(baseImpressions * 0.18) },
      { day: 'Mer', value: Math.round(baseImpressions * 0.22) },
      { day: 'Jeu', value: Math.round(baseImpressions * 0.15) },
      { day: 'Ven', value: Math.round(baseImpressions * 0.14) },
      { day: 'Sam', value: Math.round(baseImpressions * 0.09) },
      { day: 'Dim', value: Math.round(baseImpressions * 0.10) },
    ],
    topPosts: [
      { 
        id: 1, 
        title: "Mon retour d'expérience sur...", 
        impressions: Math.round(baseImpressions * 0.35),
        engagement: 6.2,
        likes: 89,
        comments: 23,
        shares: 12
      },
      { 
        id: 2, 
        title: "L'erreur que j'aurais aimé éviter...", 
        impressions: Math.round(baseImpressions * 0.28),
        engagement: 5.4,
        likes: 67,
        comments: 18,
        shares: 8
      },
      { 
        id: 3, 
        title: "3 conseils pour...", 
        impressions: Math.round(baseImpressions * 0.22),
        engagement: 4.1,
        likes: 45,
        comments: 12,
        shares: 5
      },
    ],
    contentTypes: [
      { type: 'Storytelling', percentage: 35, color: 'bg-violet-500' },
      { type: 'Conseils', percentage: 28, color: 'bg-blue-500' },
      { type: 'Opinion', percentage: 22, color: 'bg-amber-500' },
      { type: 'Actualité', percentage: 15, color: 'bg-teal-500' },
    ],
    bestTimes: [
      { time: '8h-9h', score: 85 },
      { time: '12h-13h', score: 72 },
      { time: '17h-18h', score: 68 },
      { time: '20h-21h', score: 55 },
    ],
    audienceDemo: [
      { label: 'Dirigeants / CEOs', percentage: 28 },
      { label: 'Managers', percentage: 24 },
      { label: 'Entrepreneurs', percentage: 22 },
      { label: 'Consultants', percentage: 15 },
      { label: 'Autres', percentage: 11 },
    ],
    monthlyGrowth: [
      { month: 'Sep', followers: baseFollowers - 180, impressions: baseImpressions * 0.6 },
      { month: 'Oct', followers: baseFollowers - 120, impressions: baseImpressions * 0.75 },
      { month: 'Nov', followers: baseFollowers - 50, impressions: baseImpressions * 0.88 },
      { month: 'Déc', followers: baseFollowers, impressions: baseImpressions },
    ],
  };
};

export function AnalyticsView({ brandProfile, postsCount }: AnalyticsViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const data = generateMockData(postsCount);

  if (!brandProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <BarChart3 className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Analyses non disponibles</h2>
        <p className="text-muted-foreground mb-4">Créez votre profil pour accéder aux statistiques</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Analyse LinkedIn
          </h1>
          <p className="text-muted-foreground mt-1">
            Performance de votre compte {brandProfile.companyName || brandProfile.firstName}
          </p>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Données simulées
        </Badge>
      </div>

      {/* Alerte compte non lié */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Linkedin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Connectez votre compte LinkedIn</p>
              <p className="text-sm text-muted-foreground">Pour voir vos vraies statistiques en temps réel</p>
            </div>
          </div>
          <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
            <Linkedin className="w-4 h-4 mr-2" />
            Connecter
          </Button>
        </CardContent>
      </Card>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Abonnés"
          value={data.overview.followers.toLocaleString()}
          growth={data.overview.followersGrowth}
          icon={Users}
          color="from-violet-400 to-purple-500"
        />
        <KPICard
          title="Impressions"
          value={data.overview.impressions.toLocaleString()}
          growth={data.overview.impressionsGrowth}
          icon={Eye}
          color="from-blue-400 to-cyan-500"
        />
        <KPICard
          title="Taux d'engagement"
          value={`${data.overview.engagement}%`}
          growth={data.overview.engagementGrowth}
          icon={Heart}
          color="from-rose-400 to-pink-500"
        />
        <KPICard
          title="Posts publiés"
          value={data.overview.posts.toString()}
          growth={data.overview.postsGrowth}
          icon={BarChart3}
          color="from-amber-400 to-orange-500"
        />
      </div>

      {/* Tabs de contenu */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="content">Performance contenu</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique impressions */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  Impressions cette semaine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-48">
                  {data.weeklyImpressions.map((item, i) => {
                    const maxValue = Math.max(...data.weeklyImpressions.map(d => d.value));
                    const height = (item.value / maxValue) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-cyan-500"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-xs text-muted-foreground">{item.day}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Meilleur jour</span>
                  <Badge className="bg-blue-100 text-blue-700">Mercredi (+22%)</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Évolution mensuelle */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Croissance (4 derniers mois)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.monthlyGrowth.map((month, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="w-10 text-sm text-muted-foreground">{month.month}</span>
                      <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                          style={{ width: `${(month.followers / data.overview.followers) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">{month.followers}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Croissance totale</span>
                  <Badge className="bg-green-100 text-green-700">+180 abonnés</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance contenu */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top posts */}
            <div className="lg:col-span-2">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Vos meilleurs posts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.topPosts.map((post, i) => (
                    <div 
                      key={post.id}
                      className={cn(
                        "p-4 rounded-xl border transition-colors",
                        i === 0 ? "border-amber-200 bg-amber-50/50" : "border-border/50 hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {i === 0 && <span className="text-xl">🏆</span>}
                          {i === 1 && <span className="text-xl">🥈</span>}
                          {i === 2 && <span className="text-xl">🥉</span>}
                          <p className="font-medium text-foreground">{post.title}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {post.engagement}% engagement
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.impressions.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-rose-500" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 text-blue-500" />
                          {post.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-4 h-4 text-green-500" />
                          {post.shares}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Types de contenu */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-violet-500" />
                  Types de contenu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.contentTypes.map((type, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{type.type}</span>
                      <span className="font-medium">{type.percentage}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full", type.color)}
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    💡 Le <strong>storytelling</strong> génère le plus d'engagement sur votre profil
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Meilleurs créneaux */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-500" />
                Meilleurs créneaux de publication
              </CardTitle>
              <CardDescription>
                Basé sur l'engagement de votre audience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.bestTimes.map((slot, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "p-4 rounded-xl border text-center transition-all",
                      i === 0 
                        ? "border-teal-200 bg-teal-50 shadow-md" 
                        : "border-border/50 hover:border-teal-200"
                    )}
                  >
                    <p className="text-lg font-semibold text-foreground mb-1">{slot.time}</p>
                    <div className="flex items-center justify-center gap-1">
                      <Zap className={cn(
                        "w-4 h-4",
                        slot.score >= 80 ? "text-teal-500" : slot.score >= 60 ? "text-amber-500" : "text-gray-400"
                      )} />
                      <span className="text-sm text-muted-foreground">Score: {slot.score}</span>
                    </div>
                    {i === 0 && (
                      <Badge className="mt-2 bg-teal-100 text-teal-700 text-xs">
                        Recommandé
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Démographie */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-500" />
                  Qui vous suit ?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.audienceDemo.map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-foreground">{item.label}</div>
                    <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-sm font-medium text-right">{item.percentage}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Localisation (fictive) */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🇫🇷</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">France</span>
                      <span className="text-sm font-medium">68%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🇧🇪</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Belgique</span>
                      <span className="text-sm font-medium">12%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '12%' }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🇨🇭</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Suisse</span>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '10%' }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🌍</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Autres</span>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gray-400 rounded-full" style={{ width: '10%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InsightCard
              emoji="🎯"
              title="Votre créneau idéal"
              description="Publiez le mardi ou mercredi entre 8h et 9h pour maximiser votre visibilité."
              color="from-teal-400 to-cyan-500"
            />
            <InsightCard
              emoji="📖"
              title="Le storytelling marche"
              description="Vos posts narratifs génèrent 2.3x plus d'engagement que la moyenne."
              color="from-violet-400 to-purple-500"
            />
            <InsightCard
              emoji="💬"
              title="Répondez aux commentaires"
              description="Les posts où vous répondez dans l'heure ont 40% plus de portée."
              color="from-amber-400 to-orange-500"
            />
            <InsightCard
              emoji="📏"
              title="Longueur optimale"
              description="Vos posts entre 800-1200 caractères performent le mieux."
              color="from-rose-400 to-pink-500"
            />
            <InsightCard
              emoji="❓"
              title="Posez des questions"
              description="Les posts terminés par une question ont 3x plus de commentaires."
              color="from-blue-400 to-indigo-500"
            />
            <InsightCard
              emoji="🔄"
              title="Régularité payante"
              description="Maintenir 2-3 posts/semaine boost votre visibilité de 45%."
              color="from-green-400 to-emerald-500"
            />
          </div>

          {/* Call to action */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Prêt à améliorer vos stats ?
              </h3>
              <p className="text-muted-foreground mb-4">
                Créez du contenu authentique basé sur votre vécu pour augmenter votre engagement.
              </p>
              <Button className="btn-primary">
                <Zap className="w-4 h-4 mr-2" />
                Créer un nouveau post
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Composants internes

function KPICard({ 
  title, 
  value, 
  growth, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string; 
  growth: number; 
  icon: any;
  color: string;
}) {
  const isPositive = growth >= 0;
  
  return (
    <Card className="border-border/50 hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
            color
          )}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {Math.abs(growth)}%
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}

function InsightCard({ 
  emoji, 
  title, 
  description, 
  color 
}: { 
  emoji: string; 
  title: string; 
  description: string;
  color: string;
}) {
  return (
    <Card className="border-border/50 hover:shadow-lg transition-all overflow-hidden">
      <div className={cn("h-1 bg-gradient-to-r", color)} />
      <CardContent className="p-5">
        <div className="text-3xl mb-3">{emoji}</div>
        <h3 className="font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

