// hooks/useShortInteractions.ts
import * as React from 'react';

interface InteractionState {
  likes: number;
  saves: number;
  userLiked: boolean;
  userSaved: boolean;
}

export function useShortInteractions(slug: string) {
  const [state, setState] = React.useState<InteractionState>({
    likes: 0,
    saves: 0,
    userLiked: false,
    userSaved: false,
  });
  const [loading, setLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [sessionReady, setSessionReady] = React.useState(false);

  // Initialize session on mount
  React.useEffect(() => {
    setMounted(true);
    // The session cookie will be set when we first call the API
    setSessionReady(true);
  }, []);

  // Load initial interactions
  React.useEffect(() => {
    if (!mounted || !sessionReady) return;
    
    const loadInteractions = async () => {
      try {
        const response = await fetch(`/api/shorts/${slug}/interactions`, {
          credentials: 'include', // Important for cookies
        });
        
        if (response.ok) {
          const data = await response.json();
          setState({
            likes: data.likes || 0,
            saves: data.saves || 0,
            userLiked: data.userLiked || false,
            userSaved: data.userSaved || false,
          });
        } else {
          console.warn('Failed to load interactions from API');
        }
      } catch (error) {
        console.error('Failed to load interactions:', error);
      }
    };

    loadInteractions();
  }, [slug, mounted, sessionReady]);

  const handleInteraction = async (action: 'like' | 'save') => {
    if (!mounted || !sessionReady || loading) return;
    
    setLoading(true);
    
    // Optimistic update
    const wasInteracted = action === 'like' ? state.userLiked : state.userSaved;
    
    setState(prev => ({
      ...prev,
      [action === 'like' ? 'likes' : 'saves']: 
        prev[action === 'like' ? 'likes' : 'saves'] + (wasInteracted ? -1 : 1),
      [action === 'like' ? 'userLiked' : 'userSaved']: !wasInteracted,
    }));

    try {
      const method = wasInteracted ? 'DELETE' : 'POST';
      const response = await fetch(`/api/shorts/${slug}/${action}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${action}`);
      }

      const data = await response.json();
      
      // Update with server response
      setState({
        likes: data.likes || 0,
        saves: data.saves || 0,
        userLiked: data.userLiked || false,
        userSaved: data.userSaved || false,
      });

      // Also persist in localStorage as backup
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`short_${slug}_${action}ed`, (!wasInteracted).toString());
          localStorage.setItem(`short_${slug}_${action}s_count`, 
            String(data.likes || data.saves || 0));
        } catch (localStorageError) {
          console.warn('LocalStorage backup failed:', localStorageError);
        }
      }
      
    } catch (error) {
      console.error(`${action} action failed:`, error);
      
      // Revert optimistic update on error
      setState(prev => ({
        ...prev,
        [action === 'like' ? 'likes' : 'saves']: 
          prev[action === 'like' ? 'likes' : 'saves'] + (wasInteracted ? 1 : -1),
        [action === 'like' ? 'userLiked' : 'userSaved']: wasInteracted,
      }));
      
      // Show error message to user
      alert(error instanceof Error ? error.message : `Failed to ${action}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return {
    ...state,
    loading,
    handleLike: () => handleInteraction('like'),
    handleSave: () => handleInteraction('save'),
  };
}

