'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

interface CommentAuthor {
  name: string;
  avatar?: string;
  role?: string;
  initials?: string;
}

interface Comment {
  id: string;
  author: CommentAuthor;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface ShortCommentsProps {
  shortId: string;
  comments?: Comment[];
  maxDepth?: number;
  onCommentSubmit?: (comment: Omit<Comment, 'id' | 'timestamp' | 'likes' | 'isLiked'>) => void;
  onReplySubmit?: (parentId: string, reply: Omit<Comment, 'id' | 'timestamp' | 'likes' | 'isLiked'>) => void;
  onLikeToggle?: (commentId: string, isLiked: boolean) => void;
  currentUser?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  isAuthenticated?: boolean;
  className?: string;
}

// ============================================================================
// Icons (Refined)
// ============================================================================

const Icons = {
  Heart: ({ className, filled }: { className?: string; filled?: boolean }) => (
    <svg
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  ),
  
  Reply: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
      />
    </svg>
  ),
  
  User: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  ),
  
  Chat: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
  ),
  
  ChevronDown: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  ),
  
  Send: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  ),
};

// ============================================================================
// Utility Functions
// ============================================================================

const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) return 'Just now';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ============================================================================
// Subcomponents
// ============================================================================

interface AvatarProps {
  author: CommentAuthor;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ author, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = useMemo(
    () => author.initials || getInitials(author.name),
    [author.name, author.initials]
  );

