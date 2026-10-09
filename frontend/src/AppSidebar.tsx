import { NavLink, Link } from "react-router-dom";

interface NavItem {
  to: string;
  num: string;
  label: string;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { to: "/", num: "01", label: "OVERVIEW", exact: true },
  { to: "/profile", num: "02", label: "BRAND PROFILE" },
  { to: "/social", num: "03", label: "SOCIAL MEDIA" },
  { to: "/apps", num: "04", label: "APP STORES" },
  { to: "/threats", num: "05", label: "THREATS" },
  { to: "/lookalikes", num: "06", label: "LOOK-ALIKE DETECTION" },
  { to: "/check", num: "07", label: "CHECK ANY NAME" },
];

export default function AppSidebar() {
  return (
    <aside className="aegis-spine" aria-label="Main navigation">
      <Link to="/" className="spine-brand-link" aria-label="Go to overview">
        <div className="spine-brand">
          <div className="spine-brand-mark">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="spine-radar-icon"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" opacity="0.35" />
              <circle cx="12" cy="12" r="5" stroke="currentColor" opacity="0.75" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
            <span className="spine-wordmark">AEGIS</span>
          </div>
          <p className="spine-subtitle">BrandShield</p>
        </div>
      </Link>

      <nav className="spine-nav" aria-label="Primary navigation">
        <div className="spine-hairline" aria-hidden="true" />
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => `spine-node ${isActive ? "active" : ""}`}
          >
            <span className="spine-node-indicator">
              <span className="spine-node-num">{item.num}</span>
            </span>
            <span className="spine-node-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="active-monitoring" role="status">
        <span className="monitoring-dot" aria-hidden="true" />
        <span className="monitoring-text">Monitoring active</span>
      </div>
    </aside>
  );
}
