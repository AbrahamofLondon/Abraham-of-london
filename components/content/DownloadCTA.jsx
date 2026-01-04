// DownloadCTA.jsx
import React, { useState } from 'react';
import styles from './DownloadCTA.module.css';
import PropTypes from 'prop-types';

const DownloadCTA = ({
  title = "Download The Legacy Architecture Canvas",
  description = "Heirloom-grade PDF with integrated fillable fields and implementation notes",
  badge,
  details,
  features,
  downloadUrl,
  fileSize = "Multiple formats available",
  fileFormat,
  buttonText = "Download for Architects",
  level = "premium"
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('A4');
  
  const formats = [
    { id: 'A4', label: 'A4 (International)', size: '~450 KB' },
    { id: 'Letter', label: 'Letter (US)', size: '~460 KB' },
    { id: 'A3', label: 'A3 (Large Format)', size: '~520 KB' },
    { id: 'bundle', label: 'Complete Bundle', size: '~1.5 MB' },
  ];

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // If downloadUrl is provided, use it directly
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
        setIsDownloading(false);
        return;
      }

      // Otherwise, use the API endpoint
      const response = await fetch(`/api/generate-pdf?format=${selectedFormat}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `legacy-architecture-canvas-${selectedFormat}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      // Fallback to static file if API fails
      const filename = selectedFormat === 'bundle' 
        ? 'legacy-architecture-bundle.pdf'
        : `legacy-architecture-canvas-${selectedFormat}.pdf`;
      
      window.open(`/assets/downloads/${filename}`, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const getLevelStyles = () => {
    switch(level) {
      case 'premium':
        return {
          borderColor: '#7C3AED',
          bgGradient: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
          buttonBg: '#7C3AED',
          buttonHover: '#6D28D9'
        };
      default:
        return {
          borderColor: '#4B5563',
          bgGradient: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
          buttonBg: '#4B5563',
          buttonHover: '#374151'
        };
    }
  };
  
  const stylesConfig = getLevelStyles();

  // Use provided features or default list
  const featuresList = features || [
    '✅ Fillable text fields for each section',
    '✅ Interactive checkboxes and dropdowns',
    '✅ Print-optimized layout (A4, Letter, A3)',
    '✅ Professional typography and design',
    '✅ Signature and date fields',
    '✅ Implementation guidance notes',
  ];

  return (
    <div 
      className={styles.container}
      style={{ 
        borderColor: stylesConfig.borderColor,
        background: stylesConfig.bgGradient 
      }}
    >
      <div className={styles.header}>
        <div className={styles.badge} style={{ backgroundColor: stylesConfig.borderColor }}>
          {badge || (level === 'premium' ? 'Premium Resource' : 'Master Tool')}
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>

      {/* Optional details section */}
      {details && details.length > 0 && (
        <div className={styles.details}>
          <ul className={styles.detailsList}>
            {details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className={styles.formatSelector}>
        <h4 className={styles.formatTitle}>Select Format:</h4>
        <div className={styles.formatGrid}>
          {formats.map(format => (
            <button
              key={format.id}
              className={`${styles.formatButton} ${
                selectedFormat === format.id ? styles.formatButtonActive : ''
              }`}
              onClick={() => setSelectedFormat(format.id)}
              style={{
                borderColor: selectedFormat === format.id ? stylesConfig.borderColor : '#E5E7EB'
              }}
            >
              <div className={styles.formatLabel}>{format.label}</div>
              <div className={styles.formatSize}>{format.size}</div>
            </button>
          ))}
        </div>
      </div>
      
      <div className={styles.features}>
        <h4 className={styles.featuresTitle}>What's Inside:</h4>
        <ul className={styles.featuresList}>
          {featuresList.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
      
      <div className={styles.ctaSection}>
        <button
          className={styles.downloadButton}
          style={{ 
            backgroundColor: stylesConfig.buttonBg,
            '--hover-bg': stylesConfig.buttonHover
          }}
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <svg className={styles.spinner} fill="none" viewBox="0 0 24 24">
                <circle className={styles.spinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className={styles.spinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating PDF...
            </>
          ) : (
            <>
              <svg className={styles.buttonIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {buttonText || `Download ${selectedFormat.toUpperCase()} Format`}
            </>
          )}
        </button>
        
        <div className={styles.fileInfo}>
          <div className={styles.fileInfoItem}>
            <svg className={styles.infoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{fileFormat || 'Fillable PDF'}</span>
          </div>
          <div className={styles.fileInfoItem}>
            <svg className={styles.infoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>{level === 'premium' ? 'Architect Tier' : level}</span>
          </div>
          {fileSize && fileSize !== "Multiple formats available" && (
            <div className={styles.fileInfoItem}>
              <span>{fileSize}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add PropTypes for type checking (optional but recommended)
DownloadCTA.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  badge: PropTypes.string,
  details: PropTypes.arrayOf(PropTypes.string),
  features: PropTypes.arrayOf(PropTypes.string),
  downloadUrl: PropTypes.string,
  fileSize: PropTypes.string,
  fileFormat: PropTypes.string,
  buttonText: PropTypes.string,
  level: PropTypes.oneOf(['premium', 'default'])
};

export default DownloadCTA;