import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Eye, 
  MessageCircle, 
  ThumbsUp, 
  Share2, 
  Target,
  Calendar,
  FileText,
  Award,
  Zap,
  Linkedin,
  RefreshCw
} from "lucide-react";
import { Post, CalendarItem } from "@/types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Area,
  AreaChart,
  Tooltip
} from "recharts";
import { useLinkedIn } from "@/hooks/useLinkedIn";
import { useLinkedInStats } from "@/hooks/useLinkedInStats";

interface MetricsViewProps {
  posts: Post[];
  calendarItems: CalendarItem[];
}

export function MetricsView({ posts, calendarItems }: MetricsViewProps) {
  const linkedin = useLinkedIn();
  const linkedInStats = useLinkedInStats();
  const [hasLoadedLinkedIn, setHasLoadedLinkedIn] = useState(false);

  // Load LinkedIn stats when connected
  useEffect(() => {
    if (linkedin.isConnected && linkedin.accessToken && linkedin.profile && !hasLoadedLinkedIn) {
      linkedInStats.fetchLinkedInPosts(linkedin.accessToken, linkedin.profile.id);
      setHasLoadedLinkedIn(true);
    }
  }, [linkedin.isConnected, linkedin.accessToken, linkedin.profile, hasLoadedLinkedIn]);

  // Calculate metrics
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published').length;
  const draftPosts = posts.filter(p => p.status === 'draft').length;
  const readyPosts = posts.filter(p => p.status === 'ready').length;
  
  const scheduledItems = calendarItems.filter(c => c.status === 'scheduled').length;
  
  // Average readability score
  const avgReadability = posts.length > 0 
    ? Math.round(posts.reduce((acc, p) => acc + (p.readabilityScore || 0), 0) / posts.length)
    : 0;

  // Posts by type (from calendar items)
  const postsByType = calendarItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeChartData = Object.entries(postsByType).map(([type, count]) => ({
    name: getTypeLabel(type),
    value: count,
    fill: getTypeColor(type),
  }));

  // Posts by tone
  const postsByTone = posts.reduce((acc, post) => {
    const tone = post.tone || 'unknown';
    acc[tone] = (acc[tone] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const toneChartData = Object.entries(postsByTone).map(([tone, count]) => ({
    name: tone,
    posts: count,
  }));

  // Posts by length
  const postsByLength = posts.reduce((acc, post) => {
    acc[post.length] = (acc[post.length] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const lengthChartData = [
    { name: 'Court', value: postsByLength['short'] || 0, fill: 'hsl(var(--chart-1))' },
    { name: 'Moyen', value: postsByLength['medium'] || 0, fill: 'hsl(var(--chart-2))' },
    { name: 'Long', value: postsByLength['long'] || 0, fill: 'hsl(var(--chart-3))' },
  ];

  // Use real LinkedIn data if available, otherwise use simulated data
  const engagementData = linkedin.isConnected && linkedInStats.posts.length > 0
    ? linkedInStats.posts.slice(0, 4).map((post, i) => ({
        week: `S${i + 1}`,
        vues: post.stats.likes * 15, // Estimated views
        likes: post.stats.likes,
        commentaires: post.stats.comments,
        partages: post.stats.shares,
      }))
    : [
        { week: 'S1', vues: 1200, likes: 45, commentaires: 12, partages: 8 },
        { week: 'S2', vues: 1850, likes: 67, commentaires: 23, partages: 15 },
        { week: 'S3', vues: 2100, likes: 89, commentaires: 34, partages: 22 },
        { week: 'S4', vues: 1950, likes: 72, commentaires: 28, partages: 18 },
      ];

  // Top hashtags
  const hashtagCounts = posts.reduce((acc, post) => {
    (post.hashtags || []).forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Métriques & Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Analysez les performances de votre stratégie de contenu
        </p>
      </div>

      {/* LinkedIn Stats Banner */}
      {linkedin.isConnected ? (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Linkedin className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">
                    Statistiques LinkedIn connectées
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {linkedInStats.loading 
                      ? "Chargement des statistiques..."
                      : `${linkedInStats.posts.length} posts analysés`
                    }
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (linkedin.accessToken && linkedin.profile) {
                    linkedInStats.fetchLinkedInPosts(linkedin.accessToken, linkedin.profile.id);
                  }
                }}
                disabled={linkedInStats.loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${linkedInStats.loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 bg-secondary/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Linkedin className="w-6 h-6 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-foreground">
                    Connectez LinkedIn pour des stats réelles
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Les données ci-dessous sont simulées
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Données simulées</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LinkedIn Real Stats (when connected) */}
      {linkedin.isConnected && linkedInStats.totalStats.likes > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Vues estimées"
            value={linkedInStats.totalStats.views || 0}
            icon={Eye}
            trend="LinkedIn"
            trendUp={null}
          />
          <MetricCard
            title="Total Likes"
            value={linkedInStats.totalStats.likes}
            icon={ThumbsUp}
            trend="LinkedIn"
            trendUp={null}
          />
          <MetricCard
            title="Commentaires"
            value={linkedInStats.totalStats.comments}
            icon={MessageCircle}
            trend="LinkedIn"
            trendUp={null}
          />
          <MetricCard
            title="Partages"
            value={linkedInStats.totalStats.shares}
            icon={Share2}
            trend="LinkedIn"
            trendUp={null}
          />
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Posts Créés"
          value={totalPosts}
          icon={FileText}
          trend="+12%"
          trendUp={true}
        />
        <MetricCard
          title="Posts Publiés"
          value={publishedPosts}
          icon={Award}
          trend="+8%"
          trendUp={true}
        />
        <MetricCard
          title="Score Lisibilité"
          value={`${avgReadability}%`}
          icon={Zap}
          trend="+5%"
          trendUp={true}
        />
        <MetricCard
          title="Planifiés"
          value={scheduledItems}
          icon={Calendar}
          trend="Cette semaine"
          trendUp={null}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Over Time */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Évolution de l'Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementData}>
                  <defs>
                    <linearGradient id="colorVues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="vues" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorVues)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Interactions Breakdown */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Détail des Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData}>
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="likes" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="commentaires" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="partages" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-1))]" />
                <span className="text-sm text-muted-foreground">Likes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]" />
                <span className="text-sm text-muted-foreground">Commentaires</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-3))]" />
                <span className="text-sm text-muted-foreground">Partages</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts by Type */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Types de Contenu
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeChartData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {typeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Pas de données
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {typeChartData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs text-muted-foreground truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Posts by Length */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Longueur des Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lengthChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {lengthChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {lengthChartData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Statut des Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatusBar label="Brouillons" value={draftPosts} total={totalPosts} color="bg-yellow-500" />
              <StatusBar label="Prêts" value={readyPosts} total={totalPosts} color="bg-blue-500" />
              <StatusBar label="Publiés" value={publishedPosts} total={totalPosts} color="bg-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Hashtags */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Top Hashtags Utilisés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topHashtags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topHashtags.map(([tag, count]) => (
                <Badge key={tag} variant="secondary" className="text-sm py-1 px-3">
                  #{tag}
                  <span className="ml-2 text-xs text-muted-foreground">({count})</span>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Aucun hashtag utilisé pour le moment
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Conseil pour améliorer vos performances</h3>
              <p className="text-sm text-muted-foreground">
                Les posts avec des questions génèrent 2x plus d'engagement. Essayez d'inclure une question 
                ouverte à la fin de vos prochains posts pour encourager les commentaires.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper components
function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  trend: string; 
  trendUp: boolean | null;
}) {
  return (
    <Card className="border-border/50 hover:shadow-soft transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            <p className={`text-xs mt-2 ${
              trendUp === true ? 'text-green-500' : 
              trendUp === false ? 'text-red-500' : 
              'text-muted-foreground'
            }`}>
              {trend}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Helper functions
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    educational: 'Éducatif',
    storytelling: 'Storytelling',
    promotional: 'Promotionnel',
    engagement: 'Engagement',
    news: 'Actualité',
  };
  return labels[type] || type;
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    educational: 'hsl(var(--chart-1))',
    storytelling: 'hsl(var(--chart-2))',
    promotional: 'hsl(var(--chart-3))',
    engagement: 'hsl(var(--chart-4))',
    news: 'hsl(var(--chart-5))',
  };
  return colors[type] || 'hsl(var(--chart-1))';
}
