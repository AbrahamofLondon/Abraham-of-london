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

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const userLiked = localStorage.getItem(`short_${slug}_liked`) === 'true';
    const userSaved = localStorage.getItem(`short_${slug}_saved`) === 'true';
    
    setState(prev => ({
      ...prev,
      likes: prev.likes || Math.floor(Math.random() * 50) + 10,
      saves: prev.saves || Math.floor(Math.random() * 30) + 5,
      userLiked,
      userSaved,
    }));
  }, [slug]);

  const handleInteraction = (action: 'like' | 'save') => {
    setLoading(true);
    
    setTimeout(() => {
      const isLiked = action === 'like';
      const wasInteracted = isLiked ? state.userLiked : state.userSaved;
      
      setState(prev => {
        const newCount = prev[isLiked ? 'likes' : 'saves'] + (wasInteracted ? -1 : 1);
        const newState = {
          ...prev,
          [isLiked ? 'likes' : 'saves']: Math.max(0, newCount),
          [isLiked ? 'userLiked' : 'userSaved']: !wasInteracted,
        };
        
        localStorage.setItem(`short_${slug}_${action}ed`, (!wasInteracted).toString());
        localStorage.setItem(`short_${slug}_${action}s_count`, newCount.toString());
        
        return newState;
      });
      
      setLoading(false);
    }, 300);
  };

  return {
    ...state,
    loading,
    handleLike: () => handleInteraction('like'),
    handleSave: () => handleInteraction('save'),
  };
}