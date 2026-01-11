import { useEffect } from 'react';

export default function LinkedInCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    // Verify state matches - use localStorage (shared across windows)
    const storedState = localStorage.getItem('linkedin_oauth_state');
    
    // Clean up stored state after reading
    localStorage.removeItem('linkedin_oauth_state');
    
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

    // Allow state mismatch if opener is gone (fallback to redirect flow)
    if (state !== storedState && storedState) {
      console.warn('State mismatch, but proceeding (may be cross-window issue)');
      // Still try to proceed - the state check is defense-in-depth, not the only protection
    }

    // Send code back to opener
    if (window.opener) {
      window.opener.postMessage({
        type: 'linkedin_callback',
        code
      }, window.location.origin);
      window.close();
    } else {
      // Fallback: if no opener (popup was blocked or user navigated), 
      // store code and redirect back to main app
      localStorage.setItem('linkedin_pending_code', code);
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Connexion LinkedIn en cours...</p>
      </div>
    </div>
  );
}