import React from 'react';

interface MetadataItem {
  label: string;
  value: string;
  icon: React.ReactNode;
}

interface ShortMetadataProps {
  metadata: MetadataItem[];
  productionDate: string;
  language: string;
  resolution: string;
  transcriptAvailable: boolean;
  captionsAvailable: boolean;
}

const ShortMetadata: React.FC<ShortMetadataProps> = ({
  metadata,
  productionDate,
  language,
  resolution,
  transcriptAvailable,
  captionsAvailable,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Video Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {metadata.map((item, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              {item.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-lg font-semibold text-gray-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-gray-500 mb-2" />
            <span className="text-sm text-gray-600">Produced</span>
            <span className="font-semibold">{productionDate}</span>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
            <LanguageIcon className="w-6 h-6 text-gray-500 mb-2" />
            <span className="text-sm text-gray-600">Language</span>
            <span className="font-semibold">{language}</span>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
            <ResolutionIcon className="w-6 h-6 text-gray-500 mb-2" />
            <span className="text-sm text-gray-600">Resolution</span>
            <span className="font-semibold">{resolution}</span>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
            <AccessibilityIcon className="w-6 h-6 text-gray-500 mb-2" />
            <span className="text-sm text-gray-600">Accessibility</span>
            <div className="flex space-x-2 mt-1">
              {transcriptAvailable && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Transcript</span>
              )}
              {captionsAvailable && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">CC</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <InfoIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Accessibility Note</p>
            <p className="text-sm text-blue-700">
              This video includes {transcriptAvailable ? 'a transcript' : ''}
              {transcriptAvailable && captionsAvailable ? ' and ' : ''}
              {captionsAvailable ? 'closed captions' : ''} 
              {!transcriptAvailable && !captionsAvailable ? 'no accessibility features' : ''}
              . We're committed to making all our content accessible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00 -2 2v12a2 2 0 002 2z" />
  </svg>
);

const LanguageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
  </svg>
);

const ResolutionIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const AccessibilityIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 01118 0z" />
  </svg>
);

export default ShortMetadata;
