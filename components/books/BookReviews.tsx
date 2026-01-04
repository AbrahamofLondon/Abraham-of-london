'use client';

import React, { useState } from 'react';

interface Review {
  id: string;
  author: {
    name: string;
    avatar: string;
    verified?: boolean;
  };
  rating: number;
  date: string;
  title: string;
  content: string;
  helpful: number;
  notHelpful: number;
}

interface BookReviewsProps {
  bookId: string;
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
}

const BookReviews: React.FC<BookReviewsProps> = ({
  bookId,
  averageRating,
  totalReviews,
  reviews,
}) => {
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: '',
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit review logic
    console.log('Submitting review:', newReview);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reader Reviews</h2>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(averageRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-2 text-lg font-semibold">{averageRating.toFixed(1)}</span>
            </div>
            <span className="text-gray-600">({totalReviews} reviews)</span>
          </div>
        </div>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
          Write a Review
        </button>
      </div>

      {/* Review Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 w-8">{stars} stars</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400"
                    style={{ width: `${(stars / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12">75%</span>
              </div>
            ))}
          </div>
        </div>

        {/* New Review Form */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Your Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className="focus:outline-none"
                  >
                    <StarIcon
                      className={`w-8 h-8 ${
                        star <= newReview.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Title
              </label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Summarize your experience"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Review
              </label>
              <textarea
                value={newReview.content}
                onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Share your thoughts about this book..."
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Submit Review
            </button>
          </form>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-8">
        {reviews.map((review) => (
          <div key={review.id} className="border-t border-gray-200 pt-8">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {review.author.avatar ? (
                    <img 
                      src={review.author.avatar} 
                      alt={review.author.name}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <span className="font-semibold text-gray-600">
                      {review.author.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900">{review.author.name}</h4>
                    {review.author.verified && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{review.date}</span>
                    <span>•</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <h3 className="font-bold text-gray-900 mb-2">{review.title}</h3>
            <p className="text-gray-700 mb-4">{review.content}</p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Was this review helpful?</span>
              <button className="flex items-center space-x-1 text-green-600 hover:text-green-800">
                <ThumbUpIcon className="w-4 h-4" />
                <span>{review.helpful}</span>
              </button>
              <button className="flex items-center space-x-1 text-red-600 hover:text-red-800">
                <ThumbDownIcon className="w-4 h-4" />
                <span>{review.notHelpful}</span>
              </button>
              <button className="text-blue-600 hover:text-blue-800">
                Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const ThumbUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
  </svg>
);

const ThumbDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2M17 4h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
  </svg>
);

export default BookReviews;