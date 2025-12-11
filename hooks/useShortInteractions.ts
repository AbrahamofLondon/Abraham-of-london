// hooks/useShortInteractions.ts
import * as React from "react";

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
          if (typeof window === "undefined") return null;

          try {
            const userLiked =
              localStorage.getItem(`short_${slug}_liked`) === "true";
            const userSaved =
              localStorage.getItem(`short_${slug}_saved`) === "true";
            const savedLikes = localStorage.getItem(
              `short_${slug}_likes_count`
            );
            const savedSaves = localStorage.getItem(
              `short_${slug}_saves_count`
            );

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

        const response = await fetch(`/api/shorts/${slug}/interactions`);
        if (response.ok) {
          const data = await response.json();

          setState({
            likes: localStorageData?.likes ?? data.likes ?? 25,
            saves: localStorageData?.saves ?? data.saves ?? 12,
            userLiked:
              localStorageData?.userLiked ?? data.userLiked ?? false,
            userSaved:
              localStorageData?.userSaved ?? data.userSaved ?? false,
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
        console.error("Failed to load interactions:", error);
        setState({
          likes: 25,
          saves: 12,
          userLiked: false,
          userSaved: false,
        });
      }
    };

    void loadInteractions();
  }, [slug]);

  const handleInteraction = async (action: "like" | "save") => {
    if (!mounted || loading) return;

    setLoading(true);

    const wasInteracted =
      action === "like" ? state.userLiked : state.userSaved;

    // optimistic update
    setState((prev) => ({
      ...prev,
      [action === "like" ? "likes" : "saves"]:
        prev[action === "like" ? "likes" : "saves"] +
        (wasInteracted ? -1 : 1),
      [action === "like" ? "userLiked" : "userSaved"]: !wasInteracted,
    }));

    try {
      const method = wasInteracted ? "DELETE" : "POST";
      const response = await fetch(`/api/shorts/${slug}/${action}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action}`);
      }

      const data = await response.json();

      const nextLikes =
        typeof data.likes === "number"
          ? data.likes
          : state.likes + (action === "like" ? (wasInteracted ? -1 : 1) : 0);
      const nextSaves =
        typeof data.saves === "number"
          ? data.saves
          : state.saves + (action === "save" ? (wasInteracted ? -1 : 1) : 0);

      const nextUserLiked =
        typeof data.userLiked === "boolean"
          ? data.userLiked
          : action === "like"
          ? !wasInteracted
          : state.userLiked;
      const nextUserSaved =
        typeof data.userSaved === "boolean"
          ? data.userSaved
          : action === "save"
          ? !wasInteracted
          : state.userSaved;

      setState({
        likes: nextLikes,
        saves: nextSaves,
        userLiked: nextUserLiked,
        userSaved: nextUserSaved,
      });

      // Persist in localStorage (browser only)
      if (typeof window !== "undefined") {
        if (action === "like") {
          localStorage.setItem(
            `short_${slug}_liked`,
            nextUserLiked.toString()
          );
          localStorage.setItem(
            `short_${slug}_likes_count`,
            String(nextLikes)
          );
        } else {
          localStorage.setItem(
            `short_${slug}_saved`,
            nextUserSaved.toString()
          );
          localStorage.setItem(
            `short_${slug}_saves_count`,
            String(nextSaves)
          );
        }
      }
    } catch (error) {
      console.error(`${action} action failed:`, error);
      // revert optimistic update
      setState((prev) => ({
        ...prev,
        [action === "like" ? "likes" : "saves"]:
          prev[action === "like" ? "likes" : "saves"] +
          (wasInteracted ? 1 : -1),
        [action === "like" ? "userLiked" : "userSaved"]: wasInteracted,
      }));
    } finally {
      setLoading(false);
    }
  };

  return {
    ...state,
    loading,
    handleLike: () => handleInteraction("like"),
    handleSave: () => handleInteraction("save"),
  };
}