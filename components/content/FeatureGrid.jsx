import React from 'react';
import styles from './FeatureGrid.module.css';

const FeatureGrid = ({ columns = 2, items = [] }) => {
  const gridStyle = {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid} style={gridStyle}>
        {items.map((item, index) => (
          <div 
            key={index}
            className={styles.card}
            style={{ borderTopColor: item.color || '#3B82F6' }}
          >
            <div className={styles.cardHeader}>
              {item.icon && (
                <span 
                  className={styles.icon}
                  style={{ 
                    backgroundColor: `${item.color}20`,
                    color: item.color
                  }}
                >
                  {item.icon}
                </span>
              )}
              <h3 className={styles.title}>{item.title}</h3>
            </div>
            <div 
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
            <div className={styles.cardFooter}>
              <div 
                className={styles.accentLine}
                style={{ backgroundColor: item.color }}
              />
              <div className={styles.number}>0{index + 1}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureGrid;