import React, { useEffect } from 'react';

interface StatusMessageProps {
  status: {
    message: string;
    type: 'success' | 'error' | 'info';
  };
  onDismiss?: () => void;
  autoDismiss?: number;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ 
  status, 
  onDismiss, 
  autoDismiss = 3000 
}) => {
  useEffect(() => {
    if (autoDismiss && onDismiss && status.type !== 'error') {
      const timer = setTimeout(onDismiss, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss, status.type]);

  const getStyles = () => {
    switch (status.type) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'error':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'info':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    }
  };

  return (
    <div className={`mb-6 rounded-xl p-4 text-sm font-medium border ${getStyles()}`}>
      <div className="flex items-center justify-between">
        <span>{status.message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-xs opacity-70 hover:opacity-100"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default StatusMessage;
