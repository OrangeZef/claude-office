/**
 * Error Boundary for PixiJS Canvas
 *
 * Catches rendering errors from the PixiJS canvas and displays
 * a styled error screen with a restart button.
 */

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class OfficeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[OfficeErrorBoundary] Caught error:", error, errorInfo);
  }

  handleRestart = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#0d0d0d",
            color: "#eab308",
            fontFamily: "monospace",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Office crashed!
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#94a3b8",
              marginBottom: "2rem",
              maxWidth: "400px",
            }}
          >
            {this.state.error?.message || "An unexpected error occurred in the office renderer."}
          </p>
          <button
            onClick={this.handleRestart}
            style={{
              padding: "0.75rem 2rem",
              backgroundColor: "#eab308",
              color: "#000",
              border: "none",
              borderRadius: "0.5rem",
              fontFamily: "monospace",
              fontSize: "0.875rem",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
              boxShadow: "0 4px 0 #b45309, 0 6px 12px rgba(234,179,8,0.4)",
            }}
          >
            Restart
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
