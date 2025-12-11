// hooks/useShortInteractions.ts
import * as React from 'react';

interface InteractionState {
  likes: number;
  saves: number;
  userLiked: boolean;
  userSaved: boolean;
}

interface ApiInteractionStats {
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

  // Load initial interactions
  React.useEffect(() => {
    setMounted(true);
    
    const loadInteractions = async () => {
      try {
        const response = await fetch(`/api/shorts/${slug}/interactions`);
        if (response.ok) {
          const data: ApiInteractionStats = await response.json();
          setState({
            likes: data.likes || 0,
            saves: data.saves || 0,
            userLiked: data.userLiked || false,
            userSaved: data.userSaved || false,
          });
        }
      } catch (error) {
        console.error('Failed to load interactions:', error);
        // Fallback to localStorage
        fallbackToLocalStorage();
      }
    };

    const fallbackToLocalStorage = () => {
      if (typeof window === 'undefined') return;
      
      try {
        const userLiked = localStorage.getItem(`short_${slug}_liked`) === 'true';
        const userSaved = localStorage.getItem(`short_${slug}_saved`) === 'true';
        const savedLikes = localStorage.getItem(`short_${slug}_likes_count`);
        const savedSaves = localStorage.getItem(`short_${slug}_saves_count`);
        
        setState({
          likes: savedLikes ? parseInt(savedLikes, 10) : Math.floor(Math.random() * 50) + 10,
          saves: savedSaves ? parseInt(savedSaves, 10) : Math.floor(Math.random() * 30) + 5,
          userLiked,
          userSaved,
        });
      } catch (localStorageError) {
        console.error('LocalStorage fallback failed:', localStorageError);
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
        throw new Error(`Failed to ${action}`);
      }

      const data: ApiInteractionStats = await response.json();
      
      // Update with server response
      setState({
        likes: data.likes || 0,
        saves: data.saves || 0,
        userLiked: data.userLiked || false,
        userSaved: data.userSaved || false,
      });

      // Also persist in localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem(`short_${slug}_${action}ed`, (!wasInteracted).toString());
        localStorage.setItem(`short_${slug}_${action}s_count`, 
          String(action === 'like' ? data.likes : data.saves));
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