import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LinkedInProfile {
  id: string;
  name: string;
  email?: string;
  picture?: string;
}

interface LinkedInState {
  isConnected: boolean;
  profile: LinkedInProfile | null;
  accessToken: string | null;
  loading: boolean;
}

const LINKEDIN_STORAGE_KEY = 'linkedin_auth';

export function useLinkedIn() {
  const { toast } = useToast();
  const [state, setState] = useState<LinkedInState>({
    isConnected: false,
    profile: null,
    accessToken: null,
    loading: true,
  });

  // Load stored credentials on mount
  useEffect(() => {
    const stored = localStorage.getItem(LINKEDIN_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setState({
          isConnected: true,
          profile: data.profile,
          accessToken: data.accessToken,
          loading: false,
        });
        // Verify token is still valid
        verifyToken(data.accessToken);
      } catch {
        localStorage.removeItem(LINKEDIN_STORAGE_KEY);
        setState(prev => ({ ...prev, loading: false }));
      }
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-auth', {
        body: { action: 'get_profile', accessToken: token }
      });

      if (error || data?.error) {
        console.log('Token verification failed, clearing credentials');
        disconnect();
      }
    } catch (error) {
      console.error('Token verification error:', error);
    }
  };

  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const redirectUri = `${window.location.origin}/linkedin-callback`;
      
      const { data, error } = await supabase.functions.invoke('linkedin-auth', {
        body: { action: 'get_auth_url', redirectUri }
      });

      if (error) throw error;

      // Store state for verification
      sessionStorage.setItem('linkedin_oauth_state', data.state);
      sessionStorage.setItem('linkedin_redirect_uri', redirectUri);
      
      // Open LinkedIn auth in popup
      const width = 600;
      const height = 700;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      const popup = window.open(
        data.authUrl,
        'LinkedIn OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type !== 'linkedin_callback') return;

        window.removeEventListener('message', handleMessage);
        
        if (event.data.error) {
          toast({
            title: "Connexion échouée",
            description: event.data.error,
            variant: "destructive",
          });
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        // Exchange code for token
        try {
          const { data: tokenData, error: tokenError } = await supabase.functions.invoke('linkedin-auth', {
            body: { 
              action: 'exchange_code', 
              code: event.data.code,
              redirectUri: sessionStorage.getItem('linkedin_redirect_uri')
            }
          });

          if (tokenError) throw tokenError;

          // Store credentials
          const authData = {
            accessToken: tokenData.accessToken,
            profile: tokenData.profile,
            expiresAt: Date.now() + (tokenData.expiresIn * 1000)
          };
          
          localStorage.setItem(LINKEDIN_STORAGE_KEY, JSON.stringify(authData));
          
          setState({
            isConnected: true,
            profile: tokenData.profile,
            accessToken: tokenData.accessToken,
            loading: false,
          });

          toast({
            title: "LinkedIn connecté ! 🎉",
            description: `Bienvenue ${tokenData.profile.name}`,
          });

        } catch (err) {
          console.error('Token exchange error:', err);
          toast({
            title: "Erreur de connexion",
            description: "Impossible de finaliser la connexion LinkedIn",
            variant: "destructive",
          });
          setState(prev => ({ ...prev, loading: false }));
        }
      };

      window.addEventListener('message', handleMessage);

      // Cleanup if popup is closed without completing
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setState(prev => ({ ...prev, loading: false }));
        }
      }, 1000);

    } catch (error) {
      console.error('LinkedIn connect error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la connexion LinkedIn",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    localStorage.removeItem(LINKEDIN_STORAGE_KEY);
    setState({
      isConnected: false,
      profile: null,
      accessToken: null,
      loading: false,
    });
    toast({
      title: "LinkedIn déconnecté",
      description: "Votre compte LinkedIn a été déconnecté",
    });
  }, [toast]);

  const publishPost = useCallback(async (content: string) => {
    if (!state.accessToken || !state.profile) {
      toast({
        title: "Non connecté",
        description: "Veuillez d'abord connecter votre compte LinkedIn",
        variant: "destructive",
      });
      return { success: false, error: 'Not connected' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('linkedin-post', {
        body: {
          action: 'create_post',
          accessToken: state.accessToken,
          memberId: state.profile.id,
          content: { text: content }
        }
      });

      if (error) throw error;
      
      if (data.error === 'Token expired') {
        disconnect();
        return { success: false, error: 'Token expired' };
      }

      toast({
        title: "Post publié ! 🚀",
        description: "Votre post est maintenant visible sur LinkedIn",
      });

      return { success: true, postId: data.postId };

    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: "Erreur de publication",
        description: "Impossible de publier sur LinkedIn",
        variant: "destructive",
      });
      return { success: false, error: 'Publish failed' };
    }
  }, [state.accessToken, state.profile, toast, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    publishPost,
  };
}