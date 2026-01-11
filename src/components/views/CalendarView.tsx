import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  FileText,
  MessageSquare,
  Megaphone,
  Heart,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Clock,
  Send,
  Trash2,
  Eye,
  Linkedin
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarItem, BrandProfile } from "@/types";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addWeeks, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWatchItems } from "@/hooks/useWatchItems";
import { useScheduledPosts, ScheduledPost } from "@/hooks/useScheduledPosts";

interface CalendarViewProps {
  brandProfile: BrandProfile;
  calendarItems: CalendarItem[];
  onAddCalendarItem: (item: CalendarItem) => void;
  onSaveItems: (items: CalendarItem[]) => Promise<{ error: any }>;
}

const typeIcons = {
  educational: FileText,
  storytelling: Heart,
  promotional: Megaphone,
  engagement: MessageSquare,
  news: CalendarIcon,
  scheduled: Clock, // Pour les posts programmés
};

const typeColors = {
  educational: "bg-primary/10 text-primary border-primary/20",
  storytelling: "bg-rose-100 text-rose-700 border-rose-200",
  promotional: "bg-amber-100 text-amber-700 border-amber-200",
  engagement: "bg-teal-100 text-teal-700 border-teal-200",
  news: "bg-slate-100 text-slate-700 border-slate-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200", // Pour les posts programmés
};

const typeLabels: Record<string, string> = {
  educational: "Éducatif",
  storytelling: "Storytelling",
  promotional: "Promotionnel",
  engagement: "Engagement",
  news: "Actualité",
  scheduled: "Post programmé",
};

// Type unifié pour l'affichage
interface CalendarDisplayItem {
  id: string;
  date: Date;
  theme: string;
  type: string;
  objective: string;
  status: string;
  isScheduledPost: boolean;
  content?: string;
  scheduledPost?: ScheduledPost;
}

