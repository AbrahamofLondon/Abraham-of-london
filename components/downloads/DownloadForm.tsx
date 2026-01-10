'use client';

import React, { useState } from 'react';

interface DownloadFormProps {
  resourceId: string;
  resourceTitle: string;
  requiresEmail: boolean;
}

const DownloadForm: React.FC<DownloadFormProps> = ({
  resourceId,
  resourceTitle,
  requiresEmail,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    receiveUpdates: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would:
      // 1. Submit the form data to your API
      // 2. Start the download
      // 3. Track the download in analytics
      
      setDownloadStarted(true);
      
      // Simulate download start
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = `/api/download/${resourceId}`;
        link.download = `${resourceTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 1000);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (downloadStarted) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 text-center">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Download Started!</h3>
        <p className="text-gray-700 mb-6">
          Your download of "{resourceTitle}" has started automatically. 
          If it doesn't start, <a href={`/api/download/${resourceId}`} className="text-blue-600 hover:text-blue-800 font-medium">click here</a>.
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-2">What's Next?</h4>
            <ul className="text-sm text-gray-700 space-y-1 text-left">
              <li className="flex items-start space-x-2">
                <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Check your downloads folder</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Review the material at your own pace</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Implement what you've learned</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => setDownloadStarted(false)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Download another resource
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
      <div className="text-center mb-8">
        <DownloadIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Download "{resourceTitle}"</h2>
        <p className="text-gray-600">
          {requiresEmail
            ? 'Enter your details to access this resource'
            : 'Get instant access to this valuable resource'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="John Doe"
          />
        </div>

        {requiresEmail && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company (Optional)
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Your company name"
          />
        </div>

        {requiresEmail && (
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="updates"
              checked={formData.receiveUpdates}
              onChange={(e) => setFormData({ ...formData, receiveUpdates: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="updates" className="text-sm text-gray-700">
              I want to receive updates about new resources, articles, and exclusive content from Abraham of London.
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
        >
          {isSubmitting ? (
            <>
              <SpinnerIcon className="w-5 h-5" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <DownloadIcon className="w-5 h-5" />
              <span>Download Now</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-blue-200">
        <div className="flex items-center justify-center text-sm text-gray-600">
          <ShieldIcon className="w-4 h-4 mr-2" />
          <span>Your information is secure and will not be shared</span>
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

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default DownloadForm;
