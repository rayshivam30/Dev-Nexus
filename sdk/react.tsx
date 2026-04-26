import React, { Component, ErrorInfo, ReactNode } from "react";
import { DevNexus, IssueSeverity } from "./index";

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Optional metadata to include with errors caught by this boundary */
  metadata?: Record<string, unknown>;
  /** Custom tags for this boundary (e.g. { component: "CheckoutPage" }) */
  tags?: Record<string, string>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * DevNexusErrorBoundary
 * A React component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors to DevNexus, and displays a fallback UI.
 */
export class DevNexusErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Capture the exception with React-specific context
    DevNexus.captureException(error, {
      severity: IssueSeverity.HIGH,
      tags: { 
        source: "react-error-boundary",
        ...this.props.tags 
      },
      metadata: {
        componentStack: errorInfo.componentStack,
        ...this.props.metadata
      }
    });
  }

  resetBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error, this.resetBoundary);
      }
      return this.props.fallback || (
        <div style={{ padding: "2rem", border: "4px solid black", background: "white", margin: "1rem" }}>
          <h2 style={{ fontWeight: 900, textTransform: "uppercase" }}>Something went wrong_</h2>
          <p style={{ fontSize: "0.8rem", fontWeight: "bold" }}>The incident has been reported to the nexus.</p>
          <button 
            onClick={this.resetBoundary}
            style={{ background: "black", color: "white", padding: "0.5rem 1rem", border: "none", fontWeight: 900, cursor: "pointer" }}
          >
            RETRY.EXE
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
