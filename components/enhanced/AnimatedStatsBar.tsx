"use client";

import * as React from "react";
import { TrendingUp, Users, BookOpen, Target, Award, Globe } from "lucide-react";

interface StatItem {
  icon: React.ReactNode;
  value: string;
  label: string;
  suffix?: string;
}

export const AnimatedStatsBar: React.FC = () => {
  const [counts, setCounts] = React.useState({
    frameworks: 0,
    clients: 0,
    publications: 0,
    years: 0,
  });

  const stats: StatItem[] = [
    {
      icon: <Target className="h-5 w-5" />,
      value: counts.frameworks.toString(),
      label: "Strategic Frameworks",
      suffix: "+",
    },
    {
      icon: <Users className="h-5 w-5" />,
      value: counts.clients.toString(),
      label: "Institutional Clients",
      suffix: "+",
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      value: counts.publications.toString(),
      label: "Canon Volumes",
      suffix: "+",
    },
    {
      icon: <Award className="h-5 w-5" />,
      value: counts.years.toString(),
      label: "Years of Excellence",
      suffix: "",
    },
  ];

  React.useEffect(() => {
    const targetValues = {
      frameworks: 24,
      clients: 18,
      publications: 12,
      years: 8,
    };

    const duration = 2000;
    const frameRate = 60;
    const totalFrames = (duration / 1000) * frameRate;

    const animate = (
      key: keyof typeof targetValues,
      target: number,
      startTime: number
    ) => {
      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(easeOut * target);

        setCounts(prev => ({ ...prev, [key]: currentValue }));

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    };

    const startTime = performance.now();
    Object.entries(targetValues).forEach(([key, value]) => {
      animate(key as keyof typeof targetValues, value, startTime);
    });
  }, []);

  return (
    <div className="bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm dark:from-slate-900/80 dark:to-slate-950/80">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/50 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-amber-400/50 hover:bg-gradient-to-br hover:from-amber-50/50 hover:to-white/50 hover:shadow-xl dark:border-slate-800/50 dark:bg-slate-900/50 dark:hover:border-amber-500/30 dark:hover:from-amber-900/20 dark:hover:to-slate-900/50"
            >
              <div className="relative z-10">
                {/* Icon */}
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                  <div className="text-amber-500 dark:text-amber-400">
                    {stat.icon}
                  </div>
                </div>
                
                {/* Value */}
                <div className="mb-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stat.value}
                  </span>
                  {stat.suffix && (
                    <span className="text-lg font-semibold text-amber-500">
                      {stat.suffix}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <p className="text-sm font-medium text-slate-600 dark:text-gray-300">
                  {stat.label}
                </p>
              </div>
              
              {/* Hover effect */}
              <div className="absolute -bottom-4 -right-4 h-8 w-8 rounded-full bg-gradient-to-br from-amber-400/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimatedStatsBar;