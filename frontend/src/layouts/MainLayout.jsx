import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    logout,
    hasRole,
  } = useAuth();

  const [isCollapsed, setIsCollapsed] =
    useState(false);

  const [darkMode, setDarkMode] =
    useState(() => {
      return (
        localStorage.getItem(
          "dairyDarkMode"
        ) === "true"
      );
    });

  const [
    showProfileMenu,
    setShowProfileMenu,
  ] = useState(false);

  
  useEffect(() => {
    document.body.classList.toggle(
      "dark-mode",
      darkMode
    );

    localStorage.setItem(
      "dairyDarkMode",
      String(darkMode)
    );

    return () => {
      document.body.classList.remove(
        "dark-mode"
      );
    };
  }, [darkMode]);

  useEffect(() => {
    setShowProfileMenu(false);
  }, [location.pathname]);

 
  const menuItems = useMemo(
    () => [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: "📊",
      },
      {
        name: "Members",
        path: "/members",
        icon: "👥",
      },
      {
        name: "Collection",
        path: "/collection",
        icon: "🥛",
      },
      {
        name: "Reports",
        path: "/reports",
        icon: "📑",
        matchPrefix: true,
      },
      {
        name: "Rate Master",
        path: "/rate-master",
        icon: "📈",
        roles: ["Admin"],
      },
      {
        name: "Advance",
        path: "/advance-management",
        icon: "💰",
      },
      {
        name: "Feed",
        path: "/feed-management",
        icon: "🌾",
      },
      {
        name: "Analytics",
        path: "/analytics",
        icon: "📊",
      },
      {
        name: "Backup",
        path: "/backup",
        icon: "💾",
        roles: ["Admin"],
      },
    ],
    []
  );

  const visibleMenuItems =
    menuItems.filter((item) => {
      if (!item.roles) {
        return true;
      }

      return hasRole(...item.roles);
    });

  function toggleDarkMode() {
    setDarkMode((previous) => !previous);
  }

  function toggleSidebar() {
    setIsCollapsed(
      (previous) => !previous
    );
  }

  function handleLogout() {
    const confirmed =
      window.confirm(
        "Are you sure you want to log out?"
      );

    if (!confirmed) {
      return;
    }

    logout();

    navigate("/login", {
      replace: true,
    });
  }

  function getInitial() {
    const name =
      user?.name ||
      user?.username ||
      "User";

    return name
      .charAt(0)
      .toUpperCase();
  }

  function isReportsRouteActive() {
    const reportPaths = [
      "/reports",
      "/daily-report",
      "/collection-register",
      "/fat-snf-report",
      "/feed-advance-report",
      "/member-bill",
      "/milk-summary",
      "/payment-register",
      "/print-all-bills",
      "/bill-history",
      "/reserve-report",
    ];

    return reportPaths.some(
      (path) =>
        location.pathname === path ||
        location.pathname.startsWith(
          `${path}/`
        )
    );
  }

  function getMenuClass(item) {
    if (
      item.name === "Reports" &&
      isReportsRouteActive()
    ) {
      return "active-menu";
    }

    return "";
  }

  return (
    <div
      className={
        darkMode
          ? "app dark-mode"
          : "app"
      }
    >
      <nav className="navbar">
        <div className="nav-left">
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={
              isCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            onClick={toggleSidebar}
          >
            ☰
          </button>

          <div className="nav-brand">
            <span className="nav-brand-icon">
              🥛
            </span>

            <div>
              <h1>
                Dairy Management System
              </h1>

              <span className="nav-brand-subtitle">
                Smart Dairy Operations
              </span>
            </div>
          </div>
        </div>

        <div className="nav-right">
          <div className="nav-search-wrapper">
            <span>🔍</span>

            <input
              className="nav-search"
              type="text"
              placeholder="Search..."
              aria-label="Search"
            />
          </div>

          <button
            type="button"
            className="nav-icon-btn"
            aria-label="Notifications"
          >
            🔔
          </button>

          <button
            type="button"
            className="nav-icon-btn"
            aria-label={
              darkMode
                ? "Enable light mode"
                : "Enable dark mode"
            }
            onClick={toggleDarkMode}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          <div className="profile-menu-wrapper">
            <button
              type="button"
              className="profile-box"
              aria-expanded={
                showProfileMenu
              }
              onClick={() =>
                setShowProfileMenu(
                  (previous) =>
                    !previous
                )
              }
            >
              <span className="profile-avatar">
                {getInitial()}
              </span>

              <span className="profile-details">
                <strong className="profile-name">
                  {user?.name ||
                    user?.username ||
                    "User"}
                </strong>

                <small className="profile-role">
                  {user?.role || "User"}
                </small>
              </span>

              <span className="profile-arrow">
                {showProfileMenu
                  ? "▲"
                  : "▼"}
              </span>
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <span className="profile-dropdown-avatar">
                    {getInitial()}
                  </span>

                  <div>
                    <strong>
                      {user?.name ||
                        "User"}
                    </strong>

                    <span>
                      {user?.username}
                    </span>
                  </div>
                </div>

                <div className="profile-dropdown-info">
                  <div>
                    <span>Role</span>
                    <strong>
                      {user?.role ||
                        "User"}
                    </strong>
                  </div>

                  {user?.email && (
                    <div>
                      <span>Email</span>
                      <strong>
                        {user.email}
                      </strong>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="profile-logout-btn"
                  onClick={handleLogout}
                >
                  <span>↪</span>
                  Logout
                </button>
              </div>
            )}
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
          <div className="sidebar-heading">
            {!isCollapsed && (
              <>
                <span>Navigation</span>
                <h2>Menu</h2>
              </>
            )}
          </div>

          <ul className="sidebar-menu-list">
            {visibleMenuItems.map(
              (item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={
                      item.path ===
                      "/dashboard"
                    }
                    title={
                      isCollapsed
                        ? item.name
                        : ""
                    }
                    className={({
                      isActive,
                    }) => {
                      const manuallyActive =
                        getMenuClass(
                          item
                        );

                      if (
                        isActive ||
                        manuallyActive
                      ) {
                        return "active-menu";
                      }

                      return "";
                    }}
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
              )
            )}
          </ul>

          {!isCollapsed && (
            <div className="sidebar-user-card">
              <span className="sidebar-user-avatar">
                {getInitial()}
              </span>

              <div>
                <strong>
                  {user?.name ||
                    user?.username}
                </strong>

                <small>
                  {user?.role}
                </small>
              </div>
            </div>
          )}
        </aside>

        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;