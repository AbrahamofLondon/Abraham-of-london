// Update in pages/shorts/[slug].tsx
const ShortPage: NextPage<ShortPageProps> = ({ short }) => {
  const MDXContent = useMDXComponent(short.body.code);
  const {
    likes,
    saves,
    userLiked,
    userSaved,
    loading,
    handleLike,
    handleSave,
  } = useShortInteractions(short.slug);

  // Debug logging
  React.useEffect(() => {
    console.log('Interaction state:', {
      likes,
      saves,
      userLiked,
      userSaved,
      loading,
      slug: short.slug,
    });
  }, [likes, saves, userLiked, userSaved, loading, short.slug]);

  const handleLikeWithLog = () => {
    console.log('Like clicked, current state:', { userLiked, loading });
    handleLike();
  };

  const handleSaveWithLog = () => {
    console.log('Save clicked, current state:', { userSaved, loading });
    handleSave();
  };

  // Then in your JSX, update the buttons:
  // onClick={handleLikeWithLog}
  // onClick={handleSaveWithLog}