import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Dashboard.css";

const NAV_ITEMS = [
  { to: "/dashboard", end: true, label: "Inventário" },
  { to: "/dashboard/analytics", end: false, label: "Analytics" },
];

export function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <Link to="/" className="dashboard-logo">Painel do Café</Link>
          <nav className="dashboard-nav">
            {NAV_ITEMS.map(({ to, end, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `dashboard-nav-link ${isActive ? "dashboard-nav-link--active" : ""}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="dashboard-user">
            <span className="dashboard-user-email">{user?.email}</span>
            <button
              type="button"
              className="dashboard-signout"
              onClick={handleSignOut}
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
