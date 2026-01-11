import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LINKEDIN_CLIENT_ID = Deno.env.get('LINKEDIN_CLIENT_ID');
const LINKEDIN_CLIENT_SECRET = Deno.env.get('LINKEDIN_CLIENT_SECRET');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, redirectUri, accessToken } = await req.json();

    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
      throw new Error('LinkedIn credentials not configured');
    }

    switch (action) {
      case 'get_auth_url': {
        // Generate OAuth authorization URL
        const scopes = ['openid', 'profile', 'email', 'w_member_social'].join(' ');
        const state = crypto.randomUUID();
        
        const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', LINKEDIN_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('scope', scopes);

        console.log('Generated LinkedIn auth URL');
        
        return new Response(JSON.stringify({ 
          authUrl: authUrl.toString(),
          state 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'exchange_code': {
        // Exchange authorization code for access token
        console.log('Exchanging code for access token');
        
        const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: LINKEDIN_CLIENT_ID,
            client_secret: LINKEDIN_CLIENT_SECRET,
          }),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Token exchange failed:', errorText);
          throw new Error(`Failed to exchange code: ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('Token exchange successful');

        // Get user profile to get the member URN
        const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        if (!profileResponse.ok) {
          const errorText = await profileResponse.text();
          console.error('Profile fetch failed:', errorText);
          throw new Error(`Failed to get profile: ${errorText}`);
        }

        const profileData = await profileResponse.json();
        console.log('Profile fetched:', profileData.name);

        return new Response(JSON.stringify({
          accessToken: tokenData.access_token,
          expiresIn: tokenData.expires_in,
          profile: {
            id: profileData.sub,
            name: profileData.name,
            email: profileData.email,
            picture: profileData.picture,
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_profile': {
        // Get LinkedIn profile with existing access token
        if (!accessToken) {
          throw new Error('Access token required');
        }

        const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!profileResponse.ok) {
          if (profileResponse.status === 401) {
            return new Response(JSON.stringify({ error: 'Token expired' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          throw new Error('Failed to get profile');
        }

        const profileData = await profileResponse.json();

        return new Response(JSON.stringify({
          profile: {
            id: profileData.sub,
            name: profileData.name,
            email: profileData.email,
            picture: profileData.picture,
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('LinkedIn auth error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});