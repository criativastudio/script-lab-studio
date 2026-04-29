import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] Render crash:", error, info?.componentStack);
  }

  handleReset = () => this.setState({ hasError: false, error: null });
  handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 shadow-lg text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Algo deu errado</h2>
            <p className="text-sm text-muted-foreground mt-1">
              A interface encontrou um erro inesperado. Você pode tentar novamente sem perder seu trabalho ou recarregar a página.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-muted-foreground/70 mt-3 font-mono break-words">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" onClick={this.handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
            <Button onClick={this.handleReload}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
