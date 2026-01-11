import { useEffect } from 'react';

export default function LinkedInCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    // Verify state matches
    const storedState = sessionStorage.getItem('linkedin_oauth_state');
    
    if (error) {
      window.opener?.postMessage({
        type: 'linkedin_callback',
        error: errorDescription || error
      }, window.location.origin);
      window.close();
      return;
    }

    if (!code) {
      window.opener?.postMessage({
        type: 'linkedin_callback',
        error: 'No authorization code received'
      }, window.location.origin);
      window.close();
      return;
    }

    if (state !== storedState) {
      window.opener?.postMessage({
        type: 'linkedin_callback',
        error: 'State mismatch - possible CSRF attack'
      }, window.location.origin);
      window.close();
      return;
    }

    // Send code back to opener
    window.opener?.postMessage({
      type: 'linkedin_callback',
      code
    }, window.location.origin);

    window.close();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  );
}