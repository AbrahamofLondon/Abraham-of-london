// components/content/DownloadCTA.no-scss.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const DownloadCTA = ({
  title = "Download The Legacy Architecture Canvas",
  description = "Heirloom-grade PDF with integrated fillable fields and implementation notes",
  badge,
  level = "premium"
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDownload = async () => {
    setIsDownloading(true);
    // Download logic
    setTimeout(() => {
      setIsDownloading(false);
      window.open('/assets/downloads/sample.pdf', '_blank');
    }, 800);
  };

  const getLevelStyles = () => {
    switch(level) {
      case 'premium':
        return {
          borderColor: '#7C3AED',
          buttonBg: '#7C3AED',
        };
      default:
        return {
          borderColor: '#4B5563',
          buttonBg: '#4B5563',
        };
    }
  };
  
  const stylesConfig = getLevelStyles();

  return (
    <div 
      className="rounded-xl border p-6 shadow-lg"
      style={{ 
        borderColor: stylesConfig.borderColor,
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
      }}
    >
      <div className="mb-4">
        <div 
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white mb-2"
          style={{ backgroundColor: stylesConfig.borderColor }}
        >
          {badge || (level === 'premium' ? 'Premium Resource' : 'Master Tool')}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-300">{description}</p>
      </div>
      
      <button
        className="w-full px-6 py-3 text-white font-semibold rounded-lg transition-colors"
        style={{ backgroundColor: stylesConfig.buttonBg }}
        onClick={handleDownload}
        disabled={isDownloading}
      >
        {isDownloading ? 'Downloading...' : 'Download Now'}
      </button>
    </div>
  );
};

export default DownloadCTA;