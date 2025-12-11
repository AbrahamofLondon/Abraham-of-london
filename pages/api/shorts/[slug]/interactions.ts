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

  // Load initial interactions
  React.useEffect(() => {
    setMounted(true);
    
    const loadInteractions = async () => {
      try {
        // First try to load from localStorage
        const loadFromLocalStorage = () => {
          if (typeof window === 'undefined') return null;
          
          try {
            const userLiked = localStorage.getItem(`short_${slug}_liked`) === 'true';
            const userSaved = localStorage.getItem(`short_${slug}_saved`) === 'true';
            const savedLikes = localStorage.getItem(`short_${slug}_likes_count`);
            const savedSaves = localStorage.getItem(`short_${slug}_saves_count`);
            
            return {
              likes: savedLikes ? parseInt(savedLikes, 10) : null,
              saves: savedSaves ? parseInt(savedSaves, 10) : null,
              userLiked,
              userSaved,
            };
          } catch {
            return null;
          }
        };

        const localStorageData = loadFromLocalStorage();
        
        // Try to fetch from API
        const response = await fetch(`/api/shorts/${slug}/interactions`);
        if (response.ok) {
          const data = await response.json();
          
          // Use localStorage values if they exist, otherwise use API values
          setState({
            likes: localStorageData?.likes ?? data.likes ?? 25,
            saves: localStorageData?.saves ?? data.saves ?? 12,
            userLiked: localStorageData?.userLiked ?? data.userLiked ?? false,
            userSaved: localStorageData?.userSaved ?? data.userSaved ?? false,
          });
        } else {
          // Fallback to localStorage or defaults
          setState({
            likes: localStorageData?.likes ?? 25,
            saves: localStorageData?.saves ?? 12,
            userLiked: localStorageData?.userLiked ?? false,
            userSaved: localStorageData?.userSaved ?? false,
          });
        }
      } catch (error) {
        console.error('Failed to load interactions:', error);
        // Use defaults
        setState({
          likes: 25,
          saves: 12,
          userLiked: false,
          userSaved: false,
        });
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

      const data = await response.json();
      
      // Update with server response
      setState({
        likes: data.likes || state.likes + (wasInteracted ? -1 : 1),
        saves: data.saves || state.saves,
        userLiked: data.userLiked !== undefined ? data.userLiked : !wasInteracted,
        userSaved: data.userSaved !== undefined ? data.userSaved : state.userSaved,
      });

      // Persist in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`short_${slug}_${action}ed`, (!wasInteracted).toString());
        localStorage.setItem(`short_${slug}_${action}s_count`, 
          String(data.likes || state.likes + (wasInteracted ? -1 : 1)));
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