import {
  useEffect,
  useState,
} from "react";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

//import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    logout,
  } = useAuth();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [darkMode, setDarkMode] =
    useState(() => {
      return (
        localStorage.getItem(
          "dairyDarkMode"
        ) === "true"
      );
    });

  const [profileOpen, setProfileOpen] =
    useState(false);

  useEffect(() => {
    document.body.classList.toggle(
      "dark-mode",
      darkMode
    );

    localStorage.setItem(
      "dairyDarkMode",
      String(darkMode)
    );
  }, [darkMode]);

  /*
    Close mobile sidebar whenever route changes.
  */
  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

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

  function toggleDarkMode() {
    setDarkMode(
      (previous) => !previous
    );
  }

  function getPageTitle() {
    const pageTitles = {
      "/dashboard": "Dashboard",
      "/members": "Members",
      "/collection":
        "Milk Collection",
      "/reports":
        "Reports & Registers",
      "/daily-report":
        "Daily Report",
      "/collection-register":
        "Collection Register",
      "/fat-snf-report":
        "FAT & SNF Report",
      "/feed-advance-report":
        "Feed & Advance Report",
      "/member-bill":
        "Member Bill",
      "/milk-summary":
        "Milk Summary",
      "/payment-register":
        "Payment Register",
      "/print-all-bills":
        "Print All Bills",
      "/bill-history":
        "Bill History",
      "/reserve-report":
        "Reserve Report",
      "/rate-master":
        "Rate Master",
      "/feed-management":
        "Feed Management",
      "/advance-management":
        "Advance Management",
      "/analytics":
        "Analytics",
      "/backup":
        "Backup & Restore",
      "/activity-logs":
        "Activity Logs",
    };

    return (
      pageTitles[location.pathname] ||
      "Dairy Management"
    );
  }

  const navigationGroups = [
    {
      title: "Main",
      items: [
        {
          path: "/dashboard",
          label: "Dashboard",
          icon: "🏠",
        },
        {
          path: "/members",
          label: "Members",
          icon: "👥",
        },
        {
          path: "/collection",
          label: "Milk Collection",
          icon: "🥛",
        },
      ],
    },

    {
      title: "Finance",
      items: [
        {
          path: "/feed-management",
          label: "Feed Management",
          icon: "🌾",
        },
        {
          path:
            "/advance-management",
          label:
            "Advance Management",
          icon: "💰",
        },
        {
          path: "/member-bill",
          label: "Member Bill",
          icon: "🧾",
        },
        {
          path: "/bill-history",
          label: "Bill History",
          icon: "📚",
        },
      ],
    },

    {
      title: "Reports",
      items: [
        {
          path: "/reports",
          label:
            "Reports & Registers",
          icon: "📑",
        },
        {
          path: "/analytics",
          label: "Analytics",
          icon: "📊",
        },
      ],
    },

    {
      title: "Administration",
      adminOnly: true,
      items: [
        {
          path: "/rate-master",
          label: "Rate Master",
          icon: "📈",
        },
        {
          path: "/activity-logs",
          label: "Activity Logs",
          icon: "📋",
        },
        {
          path: "/backup",
          label:
            "Backup & Restore",
          icon: "💾",
        },
      ],
    },
  ];

  function isPathActive(path) {
    if (path === "/reports") {
      const reportPaths = [
        "/reports",
        "/daily-report",
        "/collection-register",
        "/fat-snf-report",
        "/feed-advance-report",
        "/milk-summary",
        "/payment-register",
        "/print-all-bills",
        "/reserve-report",
      ];

      return reportPaths.includes(
        location.pathname
      );
    }

    return location.pathname === path;
  }

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close sidebar"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* Sidebar */}
      <aside
        className={
          sidebarOpen
            ? "app-sidebar sidebar-open"
            : "app-sidebar"
        }
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            🥛
          </div>

          <div className="sidebar-brand-text">
            <strong>
              Dairy Management
            </strong>

            <span>
              Smart Collection System
            </span>
          </div>

          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            ×
          </button>
        </div>

        <nav className="sidebar-navigation">
          {navigationGroups.map(
            (group) => {
              if (
                group.adminOnly &&
                user?.role !== "Admin"
              ) {
                return null;
              }

              return (
                <div
                  className="sidebar-group"
                  key={group.title}
                >
                  <p className="sidebar-group-title">
                    {group.title}
                  </p>

                  {group.items.map(
                    (item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={() =>
                          isPathActive(
                            item.path
                          )
                            ? "sidebar-link active"
                            : "sidebar-link"
                        }
                      >
                        <span className="sidebar-link-icon">
                          {item.icon}
                        </span>

                        <span className="sidebar-link-label">
                          {item.label}
                        </span>
                      </NavLink>
                    )
                  )}
                </div>
              );
            }
          )}
        </nav>

        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            {user?.name
              ?.charAt(0)
              .toUpperCase() || "U"}
          </div>

          <div className="sidebar-user-info">
            <strong>
              {user?.name ||
                "Dairy User"}
            </strong>

            <span>
              {user?.role || "User"}
            </span>
          </div>

          <button
            type="button"
            title="Logout"
            onClick={handleLogout}
          >
            ↪
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() =>
                setSidebarOpen(true)
              }
            >
              ☰
            </button>

            <div>
              <span className="topbar-eyebrow">
                Dairy Management System
              </span>

              <h2>{getPageTitle()}</h2>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="topbar-date">
              <span>📅</span>

              <div>
                <small>Today</small>

                <strong>
                  {new Date().toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="topbar-icon-button"
              aria-label={
                darkMode
                  ? "Enable light mode"
                  : "Enable dark mode"
              }
              onClick={toggleDarkMode}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

          {/* <NotificationBell /> */}

            <div className="topbar-profile-wrapper">
              <button
                type="button"
                className="topbar-profile"
                onClick={() =>
                  setProfileOpen(
                    (previous) =>
                      !previous
                  )
                }
              >
                <span className="topbar-profile-avatar">
                  {user?.name
                    ?.charAt(0)
                    .toUpperCase() ||
                    "U"}
                </span>

                <span className="topbar-profile-text">
                  <strong>
                    {user?.name ||
                      "Dairy User"}
                  </strong>

                  <small>
                    {user?.role ||
                      "User"}
                  </small>
                </span>

                <span className="topbar-profile-arrow">
                  ▾
                </span>
              </button>

              {profileOpen && (
                <div className="topbar-profile-menu">
                  <div className="profile-menu-header">
                    <strong>
                      {user?.name}
                    </strong>

                    <span>
                      {user?.username}
                    </span>
                  </div>

                  <div className="profile-menu-role">
                    <span>Role</span>

                    <strong>
                      {user?.role}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                  >
                    <span>↪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;