import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarItem } from '@/types';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useCalendarItems(brandProfileId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && brandProfileId) {
      fetchCalendarItems();
    } else {
      setCalendarItems([]);
      setLoading(false);
    }
  }, [user, brandProfileId]);

  const fetchCalendarItems = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('calendar_items')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true });

      if (brandProfileId) {
        query = query.eq('brand_profile_id', brandProfileId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedItems: CalendarItem[] = (data || []).map((item) => ({
        id: item.id,
        brandProfileId: item.brand_profile_id || '',
        date: new Date(item.scheduled_date),
        theme: item.theme,
        type: item.content_type as CalendarItem['type'],
        objective: item.objective || '',
        status: item.status as CalendarItem['status'],
      }));

      setCalendarItems(mappedItems);
    } catch (error) {
      console.error('Error fetching calendar items:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCalendarItem = async (item: CalendarItem) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('calendar_items')
        .upsert({
          id: item.id,
          user_id: user.id,
          brand_profile_id: item.brandProfileId,
          scheduled_date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : item.date,
          theme: item.theme,
          content_type: item.type,
          objective: item.objective,
          status: item.status,
        })
        .select()
        .single();

      if (error) throw error;

      setCalendarItems((prev) => {
        const existing = prev.findIndex((i) => i.id === item.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = item;
          return updated;
        }
        return [...prev, item];
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error saving calendar item:', error);
      return { error };
    }
  };

  const saveCalendarItems = async (items: CalendarItem[]) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const records = items.map((item) => ({
        id: item.id,
        user_id: user.id,
        brand_profile_id: item.brandProfileId,
        scheduled_date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : item.date,
        theme: item.theme,
        content_type: item.type,
        objective: item.objective,
        status: item.status,
      }));

      const { error } = await supabase
        .from('calendar_items')
        .upsert(records);

      if (error) throw error;

      setCalendarItems(items);
      toast({
        title: "Calendrier sauvegardé",
        description: `${items.length} éléments enregistrés.`,
      });

      return { error: null };
    } catch (error) {
      console.error('Error saving calendar items:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le calendrier.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const deleteCalendarItem = async (itemId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('calendar_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setCalendarItems((prev) => prev.filter((i) => i.id !== itemId));

      return { error: null };
    } catch (error) {
      console.error('Error deleting calendar item:', error);
      return { error };
    }
  };

  return {
    calendarItems,
    loading,
    saveCalendarItem,
    saveCalendarItems,
    deleteCalendarItem,
    refreshCalendarItems: fetchCalendarItems,
  };
}
