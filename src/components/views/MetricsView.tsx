import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Linkedin
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

interface MetricsViewProps {
  posts: Post[];
  calendarItems: CalendarItem[];
}

// Vibrant color palette
const CHART_COLORS = {
  primary: '#8B5CF6', // Violet
  secondary: '#06B6D4', // Cyan
  tertiary: '#F59E0B', // Amber
  success: '#10B981', // Emerald
  pink: '#EC4899', // Pink
  blue: '#3B82F6', // Blue
};

export function MetricsView({ posts, calendarItems }: MetricsViewProps) {
  const linkedin = useLinkedIn();

  // Simulated engagement data
  const engagementData = [
    { week: 'S1', vues: 1200, likes: 45, commentaires: 12, partages: 8 },
    { week: 'S2', vues: 1850, likes: 67, commentaires: 23, partages: 15 },
    { week: 'S3', vues: 2100, likes: 89, commentaires: 34, partages: 22 },
    { week: 'S4', vues: 1950, likes: 72, commentaires: 28, partages: 18 },
  ];

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

  // Posts by type
  const postsByType = calendarItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeChartData = Object.entries(postsByType).map(([type, count]) => ({
    name: getTypeLabel(type),
    value: count,
    fill: getTypeColor(type),
  }));

  // Posts by length
  const postsByLength = posts.reduce((acc, post) => {
    acc[post.length] = (acc[post.length] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const lengthChartData = [
    { name: 'Court', value: postsByLength['short'] || 0, fill: CHART_COLORS.primary },
    { name: 'Moyen', value: postsByLength['medium'] || 0, fill: CHART_COLORS.secondary },
    { name: 'Long', value: postsByLength['long'] || 0, fill: CHART_COLORS.tertiary },
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
        <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50 to-transparent dark:from-violet-950/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                  <Linkedin className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    LinkedIn connecté : {linkedin.profile?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Publication de posts activée • Statistiques simulées
                  </p>
                </div>
              </div>
              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                Données estimées
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-cyan-200 dark:border-cyan-800 bg-gradient-to-r from-cyan-50 to-transparent dark:from-cyan-950/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                  <Linkedin className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Connectez LinkedIn pour publier vos posts
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Les données ci-dessous sont simulées
                  </p>
                </div>
              </div>
              <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300">
                Données simulées
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Posts Créés"
          value={totalPosts}
          icon={FileText}
          trend="+12%"
          trendUp={true}
          color="violet"
        />
        <MetricCard
          title="Posts Publiés"
          value={publishedPosts}
          icon={Award}
          trend="+8%"
          trendUp={true}
          color="emerald"
        />
        <MetricCard
          title="Score Lisibilité"
          value={`${avgReadability}%`}
          icon={Zap}
          trend="+5%"
          trendUp={true}
          color="amber"
        />
        <MetricCard
          title="Planifiés"
          value={scheduledItems}
          icon={Calendar}
          trend="Cette semaine"
          trendUp={null}
          color="cyan"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Over Time */}
        <Card className="border-violet-100 dark:border-violet-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-violet-600">
              <TrendingUp className="w-5 h-5" />
              Évolution de l'Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementData}>
                  <defs>
                    <linearGradient id="colorVues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
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
                    stroke={CHART_COLORS.primary}
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
        <Card className="border-cyan-100 dark:border-cyan-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-600">
              <MessageCircle className="w-5 h-5" />
              Détail des Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData}>
                  <XAxis dataKey="week" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="likes" fill={CHART_COLORS.pink} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="commentaires" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="partages" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.pink }} />
                <span className="text-sm text-muted-foreground">Likes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.secondary }} />
                <span className="text-sm text-muted-foreground">Commentaires</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.success }} />
                <span className="text-sm text-muted-foreground">Partages</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts by Type */}
        <Card className="border-amber-100 dark:border-amber-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Target className="w-5 h-5" />
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
        <Card className="border-emerald-100 dark:border-emerald-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <FileText className="w-5 h-5" />
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
        <Card className="border-pink-100 dark:border-pink-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-600">
              <Award className="w-5 h-5" />
              Statut des Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatusBar label="Brouillons" value={draftPosts} total={totalPosts} color="bg-amber-500" />
              <StatusBar label="Prêts" value={readyPosts} total={totalPosts} color="bg-cyan-500" />
              <StatusBar label="Publiés" value={publishedPosts} total={totalPosts} color="bg-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Hashtags */}
      <Card className="border-blue-100 dark:border-blue-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Share2 className="w-5 h-5" />
            Top Hashtags Utilisés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topHashtags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topHashtags.map(([tag, count], index) => {
                const colors = [
                  'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
                  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
                  'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
                ];
                return (
                  <Badge key={tag} className={`text-sm py-1 px-3 ${colors[index % colors.length]}`}>
                    #{tag}
                    <span className="ml-2 opacity-70">({count})</span>
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Aucun hashtag utilisé pour le moment
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50 to-cyan-50 dark:from-violet-950/30 dark:to-cyan-950/30">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
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
  trendUp,
  color
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  trend: string; 
  trendUp: boolean | null;
  color: 'violet' | 'cyan' | 'amber' | 'emerald' | 'pink' | 'blue';
}) {
  const colorClasses = {
    violet: {
      bg: 'bg-violet-100 dark:bg-violet-900/50',
      text: 'text-violet-600',
      border: 'border-violet-100 dark:border-violet-900/50'
    },
    cyan: {
      bg: 'bg-cyan-100 dark:bg-cyan-900/50',
      text: 'text-cyan-600',
      border: 'border-cyan-100 dark:border-cyan-900/50'
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/50',
      text: 'text-amber-600',
      border: 'border-amber-100 dark:border-amber-900/50'
    },
    emerald: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/50',
      text: 'text-emerald-600',
      border: 'border-emerald-100 dark:border-emerald-900/50'
    },
    pink: {
      bg: 'bg-pink-100 dark:bg-pink-900/50',
      text: 'text-pink-600',
      border: 'border-pink-100 dark:border-pink-900/50'
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/50',
      text: 'text-blue-600',
      border: 'border-blue-100 dark:border-blue-900/50'
    },
  };

  const classes = colorClasses[color];

  return (
    <Card className={`hover:shadow-soft transition-shadow ${classes.border}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            <p className={`text-xs mt-2 ${
              trendUp === true ? 'text-emerald-600' : 
              trendUp === false ? 'text-red-500' : 
              'text-muted-foreground'
            }`}>
              {trend}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-lg ${classes.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${classes.text}`} />
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
        <span className="font-medium text-foreground">{value}</span>
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
    educational: CHART_COLORS.primary,
    storytelling: CHART_COLORS.secondary,
    promotional: CHART_COLORS.tertiary,
    engagement: CHART_COLORS.pink,
    news: CHART_COLORS.success,
  };
  return colors[type] || CHART_COLORS.primary;
}
