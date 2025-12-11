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

  // Generate a persistent anonymous ID using localStorage
  const getUserId = React.useCallback(() => {
    // Try to get or create anonymous ID
    if (typeof window === 'undefined') return 'server';
    
    let anonId = localStorage.getItem('anon_id');
    if (!anonId) {
      anonId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('anon_id', anonId);
    }
    return anonId;
  }, []);

  // Fetch initial interaction data
  React.useEffect(() => {
    // Fetch counts from API
    fetch(`/api/shorts/${slug}/interact`)
      .then(res => res.json())
      .then(data => {
        setState(prev => ({
          ...prev,
          likes: data.likes || 0,
          saves: data.saves || 0,
        }));
      })
      .catch(console.error);
    
    // Check user's previous interactions from localStorage
    if (typeof window !== 'undefined') {
      const userLiked = localStorage.getItem(`short_${slug}_liked`) === 'true';
      const userSaved = localStorage.getItem(`short_${slug}_saved`) === 'true';
      
      setState(prev => ({
        ...prev,
        userLiked,
        userSaved,
      }));
    }
  }, [slug]);

  const handleInteraction = React.useCallback(async (action: 'like' | 'save') => {
    setLoading(true);
    try {
      const userId = getUserId();
      const response = await fetch(`/api/shorts/${slug}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setState(prev => ({
          ...prev,
          [action]: data[action],
          [`user${action.charAt(0).toUpperCase() + action.slice(1)}`]: data.action === 'added',
        }));
        
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            `short_${slug}_${action}ed`,
            data.action === 'added' ? 'true' : 'false'
          );
        }
      }
    } catch (error) {
      console.error('Interaction failed:', error);
      // Fallback to optimistic update with localStorage
      setState(prev => {
        const newState = {
          ...prev,
          [action]: prev[action] + (prev[`user${action.charAt(0).toUpperCase() + action.slice(1)}`] ? -1 : 1),
          [`user${action.charAt(0).toUpperCase() + action.slice(1)}`]: !prev[`user${action.charAt(0).toUpperCase() + action.slice(1)}`],
        };
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            `short_${slug}_${action}ed`,
            newState[`user${action.charAt(0).toUpperCase() + action.slice(1)}`] ? 'true' : 'false'
          );
        }
        
        return newState;
      });
    } finally {
      setLoading(false);
    }
  }, [slug, getUserId]);

  return {
    ...state,
    loading,
    handleLike: () => handleInteraction('like'),
    handleSave: () => handleInteraction('save'),
  };
}