import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function usePosts(brandProfileId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && brandProfileId) {
      fetchPosts();
    } else {
      setPosts([]);
      setLoading(false);
    }
  }, [user, brandProfileId]);

  const fetchPosts = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (brandProfileId) {
        query = query.eq('brand_profile_id', brandProfileId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedPosts: Post[] = (data || []).map((item) => ({
        id: item.id,
        brandProfileId: item.brand_profile_id || '',
        calendarItemId: item.calendar_item_id || undefined,
        content: item.content,
        variants: item.variants || [],
        suggestions: item.suggestions || [],
        readabilityScore: item.readability_score || 0,
        editorialJustification: item.editorial_justification || '',
        length: (item.length as Post['length']) || 'medium',
        tone: item.tone || '',
        cta: item.cta || undefined,
        keywords: item.keywords || [],
        hashtags: item.hashtags || [],
        status: (item.status as Post['status']) || 'draft',
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));

      setPosts(mappedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePost = async (post: Post) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('posts')
        .upsert({
          id: post.id,
          user_id: user.id,
          brand_profile_id: post.brandProfileId,
          calendar_item_id: post.calendarItemId,
          content: post.content,
          variants: post.variants,
          suggestions: post.suggestions,
          readability_score: post.readabilityScore,
          editorial_justification: post.editorialJustification,
          length: post.length,
          tone: post.tone,
          cta: post.cta,
          keywords: post.keywords,
          hashtags: post.hashtags,
          status: post.status,
        })
        .select()
        .single();

      if (error) throw error;

      setPosts((prev) => {
        const existing = prev.findIndex((p) => p.id === post.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = post;
          return updated;
        }
        return [post, ...prev];
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le post.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast({
        title: "Post supprimé",
        description: "Le post a été supprimé.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting post:', error);
      return { error };
    }
  };

  return {
    posts,
    loading,
    savePost,
    deletePost,
    refreshPosts: fetchPosts,
  };
}
