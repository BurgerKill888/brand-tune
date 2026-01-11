import { useState, useEffect } from "react";
import { 
  Search, 
  ExternalLink, 
  TrendingUp,
  Bookmark,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Globe,
  Clock,
  Newspaper,
  Plus,
  Tag,
  Calendar,
  Bell,
  BellOff,
  Trash2,
  Settings2,
  Filter,
  History,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Play
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { WatchItem, BrandProfile, WatchTopic } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/appStore";
import { useWatchTopics } from "@/hooks/useWatchTopics";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface WatchViewProps {
  brandProfile: BrandProfile;
  watchItems: WatchItem[];
  onAddWatchItem: (item: WatchItem) => void;
  onSaveItems: (items: WatchItem[]) => Promise<{ error: any }>;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Lun' },
  { value: 'tuesday', label: 'Mar' },
  { value: 'wednesday', label: 'Mer' },
  { value: 'thursday', label: 'Jeu' },
  { value: 'friday', label: 'Ven' },
  { value: 'saturday', label: 'Sam' },
  { value: 'sunday', label: 'Dim' },
];

const SCHEDULE_TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export function WatchView({ brandProfile, watchItems, onAddWatchItem, onSaveItems }: WatchViewProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { setCurrentView } = useAppStore();
  
  // State for search
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [items, setItems] = useState<WatchItem[]>(watchItems);
  const [citations, setCitations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // State for filters
  const [relevanceFilter, setRelevanceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [objectiveFilter, setObjectiveFilter] = useState<'all' | 'reach' | 'credibility' | 'lead' | 'engagement'>('all');

  // State for topics management
  const [showAddTopicDialog, setShowAddTopicDialog] = useState(false);
  const [showTopicSettings, setShowTopicSettings] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState(true);
  const [expandedHistory, setExpandedHistory] = useState(false);

  // New topic form
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicKeywords, setNewTopicKeywords] = useState("");
  const [newTopicDescription, setNewTopicDescription] = useState("");
  const [newTopicScheduled, setNewTopicScheduled] = useState(false);
  const [newTopicTime, setNewTopicTime] = useState("08:00");
  const [newTopicDays, setNewTopicDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);

  // Hook for watch topics
  const {
    topics,
    history,
    isLoading: topicsLoading,
    createTopic,
    updateTopic,
    deleteTopic,
    saveToHistory,
    toggleSchedule,
  } = useWatchTopics(user?.id, brandProfile.id);

  // Active topic being edited
  const [editingTopic, setEditingTopic] = useState<WatchTopic | null>(null);

  const handleSearch = async (query?: string, topicId?: string) => {
    const searchText = query || searchQuery;
    
    if (!searchText.trim()) {
      toast({
        title: "Entrez une requête",
        description: "Tapez des mots-clés pour lancer la recherche.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('perplexity-watch', {
        body: {
          query: searchText,
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
        relevance: item.relevance || 'medium',
        objective: item.objective || 'reach',
        alert: item.alert,
        createdAt: new Date(),
      }));

      setItems(newItems);
      setCitations(data.citations || []);
      
      // Save to database and history
      await onSaveItems(newItems);
      await saveToHistory(searchText, newItems, data.citations || [], topicId);

      toast({
        title: `${newItems.length} actualités trouvées`,
        description: `Sources: ${(data.citations || []).length} citations Perplexity`,
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
      setIsSearching(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) {
      toast({
        title: "Nom requis",
        description: "Donnez un nom à votre sujet de veille.",
        variant: "destructive",
      });
      return;
    }

    const keywords = newTopicKeywords.split(',').map(k => k.trim()).filter(k => k);
    
    if (keywords.length === 0) {
      toast({
        title: "Mots-clés requis",
        description: "Ajoutez au moins un mot-clé pour la veille.",
        variant: "destructive",
      });
      return;
    }

    await createTopic({
      name: newTopicName,
      keywords,
      description: newTopicDescription || undefined,
      isScheduled: newTopicScheduled,
      scheduleTime: newTopicScheduled ? newTopicTime : undefined,
      scheduleDays: newTopicScheduled ? newTopicDays : [],
      relevanceFilter: 'all',
      objectiveFilter: 'all',
      isActive: true,
    });

    // Reset form
    setNewTopicName("");
    setNewTopicKeywords("");
    setNewTopicDescription("");
    setNewTopicScheduled(false);
    setNewTopicTime("08:00");
    setNewTopicDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    setShowAddTopicDialog(false);
  };

  const handleRunTopicSearch = async (topic: WatchTopic) => {
    const query = topic.keywords.join(' ');
    await handleSearch(query, topic.id);
  };

  const handleDeleteTopic = async (topicId: string) => {
    await deleteTopic(topicId);
    setShowTopicSettings(null);
  };

  const handleToggleSchedule = async (topic: WatchTopic) => {
    await toggleSchedule(
      topic.id,
      !topic.isScheduled,
      topic.isScheduled ? undefined : '08:00',
      topic.isScheduled ? [] : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    );
  };

  const handleCreatePost = (item: WatchItem) => {
    setCurrentView('posts');
    toast({
      title: "Angle sélectionné",
      description: `Créez un post sur: ${item.angle}`,
    });
  };

  const toggleDay = (day: string) => {
    setNewTopicDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  // Filter items
  const filteredItems = items.filter(item => {
    if (relevanceFilter !== 'all' && item.relevance !== relevanceFilter) return false;
    if (objectiveFilter !== 'all' && item.objective !== objectiveFilter) return false;
    return true;
  });

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Veille Intelligente
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez les tendances de votre secteur avec des alertes personnalisées
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Tag className="w-3 h-3 mr-1" />
            {topics.length} sujets
          </Badge>
          <Badge variant="info" className="px-3 py-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            {items.length} sources
          </Badge>
        </div>
      </div>

      {/* Tabs: Recherche / Mes Sujets */}
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Recherche
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Mes Sujets
          </TabsTrigger>
        </TabsList>

        {/* Recherche Tab */}
        <TabsContent value="search" className="space-y-6 mt-6">
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
                  onClick={() => handleSearch()}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Rechercher
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

          {/* Filters */}
          {items.length > 0 && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Filtres:</span>
              </div>
              
              <Select value={relevanceFilter} onValueChange={(v: any) => setRelevanceFilter(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Pertinence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>

              <Select value={objectiveFilter} onValueChange={(v: any) => setObjectiveFilter(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Objectif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="reach">Reach</SelectItem>
                  <SelectItem value="credibility">Crédibilité</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>

              {(relevanceFilter !== 'all' || objectiveFilter !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setRelevanceFilter('all');
                    setObjectiveFilter('all');
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Réinitialiser
                </Button>
              )}

              <span className="text-sm text-muted-foreground ml-auto">
                {filteredItems.length} / {items.length} résultats
              </span>
            </div>
          )}

          {/* Empty State */}
          {items.length === 0 && !isSearching && (
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
            {filteredItems.map((item) => (
              <Card 
                key={item.id} 
                variant="elevated"
                className="group hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {item.url ? (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors cursor-pointer flex items-start gap-2">
                            <Newspaper className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary/70" />
                            <span>{item.title}</span>
                          </CardTitle>
                        </a>
                      ) : (
                        <CardTitle className="text-lg leading-tight flex items-start gap-2">
                          <Newspaper className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                          <span>{item.title}</span>
                        </CardTitle>
                      )}
                      
                      <CardDescription className="mt-2 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span className="font-medium">{item.source}</span>
                        </span>
                        {item.url && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Voir l'article
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
                  
                  <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-teal-500/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Angle suggéré pour LinkedIn
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {item.angle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {objectiveLabels[item.objective]}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" title="Sauvegarder">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                      {item.url && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(item.url, '_blank')}
                          title="Ouvrir la source"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
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
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <p className="text-sm text-amber-700 dark:text-amber-400">{item.alert}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Citations Section */}
          {citations.length > 0 && (
            <Card variant="elevated" className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="w-5 h-5 text-primary" />
                  Sources Perplexity ({citations.length})
                </CardTitle>
                <CardDescription>
                  Sources d'actualités utilisées pour cette recherche
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {citations.map((url, index) => {
                    let displayName = url;
                    try {
                      const urlObj = new URL(url);
                      displayName = urlObj.hostname.replace('www.', '');
                    } catch {
                      displayName = `Source ${index + 1}`;
                    }
                    
                    return (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary hover:bg-primary/10 text-sm text-muted-foreground hover:text-primary transition-colors border border-border"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {displayName}
                      </a>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Mes Sujets Tab */}
        <TabsContent value="topics" className="space-y-6 mt-6">
          {/* Add Topic Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Sujets de veille enregistrés</h2>
              <p className="text-sm text-muted-foreground">
                Créez des alertes personnalisées pour suivre vos thématiques
              </p>
            </div>
            <Button onClick={() => setShowAddTopicDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau sujet
            </Button>
          </div>

          {/* Topics List */}
          {topics.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Aucun sujet de veille</h3>
                <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
                  Créez votre premier sujet pour recevoir des alertes personnalisées
                </p>
                <Button onClick={() => setShowAddTopicDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un sujet
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topics.map((topic) => (
                <Card 
                  key={topic.id} 
                  className={cn(
                    "transition-all",
                    topic.isActive ? "border-border" : "border-border/50 opacity-60"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Tag className="w-4 h-4 text-primary" />
                          {topic.name}
                          {topic.isScheduled && (
                            <Badge variant="info" className="ml-2">
                              <Bell className="w-3 h-3 mr-1" />
                              Programmé
                            </Badge>
                          )}
                        </CardTitle>
                        {topic.description && (
                          <CardDescription className="mt-1">{topic.description}</CardDescription>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setShowTopicSettings(topic.id)}
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Keywords */}
                    <div className="flex flex-wrap gap-1.5">
                      {topic.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>

                    {/* Schedule Info */}
                    {topic.isScheduled && topic.scheduleTime && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          Tous les jours à {topic.scheduleTime}
                          {topic.scheduleDays.length < 7 && (
                            <span className="ml-1">
                              ({topic.scheduleDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')})
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {topic.lastRunAt && (
                      <p className="text-xs text-muted-foreground">
                        Dernière exécution: {new Date(topic.lastRunAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRunTopicSearch(topic)}
                        disabled={isSearching}
                        className="flex-1"
                      >
                        {isSearching ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        Lancer la veille
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleSchedule(topic)}
                        title={topic.isScheduled ? "Désactiver la programmation" : "Activer la programmation"}
                      >
                        {topic.isScheduled ? (
                          <BellOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Bell className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* History Section */}
          {history.length > 0 && (
            <Collapsible open={expandedHistory} onOpenChange={setExpandedHistory}>
              <Card className="mt-8">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <History className="w-5 h-5 text-muted-foreground" />
                        Historique des recherches
                      </CardTitle>
                      {expandedHistory ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <CardDescription>
                      Vos {history.length} dernières recherches
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {history.slice(0, 10).map((entry) => (
                        <div 
                          key={entry.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{entry.query}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.items.length} résultats • {new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setItems(entry.items);
                              setCitations(entry.citations);
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Revoir
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Topic Dialog */}
      <Dialog open={showAddTopicDialog} onOpenChange={setShowAddTopicDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Nouveau sujet de veille
            </DialogTitle>
            <DialogDescription>
              Créez un sujet pour suivre automatiquement les actualités de votre secteur.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="topic-name">Nom du sujet *</Label>
              <Input
                id="topic-name"
                placeholder="Ex: Tendances IA Marketing"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
              />
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="topic-keywords">Mots-clés (séparés par des virgules) *</Label>
              <Input
                id="topic-keywords"
                placeholder="Ex: intelligence artificielle, marketing B2B, automatisation"
                value={newTopicKeywords}
                onChange={(e) => setNewTopicKeywords(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ces mots-clés seront utilisés pour rechercher des actualités pertinentes.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="topic-description">Description (optionnel)</Label>
              <Input
                id="topic-description"
                placeholder="Une brève description de ce sujet..."
                value={newTopicDescription}
                onChange={(e) => setNewTopicDescription(e.target.value)}
              />
            </div>

            {/* Schedule Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div className="space-y-0.5">
                <Label htmlFor="schedule-toggle" className="flex items-center gap-2 cursor-pointer">
                  <Calendar className="w-4 h-4 text-primary" />
                  Programmer une veille quotidienne
                </Label>
                <p className="text-xs text-muted-foreground">
                  Recevez automatiquement les résultats à l'heure choisie
                </p>
              </div>
              <Switch
                id="schedule-toggle"
                checked={newTopicScheduled}
                onCheckedChange={setNewTopicScheduled}
              />
            </div>

            {/* Schedule Options */}
            {newTopicScheduled && (
              <div className="space-y-4 p-4 rounded-lg border bg-muted/20 animate-fade-in">
                {/* Time */}
                <div className="space-y-2">
                  <Label>Heure de veille</Label>
                  <Select value={newTopicTime} onValueChange={setNewTopicTime}>
                    <SelectTrigger className="w-[140px]">
                      <Clock className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_TIMES.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Days */}
                <div className="space-y-2">
                  <Label>Jours de la semaine</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={newTopicDays.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(day.value)}
                        className="w-12"
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTopicDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateTopic} disabled={topicsLoading}>
              {topicsLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Créer le sujet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Topic Settings Dialog */}
      <Dialog open={!!showTopicSettings} onOpenChange={() => setShowTopicSettings(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Paramètres du sujet</DialogTitle>
            <DialogDescription>
              Modifiez ou supprimez ce sujet de veille.
            </DialogDescription>
          </DialogHeader>
          
          {showTopicSettings && (() => {
            const topic = topics.find(t => t.id === showTopicSettings);
            if (!topic) return null;

            return (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium">{topic.name}</h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {topic.keywords.map((kw, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>

                {/* Schedule Settings */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">Veille programmée</p>
                    <p className="text-xs text-muted-foreground">
                      {topic.isScheduled 
                        ? `Tous les jours à ${topic.scheduleTime}`
                        : "Non programmée"
                      }
                    </p>
                  </div>
                  <Switch
                    checked={topic.isScheduled}
                    onCheckedChange={() => handleToggleSchedule(topic)}
                  />
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => handleDeleteTopic(topic.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer ce sujet
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
