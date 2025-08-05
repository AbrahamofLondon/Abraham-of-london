import { useEffect, useRef } from 'react';

const Comments = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('repo', 'abrahamadaramola/abrahamoflondon-comments');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'preferred-color-scheme'); // Use dynamic theme
    
    ref.current.appendChild(script);

    // Cleanup function to remove the script when the component unmounts
    return () => {
      const scriptElement = ref.current?.querySelector('script');
      if (scriptElement) {
        ref.current?.removeChild(scriptElement);
      }
    };
  }, []);

  return <div ref={ref} className="mt-16" />;
};

export default Comments;