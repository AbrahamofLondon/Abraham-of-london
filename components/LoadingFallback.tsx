import * as React from "react";

export default function LoadingFallback(): React.ReactElement {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
      <span className="animate-pulse">Loading...</span>
    </div>
  );
}