import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ScheduledPost {
  id: string;
  user_id: string;
  brand_profile_id: string | null;
  post_id: string | null;
  content: string;
  scheduled_at: string;
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  linkedin_post_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function useScheduledPosts(brandProfileId?: string) {
  const { toast } = useToast();
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduledPosts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (brandProfileId) {
        query = query.eq('brand_profile_id', brandProfileId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setScheduledPosts((data || []) as ScheduledPost[]);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  }, [brandProfileId]);

  useEffect(() => {
    fetchScheduledPosts();
  }, [fetchScheduledPosts]);

  const schedulePost = async (
    content: string,
    scheduledAt: Date,
    postId?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Non connecté",
          description: "Veuillez vous connecter pour programmer un post",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase.from('scheduled_posts').insert({
        user_id: user.id,
        brand_profile_id: brandProfileId,
        post_id: postId,
        content,
        scheduled_at: scheduledAt.toISOString(),
        status: 'scheduled',
      });

      if (error) throw error;

      toast({
        title: "Post programmé ! 📅",
        description: `Publication prévue le ${scheduledAt.toLocaleDateString('fr-FR')} à ${scheduledAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      });

      fetchScheduledPosts();
      return true;
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast({
        title: "Erreur",
        description: "Impossible de programmer le post",
        variant: "destructive",
      });
      return false;
    }
  };

  const cancelScheduledPost = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Post annulé",
        description: "La publication programmée a été annulée",
      });

      fetchScheduledPosts();
      return true;
    } catch (error) {
      console.error('Error cancelling scheduled post:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler le post",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    scheduledPosts,
    loading,
    schedulePost,
    cancelScheduledPost,
    refetch: fetchScheduledPosts,
  };
}
