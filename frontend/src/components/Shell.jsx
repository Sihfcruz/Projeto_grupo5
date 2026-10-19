import { useEffect, useState } from "react";
import { request } from "../services/api.js";
import { getSession, clearSession, isDemo } from "../services/session.js";
import { useToast } from "./common.jsx";
const navigation = [
  ["dashboard", "Visão geral", "◫"],
  ["inventory", "Estoque", "▤"],
  ["registration", "Catálogo", "◇"],
  ["movements", "Movimentações", "⇄"],
  ["reports", "Relatórios", "▥"],
  ["users", "Equipe e cargos", "♙"],
];
export default function Shell({ page, children }) {
  const [menu, setMenu] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("nomade.theme") || "light";
    } catch {
      return "light";
    }
  });
  const toast = useToast();
  const session = getSession();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("nomade.theme", theme);
    } catch {
      /* Tema desta página */
    }
  }, [theme]);
  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") setMenu(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  async function logout() {
    if (exiting) return;
    setExiting(true);
    try {
      if (!isDemo() && session?.refreshToken)
        await request("/auth/logout", {
          method: "POST",
          body: { refreshToken: session.refreshToken },
          anonymous: true,
        });
    } catch {
      clearSession();
      toast(
        "Sessão local encerrada. O servidor não confirmou a revogação do acesso.",
      );
      setTimeout(() => location.replace("login.html?logout=unconfirmed"), 1800);
      return;
    }
    clearSession();
    location.replace("login.html");
  }
  return (
    <>
      <a className="skip-link" href="#content">
        Pular para o conteúdo
      </a>
      <div id="shell">
        <aside className={`sidebar ${menu ? "is-open" : ""}`} id="sidebar">
          <a className="brand" href="dashboard.html">
            <span className="brand-mark">N</span>
            <span>
              Nômade<small>Gestão de estoque</small>
            </span>
          </a>
          <p className="nav-label">ESPAÇO DE TRABALHO</p>
          <nav aria-label="Navegação principal">
            {navigation.map(([id, label, icon]) => (
              <a
                href={`${id}.html`}
                aria-current={id === page ? "page" : undefined}
                key={id}
              >
                <span className="nav-icon" aria-hidden="true">
                  {icon}
                </span>
                {label}
              </a>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="store-card">
              <span className="store-dot" />
              <div>
                Controle da loja<small>Estoque · vendas · equipe</small>
              </div>
            </div>
            <button
              id="theme-toggle"
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              ◐ <span>Alternar tema</span>
            </button>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <button
              className="icon-button mobile-menu"
              id="menu-toggle"
              aria-label="Abrir menu"
              aria-expanded={menu}
              aria-controls="sidebar"
              onClick={() => setMenu(!menu)}
            >
              ☰
            </button>
            <div className="breadcrumb">
              Nômade <span>/</span>{" "}
              <strong>{navigation.find(([id]) => id === page)?.[1]}</strong>
            </div>
            <div className="profile">
              <span className="avatar" aria-hidden="true">
                N
              </span>
              <span id="profile-name">
                {isDemo()
                  ? "Visitante"
                  : session?.funcionario?.nome ||
                    session?.funcionario?.email ||
                    "Minha conta"}
              </span>
              <button
                id="logout"
                className="text-button"
                type="button"
                disabled={exiting}
                onClick={logout}
              >
                Sair
              </button>
            </div>
          </header>
          {isDemo() && (
            <div className="demo-banner" id="demo-banner">
              <strong>Modo demonstração</strong>
              <span>Dados fictícios · somente consulta</span>
              <a href="login.html">Entrar na conta →</a>
            </div>
          )}
          <main id="content" tabIndex={-1}>
            {children}
          </main>
          <footer className="footer">
            Nômade <span>Organização em cada passo.</span>
          </footer>
        </div>
      </div>
    </>
  );
}
