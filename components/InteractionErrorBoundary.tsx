// components/InteractionErrorBoundary.tsx
import * as React from 'react';

export class InteractionErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-4 text-gray-500 text-sm">
          Interaction features temporarily unavailable
        </div>
      );
    }

    return this.props.children;
  }
}
