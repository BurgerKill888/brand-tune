import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  FileText,
  Eye,
  Trash2,
  Linkedin,
  Plus,
  Sparkles,
  RefreshCw,
  Send
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarItem, BrandProfile } from "@/types";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO, isFuture, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useScheduledPosts, ScheduledPost } from "@/hooks/useScheduledPosts";

interface CalendarViewProps {
  brandProfile: BrandProfile;
  calendarItems: CalendarItem[];
  onAddCalendarItem: (item: CalendarItem) => void;
  onSaveItems: (items: CalendarItem[]) => Promise<{ error: any }>;
}

export function CalendarView({ brandProfile, calendarItems, onAddCalendarItem, onSaveItems }: CalendarViewProps) {
  const { toast } = useToast();
  const { scheduledPosts, cancelScheduledPost, refetch } = useScheduledPosts(brandProfile.id);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Posts programmés actifs
  const activeScheduledPosts = scheduledPosts.filter(p => p.status === 'scheduled');
  
  // Prochains posts (triés par date)
  const upcomingPosts = [...activeScheduledPosts]
    .filter(p => isFuture(parseISO(p.scheduled_at)))
    .sort((a, b) => parseISO(a.scheduled_at).getTime() - parseISO(b.scheduled_at).getTime());

  const getPostsForDate = (date: Date): ScheduledPost[] => {
    return activeScheduledPosts.filter(post => 
      isSameDay(parseISO(post.scheduled_at), date)
    );
  };

  const selectedPosts = selectedDate ? getPostsForDate(selectedDate) : [];

  const handleCancelPost = async (postId: string) => {
    const success = await cancelScheduledPost(postId);
    if (success) {
      refetch();
      toast({ title: "Publication annulée" });
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Contenu copié ! 📋" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Calendrier Éditorial
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualisez et gérez vos publications programmées
        </p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeScheduledPosts.length}</p>
              <p className="text-xs text-muted-foreground">Programmés</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {scheduledPosts.filter(p => p.status === 'published').length}
              </p>
              <p className="text-xs text-muted-foreground">Publiés</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 md:col-span-2">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Prochain post</p>
            {upcomingPosts[0] ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <Clock className="w-3 h-3 mr-1" />
                  {format(parseISO(upcomingPosts[0].scheduled_at), "EEEE d MMM 'à' HH:mm", { locale: fr })}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Aucun post programmé</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendrier */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="capitalize text-xl">
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}>
                  Aujourd'hui
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Grille du calendrier */}
            <div className="grid grid-cols-7 gap-1">
              {/* Cellules vides pour l'alignement */}
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {days.map((day) => {
                const dayPosts = getPostsForDate(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasPosts = dayPosts.length > 0;
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square p-1 rounded-lg transition-all duration-200 relative group",
                      isToday(day) && "ring-2 ring-primary ring-offset-2",
                      isSelected && "bg-primary text-primary-foreground",
                      !isSelected && hasPosts && "bg-blue-50",
                      !isSelected && !hasPosts && "hover:bg-secondary",
                      !isSameMonth(day, currentMonth) && "opacity-30"
                    )}
                  >
                    <span className="text-sm font-medium">{format(day, 'd')}</span>
                    
                    {hasPosts && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayPosts.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Légende */}
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">Post programmé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded ring-2 ring-primary ring-offset-1" />
                <span className="text-xs text-muted-foreground">Aujourd'hui</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Détails du jour sélectionné */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {selectedDate 
                ? format(selectedDate, "EEEE d MMMM", { locale: fr })
                : "Sélectionnez une date"
              }
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {selectedPosts.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Aucun post ce jour
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPosts.map((post) => (
                  <div 
                    key={post.id}
                    className="p-4 rounded-xl bg-blue-50 border border-blue-100"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        <Linkedin className="w-3 h-3 mr-1" />
                        {format(parseISO(post.scheduled_at), "HH:mm")}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Programmé
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-foreground line-clamp-3 mb-3">
                      {post.content.slice(0, 150)}...
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        {expandedPostId === post.id ? "Masquer" : "Voir"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive"
                        onClick={() => handleCancelPost(post.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Annuler
                      </Button>
                    </div>

                    {expandedPostId === post.id && (
                      <div className="mt-3 p-3 rounded-lg bg-white border border-blue-100">
                        <pre className="text-xs text-foreground whitespace-pre-wrap font-sans">
                          {post.content}
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full text-xs"
                          onClick={() => copyToClipboard(post.content)}
                        >
                          Copier le contenu
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prochaines publications */}
      {upcomingPosts.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Prochaines publications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingPosts.slice(0, 6).map((post) => (
                <div 
                  key={post.id}
                  className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedDate(parseISO(post.scheduled_at));
                    setCurrentMonth(parseISO(post.scheduled_at));
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Linkedin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      {format(parseISO(post.scheduled_at), "EEEE d MMM", { locale: fr })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    à {format(parseISO(post.scheduled_at), "HH:mm")}
                  </p>
                  <p className="text-sm text-foreground line-clamp-2">
                    {post.content.slice(0, 80)}...
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* État vide */}
      {activeScheduledPosts.length === 0 && (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="py-12 text-center">
            <CalendarIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Aucune publication programmée
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Créez un post dans "Nouvelle réflexion" puis programmez-le pour qu'il apparaisse ici.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
