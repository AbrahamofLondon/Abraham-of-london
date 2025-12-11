// hooks/useShortInteractions.ts
import * as React from 'react';
import { useSession } from 'next-auth/react';

interface InteractionState {
  likes: number;
  saves: number;
  userLiked: boolean;
  userSaved: boolean;
}

export function useShortInteractions(slug: string) {
  const { data: session } = useSession();
  const [state, setState] = React.useState<InteractionState>({
    likes: 0,
    saves: 0,
    userLiked: false,
    userSaved: false,
  });
  const [loading, setLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Load initial interactions
  React.useEffect(() => {
    setMounted(true);
    
    const loadInteractions = async () => {
      try {
        const response = await fetch(`/api/shorts/${slug}/interactions`);
        if (response.ok) {
          const data = await response.json();
          setState({
            likes: data.likes || 0,
            saves: data.saves || 0,
            userLiked: data.userLiked || false,
            userSaved: data.userSaved || false,
          });
        }
      } catch (error) {
        console.error('Failed to load interactions:', error);
        // Fallback to localStorage for offline/error state
        const userLiked = localStorage.getItem(`short_${slug}_liked`) === 'true';
        const userSaved = localStorage.getItem(`short_${slug}_saved`) === 'true';
        setState(prev => ({
          ...prev,
          userLiked,
          userSaved,
        }));
      }
    };

    loadInteractions();
  }, [slug]);

  const handleInteraction = async (action: 'like' | 'save') => {
    if (!mounted || loading) return;
    
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
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${action}`);
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
      localStorage.setItem(`short_${slug}_${action}ed`, (!wasInteracted).toString());
      
    } catch (error) {
      console.error(`${action} action failed:`, error);
      
      // Revert optimistic update on error
      setState(prev => ({
        ...prev,
        [action === 'like' ? 'likes' : 'saves']: 
          prev[action === 'like' ? 'likes' : 'saves'] + (wasInteracted ? 1 : -1),
        [action === 'like' ? 'userLiked' : 'userSaved']: wasInteracted,
      }));
      
      // Show error to user (optional)
      alert(`Failed to ${action}. Please try again.`);
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