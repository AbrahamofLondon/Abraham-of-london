"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  onCommentSubmit?: (
    comment: Omit<Comment, "id" | "timestamp" | "likes" | "isLiked">
  ) => void;
  onReplySubmit?: (
    parentId: string,
    reply: Omit<Comment, "id" | "timestamp" | "likes" | "isLiked">
  ) => void;
  onLikeToggle?: (commentId: string, isLiked: boolean) => void;
  currentUser?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  isAuthenticated?: boolean;
  className?: string;
}

const EMPTY_COMMENTS: Comment[] = [];
const DEFAULT_CURRENT_USER: CommentAuthor = { name: "You" };

const Icons = {
  Heart: ({ className, filled }: { className?: string; filled?: boolean }) => (
    <svg
      className={className}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  ),

  Reply: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
      />
    </svg>
  ),

  Chat: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
  ),

  ChevronDown: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  ),

  Send: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  ),
};

const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) return "Just now";

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (Number.isNaN(date.getTime())) return "Just now";

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
};

const makeId = (prefix: string): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

function insertReplyTree(
  comments: Comment[],
  parentId: string,
  reply: Comment
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies || []), reply],
      };
    }

    if (comment.replies?.length) {
      return {
        ...comment,
        replies: insertReplyTree(comment.replies, parentId, reply),
      };
    }

    return comment;
  });
}

function toggleLikeTree(
  comments: Comment[],
  commentId: string,
  onLikeToggle?: (commentId: string, isLiked: boolean) => void
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      const nextLiked = !comment.isLiked;
      const nextLikes = nextLiked ? comment.likes + 1 : Math.max(0, comment.likes - 1);
      onLikeToggle?.(commentId, nextLiked);
      return {
        ...comment,
        isLiked: nextLiked,
        likes: nextLikes,
      };
    }

    if (comment.replies?.length) {
      return {
        ...comment,
        replies: toggleLikeTree(comment.replies, commentId, onLikeToggle),
      };
    }

    return comment;
  });
}

interface AvatarProps {
  author: CommentAuthor;
  size?: "sm" | "md" | "lg";
}

