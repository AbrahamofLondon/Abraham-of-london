// components/Comments.tsx
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
    script.setAttribute('theme', 'github-light'); // or 'github-dark', or 'preferred-color-scheme'

    ref.current.appendChild(script);
  }, []);

  return <div ref={ref} className="mt-16" />;
};

export default Comments;
