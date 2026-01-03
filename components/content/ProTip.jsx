import React from 'react';

const ProTip = ({ type = 'info', children }) => {
  const getConfig = () => {
    switch(type) {
      case 'premium':
        return {
          icon: '⚡',
          title: 'Premium Insight',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-l-purple-500',
          iconColor: 'text-purple-700 dark:text-purple-300',
          gradientColor: 'from-purple-500/10 to-transparent'
        };
      case 'implementation':
        return {
          icon: '🛠️',
          title: 'Implementation Guidance',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-l-green-500',
          iconColor: 'text-green-700 dark:text-green-300',
          gradientColor: 'from-green-500/10 to-transparent'
        };
      case 'warning':
        return {
          icon: '⚠️',
          title: 'Important Consideration',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-l-red-500',
          iconColor: 'text-red-700 dark:text-red-300',
          gradientColor: 'from-red-500/10 to-transparent'
        };
      default:
        return {
          icon: '💡',
          title: 'Pro Tip',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-l-blue-500',
          iconColor: 'text-blue-700 dark:text-blue-300',
          gradientColor: 'from-blue-500/10 to-transparent'
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`relative my-8 rounded-lg border-l-4 ${config.borderColor} ${config.bgColor} p-6 overflow-hidden`}>
      {/* Gradient background effect */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${config.gradientColor} opacity-50`}></div>
      
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <span className={`text-2xl ${config.iconColor}`}>
          {config.icon}
        </span>
        <span className={`text-sm font-semibold uppercase tracking-wider ${config.iconColor}`}>
          {config.title}
        </span>
      </div>
      
      <div className="text-gray-700 dark:text-gray-300 leading-relaxed relative z-10">
        {children}
      </div>
    </div>
  );
};

export default ProTip;