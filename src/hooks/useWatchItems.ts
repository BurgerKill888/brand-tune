import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WatchItem } from '@/types';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useWatchItems(brandProfileId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [watchItems, setWatchItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && brandProfileId) {
      fetchWatchItems();
    } else {
      setWatchItems([]);
      setLoading(false);
    }
  }, [user, brandProfileId]);

  const fetchWatchItems = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('watch_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (brandProfileId) {
        query = query.eq('brand_profile_id', brandProfileId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedItems: WatchItem[] = (data || []).map((item) => ({
        id: item.id,
        brandProfileId: item.brand_profile_id || '',
        title: item.title,
        summary: item.summary || '',
        source: item.source || '',
        url: item.url || '',
        angle: item.angle || '',
        relevance: (item.relevance as WatchItem['relevance']) || 'medium',
        objective: (item.objective as WatchItem['objective']) || 'engagement',
        alert: item.alert || undefined,
        createdAt: new Date(item.created_at),
      }));

      setWatchItems(mappedItems);
    } catch (error) {
      console.error('Error fetching watch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWatchItem = async (item: WatchItem) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('watch_items')
        .upsert({
          id: item.id,
          user_id: user.id,
          brand_profile_id: item.brandProfileId,
          title: item.title,
          summary: item.summary,
          source: item.source,
          url: item.url,
          angle: item.angle,
          relevance: item.relevance,
          objective: item.objective,
          alert: item.alert,
        })
        .select()
        .single();

      if (error) throw error;

      setWatchItems((prev) => {
        const existing = prev.findIndex((i) => i.id === item.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = item;
          return updated;
        }
        return [item, ...prev];
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error saving watch item:', error);
      return { error };
    }
  };

  const saveWatchItems = async (items: WatchItem[]) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const records = items.map((item) => ({
        id: item.id,
        user_id: user.id,
        brand_profile_id: item.brandProfileId,
        title: item.title,
        summary: item.summary,
        source: item.source,
        url: item.url,
        angle: item.angle,
        relevance: item.relevance,
        objective: item.objective,
        alert: item.alert,
      }));

      const { error } = await supabase
        .from('watch_items')
        .upsert(records);

      if (error) throw error;

      setWatchItems(items);
      toast({
        title: "Veille sauvegardée",
        description: `${items.length} éléments enregistrés.`,
      });

      return { error: null };
    } catch (error) {
      console.error('Error saving watch items:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la veille.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const deleteWatchItem = async (itemId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('watch_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setWatchItems((prev) => prev.filter((i) => i.id !== itemId));

      return { error: null };
    } catch (error) {
      console.error('Error deleting watch item:', error);
      return { error };
    }
  };

  return {
    watchItems,
    loading,
    saveWatchItem,
    saveWatchItems,
    deleteWatchItem,
    refreshWatchItems: fetchWatchItems,
  };
}
