import React from 'react';
import styles from './ProTip.module.css';

const ProTip = ({ type = 'info', children }) => {
  const getConfig = () => {
    switch(type) {
      case 'premium':
        return {
          icon: '⚡',
          title: 'Premium Insight',
          bgColor: '#F5F3FF',
          borderColor: '#7C3AED',
          iconColor: '#7C3AED'
        };
      case 'implementation':
        return {
          icon: '🛠️',
          title: 'Implementation Guidance',
          bgColor: '#F0FDF4',
          borderColor: '#10B981',
          iconColor: '#10B981'
        };
      case 'warning':
        return {
          icon: '⚠️',
          title: 'Important Consideration',
          bgColor: '#FEF3F2',
          borderColor: '#EF4444',
          iconColor: '#EF4444'
        };
      default:
        return {
          icon: '💡',
          title: 'Pro Tip',
          bgColor: '#EFF6FF',
          borderColor: '#3B82F6',
          iconColor: '#3B82F6'
        };
    }
  };

  const config = getConfig();

  return (
    <div 
      className={styles.container}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor
      }}
    >
      <div className={styles.header}>
        <span 
          className={styles.icon}
          style={{ color: config.iconColor }}
        >
          {config.icon}
        </span>
        <span className={styles.title}>{config.title}</span>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
};

export default ProTip;