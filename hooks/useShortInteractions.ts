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

  // Generate a persistent anonymous ID
  const getUserId = React.useCallback(() => {
    if (session?.user?.id) return session.user.id;
    
    // Try to get or create anonymous ID
    let anonId = localStorage.getItem('anon_id');
    if (!anonId) {
      anonId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('anon_id', anonId);
    }
    return anonId;
  }, [session]);

  // Fetch initial interaction data
  React.useEffect(() => {
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
    
    // Check user's previous interactions
    const userId = getUserId();
    const checkUserInteractions = async () => {
      const [liked, saved] = await Promise.all([
        fetch(`/api/shorts/${slug}/interact/check?userId=${userId}&action=like`),
        fetch(`/api/shorts/${slug}/interact/check?userId=${userId}&action=save`)
      ]);
      
      const likedData = await liked.json();
      const savedData = await saved.json();
      
      setState(prev => ({
        ...prev,
        userLiked: likedData.hasInteracted || false,
        userSaved: savedData.hasInteracted || false,
      }));
    };
    
    checkUserInteractions();
  }, [slug, getUserId]);

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
        setState(prev => ({
          ...prev,
          [action]: data[action],
          [`user${action.charAt(0).toUpperCase() + action.slice(1)}`]: data.action === 'added',
        }));
      }
    } catch (error) {
      console.error('Interaction failed:', error);
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