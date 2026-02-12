'use client';

import React, { useState } from 'react';
import {
  Star,
  CheckCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Flag,
} from 'lucide-react';

import { classNames } from '@/lib/utils/safe'; // only classNames remains useful

// ------------------------------------------------------------------
// Type Definitions – single source of truth
// ------------------------------------------------------------------
interface ReviewAuthor {
  name?: string | null;
  avatar?: string | null;
  verified?: boolean;
}

interface Review {
  id?: string;
  author?: ReviewAuthor;
  rating?: number;
  date?: Date | string;
  title?: string;
  content?: string;
  helpful?: number;
  notHelpful?: number;
}

interface BookReviewsProps {
  bookId?: string;
  averageRating?: number | null;
  totalReviews?: number | null;
  reviews?: Review[];
}

// ------------------------------------------------------------------
// Pure helpers (no side effects)
// ------------------------------------------------------------------
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function getAuthorName(author?: ReviewAuthor | null): string {
  return author?.name?.trim() || 'Anonymous Reader';
}

function getAuthorInitial(author?: ReviewAuthor | null): string {
  const name = author?.name?.trim();
  return name ? name.charAt(0).toUpperCase() : 'A';
}

function getRatingNumber(rating: unknown, fallback = 5): number {
  if (typeof rating === 'number') return Math.min(5, Math.max(1, rating));
  if (typeof rating === 'string') {
    const n = parseFloat(rating);
    if (!isNaN(n)) return Math.min(5, Math.max(1, n));
  }
  return fallback;
}

