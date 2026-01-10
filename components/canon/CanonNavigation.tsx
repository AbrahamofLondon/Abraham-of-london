'use client';

import React, { useState } from 'react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  type: 'video' | 'reading' | 'exercise' | 'quiz';
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface CanonNavigationProps {
  modules: Module[];
  currentModuleId?: string;
  currentLessonId?: string;
}

const CanonNavigation: React.FC<CanonNavigationProps> = ({
  modules,
  currentModuleId,
  currentLessonId,
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(currentModuleId ? [currentModuleId] : [modules[0]?.id])
  );

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getLessonIcon = (type: Lesson['type']) => {
    switch (type) {
      case 'video':
        return <VideoIcon className="w-5 h-5" />;
      case 'reading':
        return <BookOpenIcon className="w-5 h-5" />;
      case 'exercise':
        return <CodeIcon className="w-5 h-5" />;
      case 'quiz':
        return <ClipboardCheckIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Course Curriculum</h2>
        <div className="text-sm text-gray-600">
          {modules.reduce((acc, module) => acc + module.lessons.length, 0)} lessons
        </div>
      </div>

      <div className="space-y-4">
        {modules.map((module) => (
          <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  expandedModules.has(module.id)
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {expandedModules.has(module.id) ? (
                    <ChevronDownIcon className="w-5 h-5" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{module.title}</h3>
                  <p className="text-sm text-gray-600">{module.lessons.length} lessons</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Module</div>
                <div className="text-xs text-gray-400">{module.id}</div>
              </div>
            </button>

            {expandedModules.has(module.id) && (
              <div className="border-t border-gray-200">
                {module.lessons.map((lesson) => (
                  <a
                    key={lesson.id}
                    href={`#lesson-${lesson.id}`}
                    className={`block p-4 hover:bg-gray-50 transition-colors ${
                      currentLessonId === lesson.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        lesson.completed
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {lesson.completed ? (
                          <CheckIcon className="w-5 h-5" />
                        ) : (
                          getLessonIcon(lesson.type)
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className={`font-medium ${
                            currentLessonId === lesson.id
                              ? 'text-purple-600'
                              : 'text-gray-900'
                          }`}>
                            {lesson.title}
                          </h4>
                          <span className="text-sm text-gray-500">{lesson.duration}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Course Progress</span>
          <span className="text-sm font-semibold text-purple-600">25%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '25%' }} />
        </div>
      </div>
    </div>
  );
};

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const VideoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const CodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const ClipboardCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default CanonNavigation;
