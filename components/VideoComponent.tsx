// components/VideoComponent.tsx
import * as React from "react";
import clsx from "clsx";

type Aspect = "16:9" | "4:3" | "1:1";
type Fit = "cover" | "contain";
type Position = "center" | "left" | "right" | "top" | "bottom";

type CustomProps = {
  /** Source URL for the video */
  src: string;

  /** Visual frame ratio (applies to the wrapper) */
  aspect?: Aspect;

  /** object-fit for the video element */
  fit?: Fit;

  /** object-position for the video element */
  position?: Position;

  /** Extra classes for the outer frame (wrapper) */
  frameClassName?: string;
};

/** Accept all native <video> attributes (incl. `poster`) + custom layout props */
export type VideoComponentProps = CustomProps &
  React.VideoHTMLAttributes<HTMLVideoElement>;

function aspectClass(aspect: Aspect = "16:9"): string {
  switch (aspect) {
    case "1:1":
      return "aspect-[1/1]";
    case "4:3":
      return "aspect-[4/3]";
    case "16:9":
    default:
      return "aspect-[16/9]";
  }
}

function positionClass(pos: Position = "center"): string {
  switch (pos) {
    case "left":
      return "object-left";
    case "right":
      return "object-right";
    case "top":
      return "object-top";
    case "bottom":
      return "object-bottom";
    case "center":
    default:
      return "object-center";
  }
}

const VideoComponent = React.forwardRef<HTMLVideoElement, VideoComponentProps>(
  (
    {
      src,
      poster,
      controls = true,
      preload = "metadata",
      autoPlay,
      playsInline = true,
      muted,
      className, // applies to the <video>
      frameClassName, // applies to the wrapper
      aspect = "16:9",
      fit = "cover",
      position = "center",
      ...rest
    },
    ref,
  ) => {
    // If devs set autoPlay without muted, browsers will often block; nudge to muted.
    const effectiveMuted = autoPlay ? true : muted;

    return (
      <div
        className={clsx(
          "relative w-full overflow-hidden rounded-2xl",
          aspectClass(aspect),
          frameClassName,
        )}
      >
        <video
          ref={ref}
          className={clsx(
            "absolute inset-0 h-full w-full",
            fit === "cover" ? "object-cover" : "object-contain",
            positionClass(position),
            className,
          )}
          src={src}
          poster={poster}
          controls={controls}
          preloa
          d={preload}
          autoPlay={autoPlay}
          mute
          d={effectiveMuted}
          playsInline={playsInline}
          onContextMenu={(e) => e.preventDefault()}
          {...rest}
        />
      </div>
    );
  },
);

VideoComponent.displayName = "VideoComponent";
export default VideoComponent;


