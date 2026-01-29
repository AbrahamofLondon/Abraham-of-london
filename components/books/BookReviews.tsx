'use client';

import React, { useState, useEffect } from 'react';
import { 
  safeString, 
  safeFirstChar, 
  safeNumber, 
  safeArray,
  formatSafeDate,
  classNames 
} from '@/lib/utils/safe'; // From barrel file

// Import any missing functions from the extras file
import { safeInteger, safeBoolean, clamp } from '@/lib/utils/safe-extras';

interface ReviewAuthor {
  name?: string | null;
  avatar?: string | null;
  verified?: boolean;
}

interface Review {
  id?: string;
  author?: ReviewAuthor;
  rating?: number | string | null;
  date?: string | Date | null;
  title?: string | null;
  content?: string | null;
  helpful?: number | string | null;
  notHelpful?: number | string | null;
}

interface BookReviewsProps {
  bookId?: string;
  averageRating?: number | string | null;
  totalReviews?: number | string | null;
  reviews?: Review[];
}

// Helper function to safely parse integers
const parseSafeInteger = (value: any, defaultValue: number = 0): number => {
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

const BookReviews: React.FC<BookReviewsProps> = (props) => {
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Extract and sanitize props
  const bookId = safeString(props.bookId, 'unknown');
  const averageRating = safeNumber(props.averageRating, 4.5);
  const totalReviews = parseSafeInteger(props.totalReviews, 0);
  const reviews = safeArray<Review>(props.reviews, []);
  
  // Generate sample reviews if none provided - FIXED with safe values
  const displayReviews = reviews.length > 0 ? reviews : Array(3).fill(null).map((_, i) => ({
    id: `sample-${i}`,
    author: {
      name: `Reader ${i + 1}`,
      verified: i % 2 === 0
    },
    rating: 4 + (i % 2),
    date: new Date(Date.now() - i * 86400000 * 7), // Weeks ago
    title: safeString(['Great read!', 'Very insightful', 'Life-changing'][i], 'Good book'),
    content: safeString(['Really enjoyed this perspective.', 'Would recommend to friends.', 'Changed my approach.'][i], 'Good book'),
    helpful: Math.floor(Math.random() * 50),
    notHelpful: Math.floor(Math.random() * 10)
  }));

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = safeString(newReview.title).trim();
    const trimmedContent = safeString(newReview.content).trim();
    
    if (!trimmedTitle || !trimmedContent) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reset form
    setNewReview({ rating: 5, title: '', content: '' });
    setIsSubmitting(false);
  };

  // Helper functions
  const getAuthorInitial = (author: ReviewAuthor | null | undefined): string => {
    return safeFirstChar(author?.name, 'A');
  };

  const getAuthorName = (author: ReviewAuthor | null | undefined): string => {
    return safeString(author?.name, 'Anonymous Reader');
  };

  const getRatingDistribution = () => {
    const distribution = [5, 4, 3, 2, 1].map(stars => {
      const count = displayReviews.filter(r => {
        const rating = safeNumber(r.rating, 0);
        return Math.round(rating) === stars;
      }).length;
      const percentage = displayReviews.length > 0 ? (count / displayReviews.length) * 100 : 0;
      return { stars, count, percentage: Math.max(0, Math.min(100, percentage)) }; // Clamp between 0-100
    });
    return distribution;
  };

  // Safely calculate average rating from reviews
  const calculateAverageRating = () => {
    if (displayReviews.length === 0) return 4.5;
    const sum = displayReviews.reduce((acc, review) => {
      return acc + safeNumber(review.rating, 0);
    }, 0);
    return Math.max(0, Math.min(5, sum / displayReviews.length)); // Clamp between 0-5
  };

  const finalAverageRating = safeNumber(props.averageRating, calculateAverageRating());
  const finalTotalReviews = parseSafeInteger(props.totalReviews, displayReviews.length);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-white to-gray-50 p-8 shadow-xl hover:shadow-2xl transition-shadow duration-500 border border-gray-200">
      {/* Header */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Reader Reviews</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={classNames(
                      "h-6 w-6 transition-colors",
                      i < Math.floor(finalAverageRating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                ))}
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {finalAverageRating.toFixed(1)}
                </span>
              </div>
              <div className="text-gray-600">
                <span className="font-semibold">{finalTotalReviews.toLocaleString()}</span> reviews
              </div>
            </div>
          </div>
          
          <button className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative">Write a Review</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Rating Distribution */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">Rating Distribution</h3>
          <div className="space-y-4">
            {getRatingDistribution().map(({ stars, count, percentage }) => (
              <div key={stars} className="group flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-[80px]">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={classNames(
                          "h-4 w-4",
                          i < stars
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 w-6">{stars}</span>
                </div>
                
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                
                <span className="text-sm text-gray-600 min-w-[50px] text-right group-hover:text-gray-900 transition-colors">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* New Review Form */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Add Your Review</h3>
          
          <form onSubmit={handleSubmitReview} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Your Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                    className="focus:outline-none transform hover:scale-110 transition-transform"
                  >
                    <Star
                      className={classNames(
                        "h-10 w-10 transition-all duration-200",
                        star <= newReview.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 hover:text-yellow-300'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title
              </label>
              <input
                type="text"
                value={safeString(newReview.title)}
                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                placeholder="Summarize your experience"
                maxLength={100}
              />
            </div>
            
            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review
              </label>
              <textarea
                value={safeString(newReview.content)}
                onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white"
                placeholder="Share your thoughts about this book..."
                maxLength={2000}
              />
            </div>
            
            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !newReview.title.trim() || !newReview.content.trim()}
              className={classNames(
                "w-full py-4 rounded-xl font-semibold transition-all",
                isSubmitting || !newReview.title.trim() || !newReview.content.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-[1.02]'
              )}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-8">
        {displayReviews.map((review, index) => {
          const rating = safeNumber(review.rating, 5);
          const authorName = getAuthorName(review.author);
          const authorInitial = getAuthorInitial(review.author);
          const date = formatSafeDate(review.date, { month: 'short', day: 'numeric', year: 'numeric' });
          const helpful = parseSafeInteger(review.helpful, 0);
          const notHelpful = parseSafeInteger(review.notHelpful, 0);
          const reviewTitle = safeString(review.title, 'Great read!');
          const reviewContent = safeString(review.content, 'This book was very insightful.');
          
          return (
            <div 
              key={safeString(review.id, `review-${index}`)}
              className="group relative rounded-2xl bg-gradient-to-br from-gray-50 to-white p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-200"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
              
              <div className="relative">
                {/* Author Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {review.author?.avatar ? (
                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow">
                          <img 
                            src={safeString(review.author.avatar)}
                            alt={authorName}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling;
                              if (fallback) {
                                fallback.classList.remove('hidden');
                              }
                            }}
                          />
                          <div className="hidden h-12 w-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold">
                            {authorInitial}
                          </div>
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold shadow">
                          {authorInitial}
                        </div>
                      )}
                      
                      {review.author?.verified && (
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">{authorName}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{date}</span>
                        <span>•</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={classNames(
                                "h-3 w-3",
                                i < Math.floor(rating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Review Content */}
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">
                    {reviewTitle}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {reviewContent}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-gray-600">Was this helpful?</span>
                  
                  <button className="group/like flex items-center gap-2 text-green-600 hover:text-green-800 transition-colors">
                    <div className="p-1 rounded-lg group-hover/like:bg-green-50 transition-colors">
                      <ThumbsUp className="h-4 w-4 group-hover/like:scale-110 transition-transform" />
                    </div>
                    <span className="font-medium">{helpful}</span>
                  </button>
                  
                  <button className="group/dislike flex items-center gap-2 text-red-600 hover:text-red-800 transition-colors">
                    <div className="p-1 rounded-lg group-hover/dislike:bg-red-50 transition-colors">
                      <ThumbsDown className="h-4 w-4 group-hover/dislike:scale-110 transition-transform" />
                    </div>
                    <span className="font-medium">{notHelpful}</span>
                  </button>
                  
                  <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors ml-auto">
                    <Flag className="h-4 w-4" />
                    <span>Report</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookReviews;