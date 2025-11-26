import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error; info?: React.ErrorInfo };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ info });
    // simples log para diagnóstico
    console.error("ErrorBoundary catch:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontSize: 18, color: "#b00020", background: "#ffecec" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Falha ao renderizar a interface.</div>
          <div>Erro: {String(this.state.error?.message || this.state.error)}</div>
          {this.state.info && (
            <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{this.state.info.componentStack}</pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

