import { 
  TrendingUp, 
  Users, 
  FileText, 
  Calendar,
  ArrowRight,
  Sparkles,
  Target,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandProfile, WatchItem, CalendarItem, Post } from "@/types";

interface DashboardViewProps {
  brandProfile: BrandProfile | null;
  watchItems: WatchItem[];
  calendarItems: CalendarItem[];
  posts: Post[];
  onStartOnboarding: () => void;
  onNavigate: (view: 'watch' | 'calendar' | 'posts') => void;
}

export function DashboardView({ 
  brandProfile, 
  watchItems, 
  calendarItems, 
  posts,
  onStartOnboarding,
  onNavigate
}: DashboardViewProps) {
  
  if (!brandProfile) {
    return <WelcomeState onStartOnboarding={onStartOnboarding} />;
  }

  const stats = [
    { 
      label: "Sources veille", 
      value: watchItems.length, 
      icon: TrendingUp, 
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      label: "Posts planifiés", 
      value: calendarItems.filter(c => c.status === 'scheduled').length, 
      icon: Calendar, 
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    { 
      label: "Posts créés", 
      value: posts.length, 
      icon: FileText, 
      color: "text-teal-600",
      bgColor: "bg-teal-100"
    },
    { 
      label: "Audience cible", 
      value: brandProfile.targets.length, 
      icon: Users, 
      color: "text-slate-600",
      bgColor: "bg-slate-100"
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Bonjour ! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Voici un aperçu de votre stratégie LinkedIn pour <span className="font-medium text-foreground">{brandProfile.companyName}</span>
          </p>
        </div>
        <Badge variant="success" className="px-3 py-1">
          <Sparkles className="w-3 h-3 mr-1" />
          Profil configuré
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} variant="elevated" className="group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className="text-3xl font-display font-bold text-foreground">
                  {stat.value}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-4">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Actions rapides
            </CardTitle>
            <CardDescription>
              Continuez à développer votre stratégie de contenu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuickActionButton 
              title="Lancer une veille"
              description="Découvrez les dernières tendances de votre secteur"
              icon={TrendingUp}
              onClick={() => onNavigate('watch')}
            />
            <QuickActionButton 
              title="Planifier des posts"
              description="Organisez votre calendrier éditorial"
              icon={Calendar}
              onClick={() => onNavigate('calendar')}
            />
            <QuickActionButton 
              title="Générer un post"
              description="Créez du contenu optimisé avec l'IA"
              icon={Zap}
              onClick={() => onNavigate('posts')}
            />
          </CardContent>
        </Card>

        {/* Brand Summary */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Votre marque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Secteur</p>
              <p className="font-medium text-foreground">{brandProfile.sector}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Ton</p>
              <Badge variant="info" className="mt-1">{brandProfile.tone}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Fréquence</p>
              <p className="font-medium text-foreground">{brandProfile.publishingFrequency}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Valeurs</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {brandProfile.values.slice(0, 3).map((value) => (
                  <Badge key={value} variant="outline" className="text-xs">{value}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WelcomeState({ onStartOnboarding }: { onStartOnboarding: () => void }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center mx-auto mb-8 shadow-glow animate-float">
          <Sparkles className="w-10 h-10 text-primary-foreground" />
        </div>
        
        <h1 className="text-4xl font-display font-bold text-foreground mb-4">
          Bienvenue sur ContentAI
        </h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Créez une stratégie LinkedIn percutante en quelques étapes. 
          Notre IA vous accompagne pour générer du contenu aligné avec votre marque.
        </p>
        
        <div className="grid grid-cols-3 gap-6 mb-10">
          <FeatureCard 
            icon={Target}
            title="Définir"
            description="Votre identité éditoriale"
          />
          <FeatureCard 
            icon={TrendingUp}
            title="Veiller"
            description="Les tendances du secteur"
          />
          <FeatureCard 
            icon={Zap}
            title="Générer"
            description="Des posts performants"
          />
        </div>
        
        <Button 
          size="xl" 
          variant="premium"
          onClick={onStartOnboarding}
          className="gap-2"
        >
          Commencer la configuration
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border shadow-soft text-center">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function QuickActionButton({ 
  title, 
  description, 
  icon: Icon, 
  onClick 
}: { 
  title: string; 
  description: string; 
  icon: any; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:bg-secondary transition-all duration-200 group text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </button>
  );
}
