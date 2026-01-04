'use client';

import React, { useState } from 'react';

interface AccessGateProps {
  title: string;
  description: string;
  accessLevel: 'free' | 'subscriber' | 'premium';
  currentAccess?: 'free' | 'subscriber' | 'premium';
  onUpgrade?: () => void;
  onLogin?: () => void;
}

// Icon components
const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const UnlockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
);

const KeyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const CrownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const AccessGate: React.FC<AccessGateProps> = ({
  title,
  description,
  accessLevel,
  currentAccess = 'free',
  onUpgrade,
  onLogin,
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accessLevels = {
    free: {
      label: 'Free',
      color: 'bg-gray-100 text-gray-800',
      icon: UnlockIcon,
    },
    subscriber: {
      label: 'Subscriber',
      color: 'bg-blue-100 text-blue-800',
      icon: KeyIcon,
    },
    premium: {
      label: 'Premium',
      color: 'bg-purple-100 text-purple-800',
      icon: CrownIcon,
    },
  };

  const hasAccess = () => {
    const levels = ['free', 'subscriber', 'premium'];
    return levels.indexOf(currentAccess) >= levels.indexOf(accessLevel);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      console.log('Requesting access with email:', email);
    } catch (error) {
      console.error('Access request failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasAccess()) {
    return null; // No gate needed if user has access
  }

  const CurrentAccessIcon = accessLevels[currentAccess].icon;
  const RequiredAccessIcon = accessLevels[accessLevel].icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-8 text-center border-b border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <LockIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>

        {/* Access Level Info */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${accessLevels[accessLevel].color}`}>
                {accessLevels[accessLevel].label} Content
              </div>
              <RequiredAccessIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Your access:</span>
              <CurrentAccessIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{accessLevels[currentAccess].label}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Exclusive content and resources</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Ad-free experience</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Early access to new materials</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-8">
          {currentAccess === 'free' ? (
            <div className="space-y-4">
              <button
                onClick={onUpgrade}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Upgrade to {accessLevel === 'subscriber' ? 'Subscriber' : 'Premium'}
              </button>
              
              <div className="text-center text-sm text-gray-600">or</div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email for free preview"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Requesting...' : 'Request Free Preview'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={onUpgrade}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Upgrade to Premium
              </button>
              
              {onLogin && (
                <button
                  onClick={onLogin}
                  className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Login to Access
                </button>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have access?{' '}
              <button
                onClick={onLogin}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessGate;