import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WatchTopic, WatchHistory, WatchItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useWatchTopics(userId: string | undefined, brandProfileId: string | undefined) {
  const { toast } = useToast();
  const [topics, setTopics] = useState<WatchTopic[]>([]);
  const [history, setHistory] = useState<WatchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all watch topics for the user
  const fetchTopics = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('watch_topics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTopics: WatchTopic[] = (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        brandProfileId: item.brand_profile_id,
        name: item.name,
        keywords: item.keywords || [],
        description: item.description,
        isScheduled: item.is_scheduled || false,
        scheduleTime: item.schedule_time,
        scheduleDays: item.schedule_days || [],
        lastRunAt: item.last_run_at ? new Date(item.last_run_at) : undefined,
        relevanceFilter: item.relevance_filter || 'all',
        objectiveFilter: item.objective_filter || 'all',
        isActive: item.is_active ?? true,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));

      setTopics(formattedTopics);
    } catch (error) {
      console.error('Error fetching watch topics:', error);
    }
  }, [userId]);

  // Fetch watch history
  const fetchHistory = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedHistory: WatchHistory[] = (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        watchTopicId: item.watch_topic_id,
        brandProfileId: item.brand_profile_id,
        query: item.query,
        items: item.items || [],
        citations: item.citations || [],
        createdAt: new Date(item.created_at),
      }));

      setHistory(formattedHistory);
    } catch (error) {
      console.error('Error fetching watch history:', error);
    }
  }, [userId]);

  // Create a new watch topic
  const createTopic = async (topic: Omit<WatchTopic, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return { error: 'User not authenticated' };

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('watch_topics')
        .insert({
          user_id: userId,
          brand_profile_id: brandProfileId,
          name: topic.name,
          keywords: topic.keywords,
          description: topic.description,
          is_scheduled: topic.isScheduled,
          schedule_time: topic.scheduleTime,
          schedule_days: topic.scheduleDays,
          relevance_filter: topic.relevanceFilter,
          objective_filter: topic.objectiveFilter,
          is_active: topic.isActive,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchTopics();
      
      toast({
        title: 'Sujet de veille créé',
        description: `"${topic.name}" a été ajouté à vos sujets de veille.`,
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating watch topic:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le sujet de veille.',
        variant: 'destructive',
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Update a watch topic
  const updateTopic = async (id: string, updates: Partial<WatchTopic>) => {
    if (!userId) return { error: 'User not authenticated' };

    setIsLoading(true);
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.keywords !== undefined) updateData.keywords = updates.keywords;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isScheduled !== undefined) updateData.is_scheduled = updates.isScheduled;
      if (updates.scheduleTime !== undefined) updateData.schedule_time = updates.scheduleTime;
      if (updates.scheduleDays !== undefined) updateData.schedule_days = updates.scheduleDays;
      if (updates.relevanceFilter !== undefined) updateData.relevance_filter = updates.relevanceFilter;
      if (updates.objectiveFilter !== undefined) updateData.objective_filter = updates.objectiveFilter;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error } = await supabase
        .from('watch_topics')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      await fetchTopics();
      
      toast({
        title: 'Sujet mis à jour',
        description: 'Vos modifications ont été enregistrées.',
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error updating watch topic:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le sujet.',
        variant: 'destructive',
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a watch topic
  const deleteTopic = async (id: string) => {
    if (!userId) return { error: 'User not authenticated' };

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('watch_topics')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      await fetchTopics();
      
      toast({
        title: 'Sujet supprimé',
        description: 'Le sujet de veille a été supprimé.',
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error deleting watch topic:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le sujet.',
        variant: 'destructive',
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Save watch results to history
  const saveToHistory = async (query: string, items: WatchItem[], citations: string[], watchTopicId?: string) => {
    if (!userId) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('watch_history')
        .insert({
          user_id: userId,
          brand_profile_id: brandProfileId,
          watch_topic_id: watchTopicId,
          query,
          items: items.map(item => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            source: item.source,
            url: item.url,
            angle: item.angle,
            relevance: item.relevance,
            objective: item.objective,
            alert: item.alert,
          })),
          citations,
        });

      if (error) throw error;

      await fetchHistory();
      return { error: null };
    } catch (error: any) {
      console.error('Error saving watch history:', error);
      return { error };
    }
  };

  // Toggle topic scheduling
  const toggleSchedule = async (id: string, isScheduled: boolean, scheduleTime?: string, scheduleDays?: string[]) => {
    return updateTopic(id, {
      isScheduled,
      scheduleTime,
      scheduleDays,
    });
  };

  useEffect(() => {
    if (userId) {
      fetchTopics();
      fetchHistory();
    }
  }, [userId, fetchTopics, fetchHistory]);

  return {
    topics,
    history,
    isLoading,
    createTopic,
    updateTopic,
    deleteTopic,
    saveToHistory,
    toggleSchedule,
    refetch: () => {
      fetchTopics();
      fetchHistory();
    },
  };
}

