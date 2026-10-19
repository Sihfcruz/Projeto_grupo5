import { Component, useEffect } from "react";
import { getSession, requireSession } from "./services/session.js";
import Shell from "./components/Shell.jsx";
import { ToastProvider } from "./components/common.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Inventory from "./pages/Inventory.jsx";
import Catalog from "./pages/Catalog.jsx";
import Movements from "./pages/Movements.jsx";
import Reports from "./pages/Reports.jsx";
import Users from "./pages/Users.jsx";
const pages = {
  dashboard: Dashboard,
  inventory: Inventory,
  registration: Catalog,
  movements: Movements,
  reports: Reports,
  users: Users,
};
export class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p className="error" role="alert">
        Não foi possível carregar esta página. Atualize para tentar novamente.
      </p>
    ) : (
      this.props.children
    );
  }
}
export default function App({ page = document.body.dataset.page }) {
  const session = getSession();
  const valid = !!session && (session.mode === "demo" || !!session.acessToken);
  useEffect(() => {
    if (page !== "login") requireSession();
  }, [page]);
  if (page === "login")
    return (
      <ErrorBoundary>
        <Login />
      </ErrorBoundary>
    );
  if (!valid) return null;
  const Page = pages[page];
  return (
    <ToastProvider>
      <Shell page={page}>
        <ErrorBoundary>
          {Page ? <Page /> : <p className="error">Página não encontrada.</p>}
        </ErrorBoundary>
      </Shell>
    </ToastProvider>
  );
}
