// components/AnimatedCounter.tsx
import * as React from "react";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  className?: string;
  suffix?: string;
  onComplete?: () => void;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  duration = 2,
  className = "",
  suffix = "+",
  onComplete,
}) => {
  const [count, setCount] = React.useState(0);
  const frameRef = React.useRef<number>();
  const startTimeRef = React.useRef<number>();
  const completedRef = React.useRef(false);

  React.useEffect(() => {
    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      // Ease out function for smooth animation
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOut(progress);

      setCount(Math.floor(easedProgress * end));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, onComplete]);

  return (
    <span className={`font-mono ${className}`}>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

export default AnimatedCounter;