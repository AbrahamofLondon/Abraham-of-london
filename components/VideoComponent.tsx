import React from "react";

type VideoComponentProps = {
  /** Full embed URL (YouTube/Vimeo/etc.) */
  src: string;
  /** Accessible title for the iframe */
  title: string;
  /** Aspect ratio like "16/9" or "4/3" */
  aspect?: string;
  /** Allow fullscreen */
  allowFullScreen?: boolean;
  /** Extra CSS classes on the wrapper */
  className?: string;
};

const VideoComponent: React.FC<VideoComponentProps> = ({
  src,
  title,
  aspect = "16/9",
  allowFullScreen = true,
  className = "",
}) => {
  // Defensive: never render without a valid URL
  if (!src) return null;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <iframe
        src={src}
        title={title || "Embedded video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={allowFullScreen}
        loading="lazy"
        className="absolute left-0 top-0 h-full w-full border-0"
      />
    </div>
  );
};

export default VideoComponent;
