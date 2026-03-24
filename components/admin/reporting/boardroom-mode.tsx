'use client';

import React, { useState, useEffect } from 'react';
import { DrillDownMatrix } from './drill-down-matrix';
import { FragilityHeatmap } from './fragility-heatmap';
import { Maximize2, Minimize2, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

interface BoardroomModeProps {
  globalData: any;
  teamSnapshots: any[];
}

export function BoardroomMode({ globalData, teamSnapshots }: BoardroomModeProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const slides = [
    {
      title: "Institutional Baseline",
      subtitle: "Strategic Resonance",
      content: <DrillDownMatrix globalData={globalData} teamSnapshots={teamSnapshots} />
    },
    {
      title: "Structural Fragility",
      subtitle: "Dissonance Mapping",
      content: <FragilityHeatmap teams={teamSnapshots} />
    }
  ];

  return (
    <div className={`transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-8 overflow-auto' : 'relative'}`}>
      
      {/* Command Bar */}
      <div className={`flex justify-between items-center mb-10 pb-5 ${isFullscreen ? 'border-b border-neutral-100' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 flex items-center justify-center">
            <Shield className="w-4 h-4 text-neutral-400" />
          </div>
          <div>
            <p className="text-[8px] font-mono uppercase tracking-wider text-neutral-400">Briefing</p>
            <h2 className="text-sm font-medium text-neutral-700">{slides[activeSlide].title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
              className="p-1.5 hover:bg-neutral-100 transition-colors rounded"
              disabled={activeSlide === 0}
            >
              <ChevronLeft className="w-4 h-4 text-neutral-500" />
            </button>
            <span className="text-[9px] font-mono text-neutral-400 w-8 text-center">{activeSlide + 1}/{slides.length}</span>
            <button 
              onClick={() => setActiveSlide(prev => Math.min(slides.length - 1, prev + 1))}
              className="p-1.5 hover:bg-neutral-100 transition-colors rounded"
              disabled={activeSlide === slides.length - 1}
            >
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>
          </div>
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-1.5 border border-neutral-200 text-[8px] font-mono uppercase tracking-wider text-neutral-500 hover:bg-neutral-50 transition-colors rounded"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            {isFullscreen ? "Exit" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* Presentation Content */}
      <div className={isFullscreen ? '' : 'opacity-60 pointer-events-none'}>
        <div className="mb-8">
          <p className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 mb-2">Focus</p>
          <h1 className="text-2xl font-light tracking-tight text-neutral-800">
            {slides[activeSlide].subtitle}
          </h1>
        </div>

        <div className={isFullscreen ? 'mt-8' : ''}>
          {slides[activeSlide].content}
        </div>
      </div>

      {/* Footer Telemetry */}
      {isFullscreen && (
        <div className="mt-12 pt-6 border-t border-neutral-100 flex justify-between items-center">
          <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-400">
            Live Data Stream
          </span>
          <span className="text-[7px] font-mono text-neutral-300">
            {new Date().toISOString().slice(0, 19).replace('T', ' ')}
          </span>
        </div>
      )}
    </div>
  );
}