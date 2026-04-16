import * as React from "react";
import { IS_DEV } from "./utils";

export class MDXErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (message: string) => void;
  },
  { hasError: boolean; error: string | null }
> {
  constructor(
    props: {
      children: React.ReactNode;
      fallback?: React.ReactNode;
      onError?: (message: string) => void;
    },
  ) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  override componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    const message = error instanceof Error ? error.message : String(error);
    this.props.onError?.(message);

    if (IS_DEV) {
      console.error("[SafeMDXRenderer] Render error:", error, errorInfo);
    }
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="smdx-error">
          <div className="smdx-kicker">MDX Rendering Failed</div>
          <p className="smdx-copy">The content could not be rendered properly.</p>
          {IS_DEV && this.state.error ? <pre className="smdx-pre">{this.state.error}</pre> : null}
        </div>
      );
    }

    return this.props.children;
  }
}

export function EmptyState() {
  return (
    <div className="smdx-empty">
      <div className="smdx-kicker">No content to display</div>
    </div>
  );
}

export function SuspiciousCodeState({ code }: { code: string }) {
  return (
    <div className="smdx-warning">
      <div className="smdx-kicker">Content Payload Invalid</div>
      <p className="smdx-copy">
        The payload appears to be leaked module code rather than renderable MDX.
      </p>
      {IS_DEV ? <pre className="smdx-pre">{code.slice(0, 4000)}</pre> : null}
    </div>
  );
}
