import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LinkedInPost {
  id: string;
  text: string;
  createdAt: string;
}

export interface LinkedInStats {
  likes: number;
  comments: number;
  shares: number;
  views?: number;
}

export interface LinkedInPostWithStats extends LinkedInPost {
  stats: LinkedInStats;
}

export function useLinkedInStats() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<LinkedInPostWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalStats, setTotalStats] = useState<LinkedInStats>({
    likes: 0,
    comments: 0,
    shares: 0,
    views: 0,
  });

  const fetchLinkedInPosts = useCallback(async (accessToken: string, memberId: string) => {
    setLoading(true);
    try {
      // Fetch user's posts
      const { data: postsData, error: postsError } = await supabase.functions.invoke('linkedin-post', {
        body: {
          action: 'get_posts',
          accessToken,
          memberId,
        }
      });

      if (postsError) throw postsError;

      const rawPosts = postsData.posts || [];
      const postsWithStats: LinkedInPostWithStats[] = [];
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;

      // Fetch stats for each post
      for (const post of rawPosts.slice(0, 10)) { // Limit to 10 most recent
        try {
          const { data: statsData } = await supabase.functions.invoke('linkedin-post', {
            body: {
              action: 'get_post_stats',
              accessToken,
              postId: post.id,
            }
          });

          const stats = statsData?.stats || { likes: 0, comments: 0, shares: 0 };
          
          postsWithStats.push({
            id: post.id,
            text: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
            createdAt: post.created?.time ? new Date(post.created.time).toISOString() : new Date().toISOString(),
            stats,
          });

          totalLikes += stats.likes;
          totalComments += stats.comments;
          totalShares += stats.shares;
        } catch (err) {
          console.error('Error fetching stats for post:', post.id, err);
        }
      }

      setPosts(postsWithStats);
      setTotalStats({
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        views: totalLikes * 15, // Rough estimate: 15 views per like
      });

    } catch (error) {
      console.error('Error fetching LinkedIn posts:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les statistiques LinkedIn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    posts,
    totalStats,
    loading,
    fetchLinkedInPosts,
  };
}
