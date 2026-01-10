'use client';

import React, { useState } from 'react';

interface DownloadOption {
  id: string;
  label: string;
  format: string;
  size: string;
  isPrimary?: boolean;
}

interface ResourceDownloadProps {
  title: string;
  downloadOptions: DownloadOption[];
  onDownload: (optionId: string, format: string) => void;
  requiresAccess?: boolean;
  isSubscriber?: boolean;
}

const ResourceDownload: React.FC<ResourceDownloadProps> = ({
  title,
  downloadOptions,
  onDownload,
  requiresAccess = false,
  isSubscriber = false,
}) => {
  const [selectedOption, setSelectedOption] = useState(
    downloadOptions.find(opt => opt.isPrimary)?.id || downloadOptions[0]?.id
  );

  const handleDownload = () => {
    const option = downloadOptions.find(opt => opt.id === selectedOption);
    if (option) {
      onDownload(option.id, option.format);
    }
  };

  if (requiresAccess && !isSubscriber) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 border border-yellow-200 text-center">
        <LockIcon className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Subscriber Exclusive</h3>
        <p className="text-gray-600 mb-6">
          This resource is available exclusively to our subscribers. 
          Join our community to access premium content.
        </p>
        <button className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
          Become a Subscriber
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
      <div className="text-center mb-8">
        <DownloadIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Download "{title}"</h3>
        <p className="text-gray-600">Choose your preferred format</p>
      </div>

      <div className="space-y-4 mb-8">
        {downloadOptions.map((option) => (
          <div
            key={option.id}
            className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedOption === option.id
                ? 'border-blue-500 bg-white shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setSelectedOption(option.id)}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedOption === option.id
                  ? 'border-blue-500'
                  : 'border-gray-300'
              }`}>
                {selectedOption === option.id && (
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">{option.label}</span>
                  {option.isPrimary && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="uppercase">{option.format}</span>
                  <span>•</span>
                  <span>{option.size}</span>
                </div>
              </div>
            </div>
            <div>
              <FileFormatIcon format={option.format} className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleDownload}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3"
      >
        <DownloadIcon className="w-5 h-5" />
        <span>Download Now</span>
      </button>

      <div className="mt-6 pt-6 border-t border-blue-200">
        <div className="flex items-center justify-center text-sm text-gray-600">
          <ShieldIcon className="w-4 h-4 mr-2" />
          <span>Secure download • No spam • Your data is protected</span>
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

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const FileFormatIcon: React.FC<{ format: string; className?: string }> = ({ format, className }) => {
  const getIcon = () => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return (
          <path d="M10 18l-4-4 1.41-1.41L10 15.17l6.59-6.59L18 10l-8 8z" />
        );
      case 'docx':
      case 'doc':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        );
      case 'pptx':
      case 'ppt':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        );
      default:
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        );
    }
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      {getIcon()}
    </svg>
  );
};

export default ResourceDownload;
