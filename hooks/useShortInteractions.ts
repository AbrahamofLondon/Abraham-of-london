// hooks/useShortInteractions.ts
import * as React from 'react';
import { useSession } from 'next-auth/react';

interface InteractionState {
  likes: number;
  saves: number;
  isAuthenticated: boolean;
  userLiked?: boolean;
  userSaved?: boolean;
}

export function useShortInteractions(slug: string) {
  const { data: session, status } = useSession();
  const [state, setState] = React.useState<InteractionState>({
    likes: 0,
    saves: 0,
    isAuthenticated: false,
  });
  const [loading, setLoading] = React.useState(false);
  const [userInteractions, setUserInteractions] = React.useState<{
    liked: boolean;
    saved: boolean;
  }>({ liked: false, saved: false });

  // Fetch initial counts
  React.useEffect(() => {
    fetch(`/api/shorts/${slug}/interact`)
      .then(res => res.json())
      .then(data => {
        setState({
          likes: data.likes || 0,
          saves: data.saves || 0,
          isAuthenticated: data.isAuthenticated || false,
        });
      })
      .catch(console.error);
  }, [slug]);

  // Check localStorage for user's interactions (anonymous)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const liked = localStorage.getItem(`short_${slug}_liked`) === 'true';
      const saved = localStorage.getItem(`short_${slug}_saved`) === 'true';
      setUserInteractions({ liked, saved });
    }
  }, [slug]);

  const handleInteraction = async (action: 'like' | 'save') => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/shorts/${slug}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          likes: data.likes || prev.likes,
          saves: data.saves || prev.saves,
          isAuthenticated: data.isAuthenticated || prev.isAuthenticated,
        }));

        // Update user interaction state
        const isActionAdded = data.action === 'added';
        if (action === 'like') {
          setUserInteractions(prev => ({ ...prev, liked: isActionAdded }));
          localStorage.setItem(`short_${slug}_liked`, isActionAdded.toString());
        } else {
          setUserInteractions(prev => ({ ...prev, saved: isActionAdded }));
          localStorage.setItem(`short_${slug}_saved`, isActionAdded.toString());
        }
      }
    } catch (error) {
      console.error('Interaction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    ...state,
    userLiked: userInteractions.liked,
    userSaved: userInteractions.saved,
    loading,
    sessionStatus: status,
    handleLike: () => handleInteraction('like'),
    handleSave: () => handleInteraction('save'),
  };
}