import { Component, ErrorInfo, ReactNode } from "react";
import { captureError } from "@shared/lib/monitoring";
import { ErrorState } from "./EmptyState";

interface Props {
  children: ReactNode;
  /** Promena ključa (npr. adresa stranice) briše grešku — prelazak na drugu stranicu radi */
  resetKey?: string;
}

// Greška pri prikazu jedne stranice ne sme da obori celu aplikaciju (beli ekran):
// meni ostaje, stranica pokazuje poruku, greška se prijavljuje.
export default class ErrorBoundary extends Component<Props, { error: Error | null; key?: string }> {
  state: { error: Error | null; key?: string } = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: { error: Error | null; key?: string }) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureError(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return <ErrorState message="Došlo je do greške na ovoj stranici. Osvežite stranicu; ako se ponovi, javite podršci." onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