export function CalendarView({ brandProfile, calendarItems, onAddCalendarItem, onSaveItems }: CalendarViewProps) {
  const { toast } = useToast();
  const { watchItems } = useWatchItems(brandProfile.id);
  const { scheduledPosts, cancelScheduledPost, refetch: refetchScheduledPosts } = useScheduledPosts(brandProfile.id);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CalendarItem[]>(calendarItems);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  useEffect(() => {
    setItems(calendarItems);
  }, [calendarItems]);

  // Fusionner les items du calendrier et les posts programmés
  const getAllDisplayItems = (): CalendarDisplayItem[] => {
    // Convertir les calendar items
    const calendarDisplayItems: CalendarDisplayItem[] = items.map(item => ({
      id: item.id,
      date: new Date(item.date),
      theme: item.theme,
      type: item.type,
      objective: item.objective,
      status: item.status,
      isScheduledPost: false,
    }));

    // Convertir les scheduled posts
    const scheduledDisplayItems: CalendarDisplayItem[] = scheduledPosts
      .filter(post => post.status === 'scheduled')
      .map(post => ({
        id: post.id,
        date: parseISO(post.scheduled_at),
        theme: post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
        type: 'scheduled',
        objective: 'Publication LinkedIn',
        status: post.status,
        isScheduledPost: true,
        content: post.content,
        scheduledPost: post,
      }));

    return [...calendarDisplayItems, ...scheduledDisplayItems];
  };

  const allDisplayItems = getAllDisplayItems();
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getItemsForDate = (date: Date): CalendarDisplayItem[] => {
    return allDisplayItems.filter(item => isSameDay(new Date(item.date), date));
  };

  const selectedItems = selectedDate ? getItemsForDate(selectedDate) : [];

  // Stats pour le mois courant
  const monthStats = {
    total: allDisplayItems.filter(item => isSameMonth(new Date(item.date), currentMonth)).length,
    scheduled: scheduledPosts.filter(p => p.status === 'scheduled' && isSameMonth(parseISO(p.scheduled_at), currentMonth)).length,
    calendarItems: items.filter(item => isSameMonth(new Date(item.date), currentMonth)).length,
  };

  const handleGenerateCalendar = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const watchItemsForAI = watchItems.length > 0 
        ? watchItems.map(item => ({
            title: item.title,
            angle: item.angle,
            objective: item.objective,
          }))
        : [
            { title: "Tendances du secteur", angle: "Partager votre vision", objective: "credibility" },
            { title: "Retour d'expérience", angle: "Storytelling personnel", objective: "engagement" },
          ];

      const { data, error: fnError } = await supabase.functions.invoke('generate-calendar', {
        body: {
          watchItems: watchItemsForAI,
          brandProfile: {
            companyName: brandProfile.companyName,
            sector: brandProfile.sector,
            tone: brandProfile.tone,
            publishingFrequency: brandProfile.publishingFrequency,
            businessObjectives: brandProfile.businessObjectives,
            values: brandProfile.values,
          },
          startDate: format(addWeeks(new Date(), 1), 'yyyy-MM-dd'),
          weeksCount: 4,
        }
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      const newItems: CalendarItem[] = (data.items || []).map((item: any) => ({
        id: crypto.randomUUID(),
        brandProfileId: brandProfile.id,
        date: new Date(item.date),
        theme: item.theme,
        type: item.type as CalendarItem['type'],
        objective: item.objective,
        status: item.status as CalendarItem['status'] || 'scheduled',
      }));

      setItems(newItems);
      await onSaveItems(newItems);

      toast({
        title: `${newItems.length} posts planifiés 📅`,
        description: "Votre calendrier éditorial a été généré.",
      });
    } catch (err: unknown) {
      console.error("Calendar generation error:", err);
      const message = err instanceof Error ? err.message : "Erreur lors de la génération";
      setError(message);
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelScheduledPost = async (postId: string) => {
    const success = await cancelScheduledPost(postId);
    if (success) {
      refetchScheduledPosts();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Calendrier Éditorial
          </h1>
          <p className="text-muted-foreground mt-1">
            Planifiez et visualisez vos publications pour {brandProfile.companyName}
          </p>
        </div>
        <Button 
          variant="premium"
          onClick={handleGenerateCalendar}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer avec l'IA
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Posts ce mois</p>
                <p className="text-2xl font-bold text-foreground">{monthStats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Posts programmés</p>
                <p className="text-2xl font-bold text-blue-600">{monthStats.scheduled}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Idées planifiées</p>
                <p className="text-2xl font-bold text-teal-600">{monthStats.calendarItems}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="capitalize text-xl">
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentMonth(new Date());
                    setSelectedDate(new Date());
                  }}
                >
                  Aujourd'hui
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for alignment */}
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {days.map((day) => {
                const dayItems = getItemsForDate(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasScheduledPost = dayItems.some(item => item.isScheduledPost);
                const hasCalendarItem = dayItems.some(item => !item.isScheduledPost);
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square p-1 rounded-lg transition-all duration-200 relative group",
                      isToday(day) && "ring-2 ring-primary ring-offset-2",
                      isSelected && "bg-primary text-primary-foreground",
                      !isSelected && dayItems.length > 0 && "bg-secondary/50",
                      !isSelected && "hover:bg-secondary",
                      !isSameMonth(day, currentMonth) && "opacity-30"
                    )}
                  >
                    <span className="text-sm font-medium">{format(day, 'd')}</span>
                    
                    {dayItems.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {hasScheduledPost && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                        {hasCalendarItem && (
                          <div className="w-2 h-2 rounded-full bg-teal-500" />
                        )}
                      </div>
                    )}

                    {/* Hover tooltip */}
                    {dayItems.length > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 shadow-lg whitespace-nowrap">
                          {dayItems.length} post(s)
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">Post programmé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="text-xs text-muted-foreground">Idée planifiée</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded ring-2 ring-primary ring-offset-1" />
                <span className="text-xs text-muted-foreground">Aujourd'hui</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {selectedDate 
                ? format(selectedDate, "EEEE d MMMM", { locale: fr })
                : "Sélectionnez une date"
              }
            </CardTitle>
            <CardDescription>
              {selectedItems.length} élément(s) planifié(s)
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {allDisplayItems.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Aucun contenu planifié
                </p>
                <Button variant="secondary" size="sm" onClick={handleGenerateCalendar} disabled={isGenerating}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer un calendrier
                </Button>
              </div>
            )}

            {selectedItems.length === 0 && allDisplayItems.length > 0 && (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Rien de planifié ce jour
                </p>
              </div>
            )}

            {selectedItems.map((item) => {
              const Icon = typeIcons[item.type as keyof typeof typeIcons] || CalendarIcon;
              const colors = typeColors[item.type as keyof typeof typeColors] || typeColors.news;
              const isExpanded = expandedPostId === item.id;

              return (
                <div 
                  key={item.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    colors
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-foreground text-sm leading-snug">
                            {item.theme}
                          </p>
                          {item.isScheduledPost && item.scheduledPost && (
                            <p className="text-xs mt-1 opacity-80">
                              {format(parseISO(item.scheduledPost.scheduled_at), "HH:mm", { locale: fr })}
                            </p>
                          )}
                        </div>
                        {item.isScheduledPost && (
                          <Badge variant="info" className="flex-shrink-0">
                            <Linkedin className="w-3 h-3 mr-1" />
                            Programmé
                          </Badge>
                        )}
                      </div>
                      
                      {/* Actions pour les posts programmés */}
                      {item.isScheduledPost && item.scheduledPost && (
                        <div className="mt-3 space-y-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs h-8"
                            onClick={() => setExpandedPostId(isExpanded ? null : item.id)}
                          >
                            <Eye className="w-3 h-3 mr-2" />
                            {isExpanded ? "Masquer le contenu" : "Voir le contenu"}
                          </Button>
                          
                          {isExpanded && (
                            <div className="p-3 rounded-lg bg-background/70 text-xs text-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {item.scheduledPost.content}
                            </div>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleCancelScheduledPost(item.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Annuler la programmation
                          </Button>
                        </div>
                      )}

                      {/* Info pour les items du calendrier */}
                      {!item.isScheduledPost && (
                        <div className="mt-2">
                          <Badge 
                            variant="outline"
                            className="text-xs"
                          >
                            {typeLabels[item.type] || item.type}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Upcoming scheduled posts */}
            {selectedItems.length === 0 && scheduledPosts.filter(p => p.status === 'scheduled').length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-3">
                  Prochains posts programmés
                </p>
                <div className="space-y-2">
                  {scheduledPosts
                    .filter(p => p.status === 'scheduled')
                    .slice(0, 3)
                    .map(post => (
                      <button
                        key={post.id}
                        onClick={() => setSelectedDate(parseISO(post.scheduled_at))}
                        className="w-full p-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 transition-colors text-left"
                      >
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                          {format(parseISO(post.scheduled_at), "EEEE d MMM à HH:mm", { locale: fr })}
                        </p>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 truncate mt-0.5">
                          {post.content.slice(0, 60)}...
                        </p>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