const Avatar: React.FC<AvatarProps> = ({ author, size = "md" }) => {
  const sizeClasses = {
    sm: "h-9 w-9 text-[11px]",
    md: "h-11 w-11 text-xs",
    lg: "h-12 w-12 text-sm",
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
        className={`${sizeClasses[size]} rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10 shadow-[0_6px_20px_rgba(0,0,0,0.16)]`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={[
        sizeClasses[size],
        "rounded-full flex items-center justify-center font-semibold tracking-[0.18em] uppercase",
        "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%),linear-gradient(135deg,rgba(163,127,61,0.18),rgba(17,24,39,0.96))]",
        "text-[#D4B06A] ring-1 ring-[#C9A96A]/30 shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
      ].join(" ")}
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

const LikeButton: React.FC<LikeButtonProps> = ({
  likes,
  isLiked,
  onToggle,
  disabled,
}) => (
  <motion.button
    whileTap={{ scale: 0.96 }}
    onClick={onToggle}
    disabled={disabled}
    className={[
      "group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all duration-200",
      "border backdrop-blur-sm",
      isLiked
        ? "border-[#C9A96A]/35 bg-[#C9A96A]/10 text-[#B8872E] dark:text-[#D4B06A]"
        : "border-black/10 bg-black/[0.025] text-black/55 hover:border-[#C9A96A]/30 hover:text-black/80 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55 dark:hover:text-white/80",
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
    ].join(" ")}
    aria-label={isLiked ? "Unlike comment" : "Like comment"}
  >
    <Icons.Heart
      className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
      filled={isLiked}
    />
    <span className="tabular-nums">{likes}</span>
  </motion.button>
);

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
  placeholder = "Add a considered response…",
  submitLabel = "Post",
  initialValue = "",
  autoFocus = false,
  isReply = false,
  currentUser,
  isAuthenticated = true,
}) => {
  const [content, setContent] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) textareaRef.current.focus();
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || !isAuthenticated) return;
    onSubmit(trimmed);
    setContent("");
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(250,250,248,0.88))] p-4 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.88))]">
        <div className="flex items-center gap-3">
          <Avatar author={currentUser || DEFAULT_CURRENT_USER} size="sm" />
          <p className="text-sm leading-relaxed text-black/60 dark:text-white/60">
            Please{" "}
            <button className="font-medium text-[#A37F3D] transition-colors hover:text-[#8A682F] dark:text-[#D4B06A] dark:hover:text-[#E1C389]">
              sign in
            </button>{" "}
            to join the discussion.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <Avatar author={currentUser || DEFAULT_CURRENT_USER} size="sm" />

        <div className="flex-1">
          <div
            className={[
              "relative overflow-hidden rounded-2xl border transition-all duration-200",
              "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,247,243,0.96))]",
              "dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.92))]",
              isFocused
                ? "border-[#C9A96A]/45 shadow-[0_0_0_4px_rgba(201,169,106,0.10)]"
                : "border-black/10 hover:border-black/15 dark:border-white/10 dark:hover:border-white/15",
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96A]/40 to-transparent" />

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              rows={isReply ? 2 : 4}
              className="min-h-[88px] w-full resize-none bg-transparent px-4 py-3 text-[14px] leading-7 text-black/80 placeholder:text-black/35 focus:outline-none dark:text-white/85 dark:placeholder:text-white/30"
            />

            <div className="flex items-center justify-between border-t border-black/5 px-4 py-2 dark:border-white/5">
              <span className="text-[11px] uppercase tracking-[0.18em] text-black/35 dark:text-white/30">
                Civil, sharp, useful.
              </span>

              {content.trim() && (
                <motion.button
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#C9A96A]/35 bg-[#A37F3D] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition-all hover:bg-[#8A682F]"
                  aria-label="Send comment"
                >
                  <Icons.Send className="h-4 w-4" />
                  {submitLabel}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {(onCancel || content.trim()) && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-2 pl-12"
        >
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-4 py-2 text-sm text-black/55 transition-colors hover:text-black/80 dark:text-white/55 dark:hover:text-white/80"
            >
              Cancel
            </button>
          )}

          {content.trim() && (
            <button
              type="submit"
              className="rounded-xl border border-[#C9A96A]/30 bg-[#A37F3D] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#8A682F]"
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
  const hasReplies = Boolean(comment.replies?.length);
  const isExpanded = expandedReplies.has(comment.id);
  const canReply = depth < maxDepth;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={depth > 0 ? "relative" : ""}
    >
      {depth > 0 && (
        <div
          className="absolute bottom-0 top-0 w-px bg-gradient-to-b from-[#C9A96A]/35 via-black/10 to-transparent dark:via-white/10"
          style={{ left: "-1.35rem" }}
          aria-hidden="true"
        />
      )}

      <div className="flex gap-3">
        <Avatar author={comment.author} size={depth === 0 ? "md" : "sm"} />

        <div className="min-w-0 flex-1">
          <div
            className={[
              "rounded-2xl border px-4 py-3",
              "bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,248,244,0.92))]",
              "dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(2,6,23,0.82))]",
              "border-black/8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:border-white/8 dark:shadow-[0_16px_40px_rgba(0,0,0,0.22)]",
            ].join(" ")}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-semibold tracking-[0.01em] text-black/90 dark:text-white/90">
                {comment.author.name}
              </span>

              {comment.author.role && (
                <span className="rounded-full border border-[#C9A96A]/30 bg-[#C9A96A]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A37F3D] dark:text-[#D4B06A]">
                  {comment.author.role}
                </span>
              )}

              <span className="text-[11px] uppercase tracking-[0.16em] text-black/35 dark:text-white/35">
                {formatTimestamp(comment.timestamp)}
              </span>
            </div>

            <p className="mb-4 text-[14px] leading-7 text-black/72 dark:text-white/75">
              {comment.content}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <LikeButton
                likes={comment.likes}
                isLiked={comment.isLiked}
                onToggle={() => onLike(comment.id)}
              />

              {canReply && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowReplyForm((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black/[0.025] px-3 py-1.5 text-[12px] font-medium text-black/58 transition-colors hover:text-black/80 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/58 dark:hover:text-white/80"
                >
                  <Icons.Reply className="h-4 w-4" />
                  Reply
                </motion.button>
              )}

              {hasReplies && (
                <button
                  onClick={() => onToggleReplies(comment.id)}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.14em] text-[#A37F3D] transition-colors hover:text-[#8A682F] dark:text-[#D4B06A] dark:hover:text-[#E1C389]"
                >
                  <motion.span
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icons.ChevronDown className="h-4 w-4" />
                  </motion.span>
                  {isExpanded ? "Hide" : "Show"} {comment.replies?.length}{" "}
                  {comment.replies?.length === 1 ? "reply" : "replies"}
                </button>
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showReplyForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                className="overflow-hidden pt-4"
              >
                <CommentForm
                  onSubmit={(content) => {
                    onReply(comment.id, content);
                    setShowReplyForm(false);
                  }}
                  onCancel={() => setShowReplyForm(false)}
                  placeholder={`Reply to ${comment.author.name}…`}
                  submitLabel="Reply"
                  isReply
                  autoFocus
                  currentUser={currentUser}
                  isAuthenticated={isAuthenticated}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {hasReplies && isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 space-y-4 pl-6"
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
    </motion.article>
  );
};

const ShortComments: React.FC<ShortCommentsProps> = ({
  shortId,
  comments: initialComments,
  maxDepth = 3,
  onCommentSubmit,
  onReplySubmit,
  onLikeToggle,
  currentUser = DEFAULT_CURRENT_USER,
  isAuthenticated = false,
  className = "",
}) => {
  const safeInitialComments = initialComments ?? EMPTY_COMMENTS;

  const [comments, setComments] = useState<Comment[]>(safeInitialComments);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  useEffect(() => {
    setComments((prev) => (prev === safeInitialComments ? prev : safeInitialComments));
  }, [safeInitialComments]);

  const handleCommentSubmit = useCallback(
    (content: string) => {
      const newComment: Comment = {
        id: makeId(`comment-${shortId}`),
        author: currentUser,
        content,
        timestamp: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        replies: [],
      };

      setComments((prev) => [newComment, ...prev]);
      onCommentSubmit?.({ author: currentUser, content, replies: [] });
    },
    [currentUser, onCommentSubmit, shortId]
  );

  const handleReplySubmit = useCallback(
    (parentId: string, content: string) => {
      const newReply: Comment = {
        id: makeId(`reply-${shortId}`),
        author: currentUser,
        content,
        timestamp: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        replies: [],
      };

      setComments((prev) => insertReplyTree(prev, parentId, newReply));
      onReplySubmit?.(parentId, { author: currentUser, content, replies: [] });

      setExpandedReplies((prev) => {
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
    },
    [currentUser, onReplySubmit, shortId]
  );

  const handleLike = useCallback(
    (commentId: string) => {
      setComments((prev) => toggleLikeTree(prev, commentId, onLikeToggle));
    },
    [onLikeToggle]
  );

  const toggleReplies = useCallback((commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  }, []);

  const totalCount = useMemo(() => {
    const countTree = (items: Comment[]): number =>
      items.reduce((acc, item) => acc + 1 + countTree(item.replies || []), 0);
    return countTree(comments);
  }, [comments]);

  return (
    <section
      className={[
        "relative overflow-hidden rounded-[28px] border",
        "border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,245,240,0.92))]",
        "shadow-[0_24px_80px_rgba(0,0,0,0.08)]",
        "dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.96))] dark:shadow-[0_32px_90px_rgba(0,0,0,0.34)]",
        className,
      ].join(" ")}
      aria-label="Comments section"
      data-short-id={shortId}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96A]/45 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,169,106,0.08),transparent_28%)]" />

      <div className="relative border-b border-black/8 px-6 py-6 dark:border-white/8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/25 bg-[#C9A96A]/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A37F3D] dark:text-[#D4B06A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96A]" />
              Reader Exchange
            </div>

            <h2 className="font-serif text-[1.45rem] font-semibold tracking-[0.01em] text-black/92 dark:text-white/92">
              Discussion
            </h2>

            <p className="mt-1 max-w-xl text-sm leading-6 text-black/55 dark:text-white/55">
              A place for measured insight, serious disagreement, and useful additions.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3.5 py-2 dark:border-white/10 dark:bg-white/[0.04]">
            <Icons.Chat className="h-4 w-4 text-black/45 dark:text-white/45" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-black/70 dark:text-white/70">
              {totalCount} {totalCount === 1 ? "comment" : "comments"}
            </span>
          </div>
        </div>
      </div>

      <div className="relative border-b border-black/8 px-6 py-6 dark:border-white/8">
        <CommentForm
          onSubmit={handleCommentSubmit}
          placeholder="Add a considered response…"
          submitLabel="Post Comment"
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
        />
      </div>

      <div className="relative px-6 py-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {comments.length > 0 ? (
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
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className="py-16 text-center"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-black/8 bg-black/[0.03] dark:border-white/8 dark:bg-white/[0.04]">
                <Icons.Chat className="h-7 w-7 text-black/30 dark:text-white/30" />
              </div>

              <h3 className="mb-2 font-serif text-xl font-semibold text-black/90 dark:text-white/90">
                No comments yet
              </h3>

              <p className="mx-auto max-w-md text-sm leading-6 text-black/50 dark:text-white/50">
                Be first. Add something worth reading.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ShortComments;