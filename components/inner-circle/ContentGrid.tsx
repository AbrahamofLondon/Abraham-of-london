// components/inner-circle/ContentGrid.tsx - PRODUCTION READY (FIXED)
import React from 'react';
import { 
  Clock, 
  Eye, 
  Heart, 
  Download, 
  Lock, 
  Star, 
  TrendingUp,
  FileText,
  Video,
  Headphones,
  BarChart3
} from 'lucide-react';
import { capitalize } from '@/lib/utils/string'; // ✅ Add import

interface ContentItem {
  id: string;
  title: string;
  excerpt?: string;
  category: string;
  tierLevel: string;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    difficulty: string;
    estimatedReadTime: number;
    attachments?: Array<{ fileName: string; fileType: string }>;
    videoUrl?: string;
    audioUrl?: string;
    requiresVerification?: boolean;
  };
}

interface ContentGridProps {
  content: ContentItem[];
  onItemClick: (id: string) => void;
  userTier: string;
  loading?: boolean;
  emptyMessage?: string;
}

const ContentGrid: React.FC<ContentGridProps> = ({
  content,
  onItemClick,
  userTier,
  loading = false,
  emptyMessage = 'No content available'
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'education':
      case 'strategies':
        return <FileText className="w-4 h-4" />;
      case 'insights':
      case 'research':
        return <TrendingUp className="w-4 h-4" />;
      case 'trading':
      case 'investments':
        return <BarChart3 className="w-4 h-4" />;
      case 'case-studies':
        return <Star className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'education':
        return 'bg-blue-100 text-blue-800';
      case 'strategies':
        return 'bg-green-100 text-green-800';
      case 'insights':
        return 'bg-purple-100 text-purple-800';
      case 'research':
        return 'bg-indigo-100 text-indigo-800';
      case 'trading':
        return 'bg-yellow-100 text-yellow-800';
      case 'investments':
        return 'bg-red-100 text-red-800';
      case 'case-studies':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-orange-100 text-orange-800',
      expert: 'bg-red-100 text-red-800'
    };
    
    const safeDifficulty = difficulty?.toLowerCase() || 'beginner';
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        colors[safeDifficulty as keyof typeof colors] || colors.intermediate
      }`}>
        {/* ✅ FIXED: Use safe capitalize function */}
        {capitalize(safeDifficulty)}
      </span>
    );
  };

  const getTierBadge = (tierLevel: string) => {
    const colors = {
      basic: 'bg-gray-100 text-gray-800',
      premium: 'bg-blue-100 text-blue-800',
      elite: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800'
    };
    
    const safeTier = tierLevel?.toLowerCase() || 'basic';
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        colors[safeTier as keyof typeof colors] || colors.basic
      }`}>
        {/* ✅ FIXED: Use safe capitalize function */}
        {capitalize(safeTier)}
      </span>
    );
  };

  const canAccess = (itemTier: string) => {
    const tierOrder = { 'basic': 1, 'premium': 2, 'elite': 3 };
    const safeUserTier = userTier?.replace('inner-circle-', '').toLowerCase() || 'basic';
    const safeItemTier = itemTier?.toLowerCase() || 'basic';
    
    const userTierOrder = tierOrder[safeUserTier as keyof typeof tierOrder] || 0;
    const itemTierOrder = tierOrder[safeItemTier as keyof typeof tierOrder] || 0;
    return userTierOrder >= itemTierOrder;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      return 'Recently';
    }
  };

  const formatCategory = (category: string) => {
    if (!category) return 'Content';
    return category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse">
            <div className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="flex space-x-2 mb-4">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Found</h3>
        <p className="text-gray-600 max-w-md mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {content.map((item) => {
        const accessible = canAccess(item.tierLevel);
        
        return (
          <div
            key={item.id}
            className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 ${
              !accessible ? 'opacity-75' : 'cursor-pointer'
            }`}
            onClick={() => accessible && onItemClick(item.id)}
          >
            {/* Header with category and tier */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-md ${getCategoryColor(item.category)}`}>
                  {getCategoryIcon(item.category)}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {/* ✅ FIXED: Use safe formatting */}
                  {formatCategory(item.category)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {!accessible && <Lock className="w-4 h-4 text-gray-400" />}
                {getTierBadge(item.tierLevel)}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                {item.title || 'Untitled Content'}
              </h3>
              
              {item.excerpt && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {item.excerpt}
                </p>
              )}

              {/* Metadata */}
              <div className="space-y-3">
                {item.metadata && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {item.metadata.estimatedReadTime && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {item.metadata.estimatedReadTime} min
                        </div>
                      )}
                      {item.metadata.difficulty && getDifficultyBadge(item.metadata.difficulty)}
                    </div>
                    {item.metadata.attachments && item.metadata.attachments.length > 0 && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Download className="w-4 h-4 mr-1" />
                        {item.metadata.attachments.length}
                      </div>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Eye className="w-4 h-4 mr-1" />
                      {(item.views || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Heart className="w-4 h-4 mr-1" />
                      {(item.likes || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(item.updatedAt || item.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-6 pb-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  accessible && onItemClick(item.id);
                }}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  accessible
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!accessible}
              >
                {accessible ? (
                  <>
                    {item.metadata?.videoUrl ? 'Watch Now' : 
                     item.metadata?.audioUrl ? 'Listen Now' : 'Read Now'}
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 inline mr-2" />
                    Upgrade to Access
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContentGrid;