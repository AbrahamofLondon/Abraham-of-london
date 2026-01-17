'use client';

import React, { useState } from 'react';

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

  // Guard clause for empty schedule
  if (!currentDay) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Schedule</h2>
        <p className="text-gray-600">No schedule available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Event Schedule</h2>
          <p className="text-gray-600">Plan your experience</p>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto">
          {schedule.map((day, index) => (
            <button
              key={day.date}
              onClick={() => setSelectedDay(index)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedDay === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {day.day}
              <div className="text-xs mt-1 opacity-80">{day.date}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {currentDay.sessions.map((session) => (
          <div
            key={session.id}
            className={`border-l-4 rounded-r-lg p-4 transition-all ${
              session.type === 'keynote'
                ? 'border-purple-500 bg-purple-50'
                : session.type === 'workshop'
                ? 'border-green-500 bg-green-50'
                : session.type === 'break'
                ? 'border-gray-400 bg-gray-50'
                : 'border-blue-500 bg-blue-50'
            }`}
          >
            <div 
              className="flex flex-col md:flex-row md:items-start justify-between cursor-pointer"
              onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {session.time}
                  </span>
                  {session.track && (
                    <span className="px-3 py-1 text-xs font-semibold bg-white/50 rounded-full">
                      {session.track}
                    </span>
                  )}
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    session.type === 'keynote'
                      ? 'bg-purple-100 text-purple-800'
                      : session.type === 'workshop'
                      ? 'bg-green-100 text-green-800'
                      : session.type === 'break'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {session.title}
                </h3>
                
                {session.speaker && (
                  <div className="flex items-center space-x-2 text-gray-700">
                    <span className="font-medium">{session.speaker}</span>
                    {session.speakerTitle && (
                      <span className="text-sm">• {session.speakerTitle}</span>
                    )}
                  </div>
                )}
              </div>
              
              <button className="mt-4 md:mt-0 md:ml-4">
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    expandedSession === session.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {expandedSession === session.id && (
              <div className="mt-4 pt-4 border-t border-white/30">
                <p className="text-gray-700">{session.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventSchedule;