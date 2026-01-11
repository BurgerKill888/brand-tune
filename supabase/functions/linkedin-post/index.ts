import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accessToken, memberId, content, postId } = await req.json();

    if (!accessToken) {
      throw new Error('Access token required');
    }

    switch (action) {
      case 'create_post': {
        // Create a new LinkedIn post
        console.log('Creating LinkedIn post for member:', memberId);

        const postData = {
          author: `urn:li:person:${memberId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: content.text
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        };

        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify(postData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Post creation failed:', response.status, errorText);
          
          if (response.status === 401) {
            return new Response(JSON.stringify({ error: 'Token expired' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          throw new Error(`Failed to create post: ${errorText}`);
        }

        const postResult = await response.json();
        console.log('Post created successfully:', postResult.id);

        return new Response(JSON.stringify({
          success: true,
          postId: postResult.id,
          message: 'Post publié sur LinkedIn avec succès !'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_posts': {
        // Get user's recent posts using the Posts API (v2)
        console.log('Fetching posts for member:', memberId);

        // Use the correct LinkedIn API format - authors must be URL encoded
        const authorUrn = encodeURIComponent(`urn:li:person:${memberId}`);
        const response = await fetch(
          `https://api.linkedin.com/v2/shares?q=owners&owners=${authorUrn}&count=10`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Fetch posts failed:', errorText);
          
          if (response.status === 401) {
            return new Response(JSON.stringify({ error: 'Token expired' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          throw new Error(`Failed to fetch posts: ${errorText}`);
        }

        const postsData = await response.json();
        console.log('Fetched', postsData.elements?.length || 0, 'posts');

        // Transform shares to a consistent format
        const posts = (postsData.elements || []).map((share: any) => ({
          id: share.activity || share.id,
          text: share.text?.text || '',
          created: { time: share.created?.time || Date.now() },
        }));

        return new Response(JSON.stringify({
          posts
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_post_stats': {
        // Get statistics for a specific post
        if (!postId) {
          throw new Error('Post ID required');
        }

        console.log('Fetching stats for post:', postId);

        const response = await fetch(
          `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postId)}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Fetch stats failed:', errorText);
          throw new Error(`Failed to fetch stats: ${errorText}`);
        }

        const statsData = await response.json();

        return new Response(JSON.stringify({
          stats: {
            likes: statsData.likesSummary?.totalLikes || 0,
            comments: statsData.commentsSummary?.totalFirstLevelComments || 0,
            shares: statsData.sharesSummary?.totalShares || 0,
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('LinkedIn post error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});