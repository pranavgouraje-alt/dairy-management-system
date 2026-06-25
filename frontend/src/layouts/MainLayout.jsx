import { useState } from "react";
import { NavLink } from "react-router-dom";

function MainLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/", icon: "📊" },
    { name: "Members", path: "/members", icon: "👥" },
    { name: "Collection", path: "/collection", icon: "🥛" },
    { name: "Reports", path: "/reports", icon: "📑" },
    { name: "RateMaster", path: "/rate-master", icon: "📈" },
    { name: "Advance", path: "/advance-management", icon: "💰" },
    { name: "Feed", path: "/feed-management", icon: "🌾" },
    { name: "Analytics", path: "/analytics", icon: "📊" },
    { name: "Backup", path: "/backup", icon: "💾" },
  ];

  function toggleDarkMode() {
    setDarkMode(!darkMode);
  }

  return (
    <div className={darkMode ? "app dark-mode" : "app"}>
      <nav className="navbar">
        <div className="nav-left">
          <button
            className="sidebar-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            ☰
          </button>

          <h1>Dairy Management System</h1>
        </div>

        <div className="nav-right">
          <input
            className="nav-search"
            type="text"
            placeholder="Search..."
          />

          <button className="nav-icon-btn">🔔</button>

          <button
            className="nav-icon-btn"
            onClick={toggleDarkMode}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          <div className="profile-box">
            <span className="profile-avatar">A</span>
            <span className="profile-name">Admin</span>
          </div>
        </div>
      </nav>

      <div className="layout-container">
        <aside
          className={
            isCollapsed
              ? "sidebar collapsed-sidebar"
              : "sidebar"
          }
        >
          <h2>Menu</h2>

          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    isActive ? "active-menu" : ""
                  }
                >
                  <span className="menu-icon">
                    {item.icon}
                  </span>

                  {!isCollapsed && (
                    <span className="menu-text">
                      {item.name}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </aside>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;