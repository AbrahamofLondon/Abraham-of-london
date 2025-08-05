import { useEffect, useRef } from 'react';

const Comments = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = ref.current; // Capture ref.current in a variable
    if (!currentRef) return;

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('repo', 'abrahamadaramola/abrahamoflondon-comments');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'preferred-color-scheme'); // Use dynamic theme
    
    currentRef.appendChild(script);

    // Cleanup function to remove the script when the component unmounts
    return () => {
      const scriptElement = currentRef.querySelector('script');
      if (scriptElement) {
        currentRef.removeChild(scriptElement);
      }
    };
  }, []);

  return <div ref={ref} className="mt-16" />;
};

export default Comments;