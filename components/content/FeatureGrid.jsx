// components/content/FeatureGrid.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {Object} FeatureGridItem
 * @property {string} title - The title of the feature
 * @property {string} content - HTML content
 * @property {string} [icon] - Optional icon emoji/character
 * @property {string} [color] - Optional accent color
 */

/**
 * @param {Object} props
 * @param {number} [props.columns=2]
 * @param {FeatureGridItem[]} props.items
 */
const FeatureGrid = ({ columns = 2, items = [] }) => {
  // Guard against empty items
  if (!items.length) return null;

  return (
    <div className="my-12">
      <div 
        className="grid gap-6"
        style={{ 
          gridTemplateColumns: `repeat(${Math.min(columns, items.length || 1)}, minmax(0, 1fr))`
        }}
      >
        {items.map((item, index) => (
          <div 
            key={index}
            className="group relative p-8 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:border-gold/30 transition-all duration-300 hover:shadow-xl hover:shadow-current/10"
            style={{ 
              borderTopColor: item.color || '#3B82F6',
              borderTopWidth: '4px'
            }}
          >
            {/* Top accent line */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
              style={{ backgroundColor: item.color || '#3B82F6' }}
            />
            
            <div className="mb-6">
              {item.icon && (
                <div 
                  className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ 
                    backgroundColor: `${item.color || '#3B82F6'}20`,
                    color: item.color || '#3B82F6'
                  }}
                >
                  <span className="text-2xl">{item.icon}</span>
                </div>
              )}
              <h3 className="text-xl font-bold text-cream mb-3 font-serif">{item.title}</h3>
            </div>
            
            <div 
              className="text-gray-400 leading-relaxed prose prose-invert max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
            
            {/* Bottom indicator */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div 
                className="h-0.5 w-12 transition-all duration-300 group-hover:w-16"
                style={{ backgroundColor: item.color || '#3B82F6' }}
              />
              <div className="text-xs font-bold px-2 py-1 rounded bg-white/10 text-white">
                {String(index + 1).padStart(2, '0')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

FeatureGrid.propTypes = {
  columns: PropTypes.number,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      icon: PropTypes.string,
      color: PropTypes.string,
    })
  ).isRequired,
};

export default FeatureGrid;