  if (author.avatar) {
    return (
      <img
        src={author.avatar}
        alt={author.name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white dark:ring-gray-800`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]} rounded-full bg-gradient-to-br from-amber-100 to-amber-200 
        dark:from-amber-900/40 dark:to-amber-800/40
        flex items-center justify-center font-medium text-amber-900 dark:text-amber-200
        ring-2 ring-white dark:ring-gray-800
      `}
    >
      {initials}
    </div>
  );
};

interface LikeButtonProps {
  likes: number;
  isLiked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const LikeButton: React.FC<LikeButtonProps> = ({ likes, isLiked, onToggle, disabled }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      disabled={disabled}
      className={`
        group flex items-center gap-1.5 px-2 py-1 rounded-full
        transition-all duration-200
        ${isLiked 
          ? 'text-rose-600 dark:text-rose-400' 
          : 'text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      aria-label={isLiked ? 'Unlike comment' : 'Like comment'}
    >
      <Icons.Heart
        className="w-4 h-4 transition-transform group-hover:scale-110"
        filled={isLiked}
      />
      <span className="text-xs font-medium tabular-nums">{likes}</span>
    </motion.button>
  );
};

interface CommentFormProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  initialValue?: string;
  autoFocus?: boolean;
  isReply?: boolean;
  currentUser?: CommentAuthor;
  isAuthenticated?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  placeholder = 'Share your thoughts...',
  submitLabel = 'Post',
  initialValue = '',
  autoFocus = false,
  isReply = false,
  currentUser,
  isAuthenticated = true,
}) => {
  const [content, setContent] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && isAuthenticated) {
      onSubmit(content.trim());
      setContent('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <Avatar author={currentUser || { name: 'Guest' }} size="sm" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please{' '}
          <button className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium underline underline-offset-2">
            sign in
          </button>{' '}
          to join the discussion.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <Avatar author={currentUser || { name: 'You' }} size="sm" />
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            rows={isReply ? 2 : 3}
            className={`
              w-full px-4 py-3 bg-white dark:bg-gray-800 
              border rounded-xl resize-none
              transition-all duration-200
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              ${isFocused
                ? 'border-amber-300 dark:border-amber-700 ring-4 ring-amber-50 dark:ring-amber-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
              focus:outline-none
            `}
          />
          {content.trim() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-3 bottom-3"
            >
              <button
                type="submit"
                className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                aria-label="Send comment"
              >
                <Icons.Send className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
      
      {(onCancel || content.trim()) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-2 pl-[52px]"
        >
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
          {content.trim() && (
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitLabel}
            </button>
          )}
        </motion.div>
      )}
    </form>
  );
};

interface CommentNodeProps {
  comment: Comment;
  depth?: number;
  maxDepth?: number;
  onReply: (parentId: string, content: string) => void;
  onLike: (commentId: string) => void;
  onToggleReplies: (commentId: string) => void;
  expandedReplies: Set<string>;
  currentUser?: CommentAuthor;
  isAuthenticated?: boolean;
}

const CommentNode: React.FC<CommentNodeProps> = ({
  comment,
  depth = 0,
  maxDepth = 3,
  onReply,
  onLike,
  onToggleReplies,
  expandedReplies,
  currentUser,
  isAuthenticated,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isExpanded = expandedReplies.has(comment.id);
  const canReply = depth < maxDepth;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={depth > 0 ? 'relative' : ''}
    >
      {/* Thread line for nested comments */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-amber-200 to-transparent dark:from-amber-800"
          style={{ left: '-1.5rem' }}
        />
      )}

      <div className="flex gap-3">
        <Avatar author={comment.author} size={depth === 0 ? 'md' : 'sm'} />
        
        <div className="flex-1 min-w-0">
          {/* Comment header */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {comment.author.name}
            </span>
            {comment.author.role && (
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-full">
                {comment.author.role}
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(comment.timestamp)}
            </span>
          </div>

          {/* Comment content */}
          <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mb-3">
            <LikeButton
              likes={comment.likes}
              isLiked={comment.isLiked}
              onToggle={() => onLike(comment.id)}
            />

            {canReply && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1.5 px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm"
              >
                <Icons.Reply className="w-4 h-4" />
                <span>Reply</span>
              </motion.button>
            )}

            {hasReplies && (
              <button
                onClick={() => onToggleReplies(comment.id)}
                className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icons.ChevronDown className="w-4 h-4" />
                </motion.span>
                <span>
                  {isExpanded ? 'Hide' : 'Show'} {comment.replies?.length} {comment.replies?.length === 1 ? 'reply' : 'replies'}
                </span>
              </button>
            )}
          </div>

          {/* Reply form */}
          <AnimatePresence>
            {showReplyForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <CommentForm
                  onSubmit={(content) => {
                    onReply(comment.id, content);
                    setShowReplyForm(false);
                  }}
                  onCancel={() => setShowReplyForm(false)}
                  placeholder={`Reply to ${comment.author.name}...`}
                  submitLabel="Reply"
                  isReply
                  autoFocus
                  currentUser={currentUser}
                  isAuthenticated={isAuthenticated}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nested replies */}
          <AnimatePresence>
            {hasReplies && isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 space-y-4"
              >
                {comment.replies?.map((reply) => (
                  <CommentNode
                    key={reply.id}
                    comment={reply}
                    depth={depth + 1}
                    maxDepth={maxDepth}
                    onReply={onReply}
                    onLike={onLike}
                    onToggleReplies={onToggleReplies}
                    expandedReplies={expandedReplies}
                    currentUser={currentUser}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ShortComments: React.FC<ShortCommentsProps> = ({
  shortId,
  comments: initialComments = [],
  maxDepth = 3,
  onCommentSubmit,
  onReplySubmit,
  onLikeToggle,
  currentUser = { name: 'You' },
  isAuthenticated = false,
  className = '',
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Update comments when initialComments changes
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleCommentSubmit = useCallback((content: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      author: currentUser,
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      replies: [],
    };

    setComments(prev => [newComment, ...prev]);
    onCommentSubmit?.({ author: currentUser, content });
  }, [currentUser, onCommentSubmit]);

  const handleReplySubmit = useCallback((parentId: string, content: string) => {
    const newReply: Comment = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      author: currentUser,
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
      isLiked: false,
    };

    setComments(prev => 
      prev.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply],
          };
        }
        return comment;
      })
    );

    onReplySubmit?.(parentId, { author: currentUser, content });
    
    // Auto-expand replies when a new reply is added
    setExpandedReplies(prev => {
      const next = new Set(prev);
      next.add(parentId);
      return next;
    });
  }, [currentUser, onReplySubmit]);

  const handleLike = useCallback((commentId: string) => {
    const updateLikes = (comment: Comment): Comment => {
      if (comment.id === commentId) {
        const newIsLiked = !comment.isLiked;
        const newLikes = newIsLiked ? comment.likes + 1 : comment.likes - 1;
        onLikeToggle?.(commentId, newIsLiked);
        return { ...comment, isLiked: newIsLiked, likes: newLikes };
      }
      if (comment.replies) {
        return { ...comment, replies: comment.replies.map(updateLikes) };
      }
      return comment;
    };

    setComments(prev => prev.map(updateLikes));
  }, [onLikeToggle]);

  const toggleReplies = useCallback((commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }, []);

  const commentCount = comments.length;

  return (
    <section
      className={`
        bg-white dark:bg-gray-900
        rounded-2xl border border-gray-100 dark:border-gray-800
        shadow-sm
        overflow-hidden
        ${className}
      `}
      aria-label="Comments section"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-gray-900 dark:text-gray-100">
              Discussion
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Share your thoughts on this short
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full">
            <Icons.Chat className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
            </span>
          </div>
        </div>
      </div>

      {/* New Comment Form */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <CommentForm
          onSubmit={handleCommentSubmit}
          placeholder="Share your thoughts..."
          submitLabel="Post Comment"
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Comments List */}
      <div className="px-6 py-5">
        <AnimatePresence mode="popLayout">
          {commentCount > 0 ? (
            <motion.div className="space-y-6">
              {comments.map((comment) => (
                <CommentNode
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  maxDepth={maxDepth}
                  onReply={handleReplySubmit}
                  onLike={handleLike}
                  onToggleReplies={toggleReplies}
                  expandedReplies={expandedReplies}
                  currentUser={currentUser}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Icons.Chat className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No comments yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Be the first to share your thoughts on this short.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ShortComments;