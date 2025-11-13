import * as React from "react";

type Props = React.PropsWithChildren<{
  onError?: (e: Error) => void;
}>;

type State = { hasError: boolean };

export default class FontErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    if (this.props.onError) this.props.onError(error);
    // no-op: keep UI alive
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <div data-font-error className="text-sm text-gray-500">Font failed to load. Using fallback.</div>;
    }
    return this.props.children;
  }
}