// ------------------------------------------------------------------
// Sample data generator – always returns valid Review[]
// ------------------------------------------------------------------
function generateSampleReviews(): Review[] {
  return [
    {
      id: 'sample-1',
      author: { name: 'Reader 1', verified: true },
      rating: 5,
      date: new Date(Date.now() - 7 * 86400000),
      title: 'Great read!',
      content: 'Really enjoyed this perspective.',
      helpful: 42,
      notHelpful: 3,
    },
    {
      id: 'sample-2',
      author: { name: 'Reader 2', verified: false },
      rating: 4,
      date: new Date(Date.now() - 14 * 86400000),
      title: 'Very insightful',
      content: 'Would recommend to friends.',
      helpful: 28,
      notHelpful: 2,
    },
    {
      id: 'sample-3',
      author: { name: 'Reader 3', verified: true },
      rating: 5,
      date: new Date(Date.now() - 21 * 86400000),
      title: 'Life-changing',
      content: 'Changed my approach.',
      helpful: 56,
      notHelpful: 1,
    },
  ];
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export default function BookReviews({
  bookId: _bookId, // not used currently
  averageRating: propAverageRating,
  totalReviews: propTotalReviews,
  reviews: propReviews = [],
}: BookReviewsProps) {
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ------------------------------------------------------------------
  // Data preparation – clean, no ambiguous fallbacks
  // ------------------------------------------------------------------
  const reviews = Array.isArray(propReviews) ? propReviews : [];
  const displayReviews = reviews.length > 0 ? reviews : generateSampleReviews();

  const totalReviews = Number(propTotalReviews) || displayReviews.length;

  const averageRating = (() => {
    if (typeof propAverageRating === 'number') {
      return Math.min(5, Math.max(1, propAverageRating));
    }
    if (displayReviews.length === 0) return 4.5;
    const sum = displayReviews.reduce(
      (acc, r) => acc + getRatingNumber(r.rating, 0),
      0
    );
    return sum / displayReviews.length;
  })();

  // ------------------------------------------------------------------
  // Rating distribution
  // ------------------------------------------------------------------
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = displayReviews.filter(
      (r) => Math.round(getRatingNumber(r.rating, 0)) === stars
    ).length;
    const percentage = displayReviews.length
      ? (count / displayReviews.length) * 100
      : 0;
    return { stars, count, percentage: Math.max(0, Math.min(100, percentage)) };
  });

  // ------------------------------------------------------------------
  // Event handlers
  // ------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newReview.title.trim();
    const content = newReview.content.trim();
    if (!title || !content) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate API
    setNewReview({ rating: 5, title: '', content: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-xl transition-shadow duration-500 hover:shadow-2xl">
      {/* ---------- Header ---------- */}
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="mb-3 text-3xl font-bold text-gray-900">Reader Reviews</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={classNames(
                    'h-6 w-6 transition-colors',
                    i <= Math.floor(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              ))}
              <span className="ml-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-2xl font-bold text-transparent">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <div className="text-gray-600">
              <span className="font-semibold">{totalReviews.toLocaleString()}</span> reviews
            </div>
          </div>
        </div>

        <button className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="relative">Write a Review</span>
        </button>
      </div>

      {/* ---------- Main grid: distribution + form ---------- */}
      <div className="mb-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Rating Distribution */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">Rating Distribution</h3>
          <div className="space-y-4">
            {distribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="group flex items-center gap-4">
                <div className="flex min-w-[80px] items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={classNames(
                          'h-4 w-4',
                          i <= stars
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  <span className="w-6 text-sm text-gray-600">{stars}</span>
                </div>

                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <span className="min-w-[50px] text-right text-sm text-gray-600 transition-colors group-hover:text-gray-900">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* New Review Form */}
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6">
          <h3 className="mb-6 text-xl font-semibold text-gray-900">Add Your Review</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700">
                Your Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview((prev) => ({ ...prev, rating: star }))}
                    className="transform transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={classNames(
                        'h-10 w-10 transition-all duration-200',
                        star <= newReview.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-300'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Review Title
              </label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) =>
                  setNewReview((prev) => ({ ...prev, title: e.target.value }))
                }
                maxLength={100}
                placeholder="Summarize your experience"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Content */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Your Review
              </label>
              <textarea
                value={newReview.content}
                onChange={(e) =>
                  setNewReview((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={4}
                maxLength={2000}
                placeholder="Share your thoughts about this book..."
                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={
                isSubmitting || !newReview.title.trim() || !newReview.content.trim()
              }
              className={classNames(
                'w-full rounded-xl py-4 font-semibold transition-all',
                isSubmitting || !newReview.title.trim() || !newReview.content.trim()
                  ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-[1.02] hover:shadow-lg'
              )}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>

      {/* ---------- Reviews List ---------- */}
      <div className="space-y-8">
        {displayReviews.map((review, index) => {
          const rating = getRatingNumber(review.rating, 5);
          const authorName = getAuthorName(review.author);
          const authorInitial = getAuthorInitial(review.author);
          const date = formatDate(review.date);
          const helpful = review.helpful ?? 0;
          const notHelpful = review.notHelpful ?? 0;
          const reviewTitle = review.title?.trim() || 'Great read!';
          const reviewContent = review.content?.trim() || 'This book was very insightful.';
          const reviewId = review.id || `review-${index}`;

          return (
            <div
              key={reviewId}
              className="group relative rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 transition-all duration-300 hover:border-blue-200 hover:shadow-xl"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/3 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative">
                {/* Author Info */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      {review.author?.avatar ? (
                        <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow">
                          <img
                            src={review.author.avatar}
                            alt={authorName}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget
                                .nextElementSibling as HTMLElement;
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-600 font-bold text-white">
                            {authorInitial}
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-600 font-bold text-white shadow">
                          {authorInitial}
                        </div>
                      )}

                      {review.author?.verified && (
                        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-500">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Name & Meta */}
                    <div>
                      <h4 className="font-semibold text-gray-900">{authorName}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{date}</span>
                        <span>•</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={classNames(
                                'h-3 w-3',
                                i <= Math.floor(rating)
                                  ? 'fill-yellow-400 text-yellow-400'
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
                  <h3 className="mb-2 text-lg font-bold text-gray-900">
                    {reviewTitle}
                  </h3>
                  <p className="leading-relaxed text-gray-700">{reviewContent}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-gray-600">Was this helpful?</span>

                  <button className="group/like flex items-center gap-2 text-green-600 transition-colors hover:text-green-800">
                    <div className="rounded-lg p-1 transition-colors group-hover/like:bg-green-50">
                      <ThumbsUp className="h-4 w-4 transition-transform group-hover/like:scale-110" />
                    </div>
                    <span className="font-medium">{helpful}</span>
                  </button>

                  <button className="group/dislike flex items-center gap-2 text-red-600 transition-colors hover:text-red-800">
                    <div className="rounded-lg p-1 transition-colors group-hover/dislike:bg-red-50">
                      <ThumbsDown className="h-4 w-4 transition-transform group-hover/dislike:scale-110" />
                    </div>
                    <span className="font-medium">{notHelpful}</span>
                  </button>

                  <button className="ml-auto flex items-center gap-2 text-blue-600 transition-colors hover:text-blue-800">
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
}