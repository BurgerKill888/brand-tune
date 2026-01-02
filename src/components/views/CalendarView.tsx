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
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarItem, BrandProfile, WatchItem } from "@/types";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWatchItems } from "@/hooks/useWatchItems";

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
};

const typeColors = {
  educational: "bg-primary/10 text-primary border-primary/20",
  storytelling: "bg-rose-100 text-rose-700 border-rose-200",
  promotional: "bg-amber-100 text-amber-700 border-amber-200",
  engagement: "bg-teal-100 text-teal-700 border-teal-200",
  news: "bg-slate-100 text-slate-700 border-slate-200",
};

export function CalendarView({ brandProfile, calendarItems, onAddCalendarItem, onSaveItems }: CalendarViewProps) {
  const { toast } = useToast();
  const { watchItems } = useWatchItems(brandProfile.id);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CalendarItem[]>(calendarItems);

  useEffect(() => {
    setItems(calendarItems);
  }, [calendarItems]);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getItemsForDate = (date: Date) => {
    return items.filter(item => isSameDay(new Date(item.date), date));
  };

  const selectedItems = selectedDate ? getItemsForDate(selectedDate) : [];

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
      
      // Save to database
      await onSaveItems(newItems);

      toast({
        title: `${newItems.length} posts planifiés`,
        description: "Votre calendrier éditorial a été généré et sauvegardé.",
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Calendrier Éditorial
          </h1>
          <p className="text-muted-foreground mt-1">
            Planifiez vos publications pour {brandProfile.companyName}
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

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
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
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square p-1 rounded-lg transition-all duration-200 relative",
                      isToday(day) && "ring-2 ring-primary ring-offset-2",
                      isSelected && "bg-primary text-primary-foreground",
                      !isSelected && "hover:bg-secondary",
                      !isSameMonth(day, currentMonth) && "opacity-30"
                    )}
                  >
                    <span className="text-sm font-medium">{format(day, 'd')}</span>
                    
                    {dayItems.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayItems.slice(0, 3).map((item, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              item.type === 'educational' && "bg-primary",
                              item.type === 'storytelling' && "bg-rose-500",
                              item.type === 'promotional' && "bg-amber-500",
                              item.type === 'engagement' && "bg-teal-500",
                              item.type === 'news' && "bg-slate-500"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-border">
              {Object.entries(typeColors).map(([type, classes]) => {
                const Icon = typeIcons[type as keyof typeof typeIcons];
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className={cn("w-6 h-6 rounded flex items-center justify-center border", classes)}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{type}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>
              {selectedDate 
                ? format(selectedDate, "d MMMM yyyy", { locale: fr })
                : "Sélectionnez une date"
              }
            </CardTitle>
            <CardDescription>
              {selectedItems.length} post(s) planifié(s)
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {items.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Cliquez sur "Générer avec l'IA" pour créer votre calendrier
                </p>
              </div>
            )}

            {selectedItems.length === 0 && items.length > 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aucun post planifié pour cette date
                </p>
                <Button variant="secondary" size="sm" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            ) : (
              selectedItems.map((item) => {
                const Icon = typeIcons[item.type];
                return (
                  <div 
                    key={item.id}
                    className={cn(
                      "p-4 rounded-xl border",
                      typeColors[item.type]
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.theme}</p>
                        <p className="text-xs mt-1 opacity-80">{item.objective}</p>
                        <Badge 
                          variant={item.status === 'scheduled' ? 'success' : 'secondary'}
                          className="mt-2"
                        >
                          {item.status === 'scheduled' ? 'Planifié' : 'Brouillon'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
