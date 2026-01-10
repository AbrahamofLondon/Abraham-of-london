'use client';

import React, { useState } from 'react';

interface ResourceActionsProps {
  resourceId: string;
  downloadUrl: string;
  canPreview?: boolean;
  previewUrl?: string;
  requiresEmail?: boolean;
}

const ResourceActions: React.FC<ResourceActionsProps> = ({
  resourceId,
  downloadUrl,
  canPreview = false,
  previewUrl,
  requiresEmail = false,
}) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDownload = async () => {
    if (requiresEmail && !showEmailForm) {
      setShowEmailForm(true);
      return;
    }

    if (requiresEmail && showEmailForm) {
      setIsSubmitting(true);
      // Submit email and download
      try {
        // API call to register email and get download link
        const response = await fetch('/api/resources/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceId, email }),
        });
        
        if (response.ok) {
          window.location.href = downloadUrl;
        }
      } catch (error) {
        console.error('Download failed:', error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      window.location.href = downloadUrl;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Get Your Copy Now
        </h3>
        <p className="text-gray-600">
          Download this resource and start implementing today
        </p>
      </div>

      <div className="space-y-6">
        {showEmailForm && (
          <div className="animate-fadeIn">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your email to download
            </label>
            <div className="flex gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <button
                onClick={handleDownload}
                disabled={isSubmitting || !email}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Download'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              We respect your privacy. Your email will only be used to send you updates.
            </p>
          </div>
        )}

        {!showEmailForm && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleDownload}
              className="group bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-center space-x-3"
            >
              <DownloadIcon className="w-5 h-5" />
              <span>Download Now</span>
            </button>

            {canPreview && previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-lg border border-gray-300 transition-all flex items-center justify-center space-x-3"
              >
                <EyeIcon className="w-5 h-5" />
                <span>Preview Sample</span>
              </a>
            )}
          </div>
        )}

        <div className="flex items-center justify-center space-x-8 pt-6 border-t border-gray-200">
          <button className="flex flex-col items-center group">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors mb-2">
              <SaveIcon className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm text-gray-600">Save</span>
          </button>

          <button className="flex flex-col items-center group">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors mb-2">
              <ShareIcon className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm text-gray-600">Share</span>
          </button>

          <button className="flex flex-col items-center group">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors mb-2">
              <PrintIcon className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm text-gray-600">Print</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const PrintIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

export default ResourceActions;
