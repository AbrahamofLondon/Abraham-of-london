'use client';

import React, { useState } from 'react';
import { safeCapitalize } from "@/lib/utils/safe";
import { ChevronDown, Clock, User, Zap } from 'lucide-react';

interface Session {
  id: string;
  time: string;
  title: string;
  description: string;
  speaker?: string;
  speakerTitle?: string;
  track?: string;
  type: 'keynote' | 'workshop' | 'breakout' | 'networking' | 'break';
}

interface DaySchedule {
  date: string;
  day: string;
  sessions: Session[];
}

interface EventScheduleProps {
  schedule: DaySchedule[];
}

const EventSchedule: React.FC<EventScheduleProps> = ({ schedule }) => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const currentDay = schedule[selectedDay];

  if (!currentDay) {
    return (
      <div className="bg-zinc-950 border border-white/10 p-12 text-center">
        <p className="text-zinc-500 font-serif italic">The schedule is currently undergoing verification.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 border border-white/10 overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-serif italic text-white">Event Agenda</h2>
          <p className="text-xs text-zinc-500 uppercase tracking-[0.3em] font-bold mt-1">Chronological Intel</p>
        </div>
        
        <div className="flex gap-2">
          {schedule.map((day, index) => (
            <button
              key={day.date}
              onClick={() => setSelectedDay(index)}
              className={`px-6 py-3 transition-all duration-300 border ${
                selectedDay === index
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-900 text-zinc-400 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-widest">{day.day}</div>
              <div className="text-xs font-mono opacity-60">{day.date}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {currentDay.sessions.map((session) => (
          <div
            key={session.id}
            className={`group transition-all duration-500 ${
              expandedSession === session.id ? 'bg-zinc-900/40' : 'hover:bg-zinc-900/20'
            }`}
          >
            <div 
              className="p-6 md:p-8 flex flex-col md:flex-row gap-6 cursor-pointer"
              onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
            >
              <div className="md:w-32 flex-shrink-0">
                <div className="flex items-center gap-2 text-amber-500 font-mono text-sm font-bold">
                  <Clock className="w-3 h-3" />
                  {session.time}
                </div>
                <div className={`mt-2 inline-block px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border ${
                  session.type === 'keynote' ? 'border-amber-500 text-amber-500' : 'border-zinc-700 text-zinc-500'
                }`}>
                  {safeCapitalize(session.type)}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-serif text-white group-hover:text-amber-500 transition-colors">
                      {session.title}
                    </h3>
                    {session.speaker && (
                      <div className="mt-2 flex items-center gap-2 text-zinc-400">
                        <User className="w-3.5 h-3.5 text-zinc-600" />
                        <span className="text-sm font-medium">{session.speaker}</span>
                        {session.speakerTitle && (
                          <span className="text-xs text-zinc-600 font-light">— {session.speakerTitle}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 text-zinc-700 transition-transform duration-500 ${
                    expandedSession === session.id ? 'rotate-180 text-amber-500' : ''
                  }`} />
                </div>
              </div>
            </div>
            
            {expandedSession === session.id && (
              <div className="px-6 pb-8 md:pl-44 md:pr-24">
                <div className="h-px bg-white/5 mb-6" />
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-zinc-400 leading-relaxed font-light italic">
                    {session.description}
                  </p>
                </div>
                {session.track && (
                  <div className="mt-6 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Track: {session.track}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventSchedule;