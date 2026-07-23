import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorCard from "../components/ErrorCard";
import RecentActivities from "../components/RecentActivities";

import {
  getMembers,
} from "../services/memberService";

import {
  getCollections,
} from "../services/collectionService";

import {
  getFeedRecords,
} from "../services/feedService";

import {
  getAdvanceRecords,
} from "../services/advanceService";

import {
  getBills,
} from "../services/billService";

import {
  formatAmount,
} from "../utils/amountUtils";

import {
  useAuth,
} from "../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const [members, setMembers] =
    useState([]);

  const [
    collections,
    setCollections,
  ] = useState([]);

  const [
    feedRecords,
    setFeedRecords,
  ] = useState([]);

  const [
    advanceRecords,
    setAdvanceRecords,
  ] = useState([]);

  const [bills, setBills] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError("");

      const results =
        await Promise.allSettled([
          getMembers(),
          getCollections(),
          getFeedRecords(),
          getAdvanceRecords(),
          getBills(),
        ]);

      const [
        membersResult,
        collectionsResult,
        feedResult,
        advanceResult,
        billsResult,
      ] = results;

      if (
        membersResult.status ===
          "fulfilled" &&
        membersResult.value.success
      ) {
        setMembers(
          membersResult.value.data || []
        );
      }

      if (
        collectionsResult.status ===
          "fulfilled" &&
        collectionsResult.value.success
      ) {
        setCollections(
          collectionsResult.value.data ||
            []
        );
      }

      if (
        feedResult.status ===
          "fulfilled" &&
        feedResult.value.success
      ) {
        setFeedRecords(
          feedResult.value.data || []
        );
      }

      if (
        advanceResult.status ===
          "fulfilled" &&
        advanceResult.value.success
      ) {
        setAdvanceRecords(
          advanceResult.value.data || []
        );
      }

      if (
        billsResult.status ===
          "fulfilled" &&
        billsResult.value.success
      ) {
        setBills(
          billsResult.value.data || []
        );
      }

      const failedResult =
        results.find(
          (result) =>
            result.status === "rejected"
        );

      if (failedResult) {
        throw failedResult.reason;
      }
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );

      setError(
        error.message ||
          "Unable to load dashboard information"
      );
    } finally {
      setLoading(false);
    }
  }

  const todayCollections =
    useMemo(() => {
      return collections.filter(
        (collection) =>
          collection.collectionDate ===
          today
      );
    }, [collections, today]);

  const activeMembers =
    useMemo(() => {
      return members.filter(
        (member) =>
          member.status !== "Inactive"
      );
    }, [members]);

  const totalMilk =
    todayCollections.reduce(
      (total, collection) =>
        total +
        Number(
          collection.quantity || 0
        ),
      0
    );

  const totalAmount =
    todayCollections.reduce(
      (total, collection) =>
        total +
        Number(collection.amount || 0),
      0
    );

  const cowMilk =
    todayCollections
      .filter(
        (collection) =>
          collection.milkType === "Cow"
      )
      .reduce(
        (total, collection) =>
          total +
          Number(
            collection.quantity || 0
          ),
        0
      );

  const buffaloMilk =
    todayCollections
      .filter(
        (collection) =>
          collection.milkType ===
          "Buffalo"
      )
      .reduce(
        (total, collection) =>
          total +
          Number(
            collection.quantity || 0
          ),
        0
      );

  const morningMilk =
    todayCollections
      .filter(
        (collection) =>
          collection.session ===
          "Morning"
      )
      .reduce(
        (total, collection) =>
          total +
          Number(
            collection.quantity || 0
          ),
        0
      );

  const eveningMilk =
    todayCollections
      .filter(
        (collection) =>
          collection.session ===
          "Evening"
      )
      .reduce(
        (total, collection) =>
          total +
          Number(
            collection.quantity || 0
          ),
        0
      );

  const pendingFeedAmount =
    feedRecords
      .filter(
        (record) =>
          record.status !== "Paid" &&
          record.status !== "Deducted"
      )
      .reduce(
        (total, record) =>
          total +
          Number(
            record.remainingAmount ??
              record.amount ??
              0
          ),
        0
      );

  const pendingAdvanceAmount =
    advanceRecords
      .filter(
        (record) =>
          record.status !== "Cleared"
      )
      .reduce(
        (total, record) =>
          total +
          Number(
            record.remainingAmount ??
              record.amount ??
              0
          ),
        0
      );

  const generatedBillAmount =
    bills.reduce(
      (total, bill) =>
        total +
        Number(bill.netPayable || 0),
      0
    );

  const morningEntries =
    todayCollections.filter(
      (collection) =>
        collection.session ===
        "Morning"
    ).length;

  const eveningEntries =
    todayCollections.filter(
      (collection) =>
        collection.session ===
        "Evening"
    ).length;

  const dashboardCards = [
    {
      title: "Active Members",
      value: activeMembers.length,
      unit: "",
      icon: "👥",
      subtitle: `${members.length} total members`,
      color: "blue",
      path: "/members",
    },
    {
      title: "Today's Entries",
      value:
        todayCollections.length,
      unit: "",
      icon: "📋",
      subtitle:
        "Milk collection records",
      color: "purple",
      path: "/collection",
    },
    {
      title: "Total Milk",
      value: formatAmount(totalMilk),
      unit: "L",
      icon: "🥛",
      subtitle:
        "Today's total collection",
      color: "cyan",
      path: "/daily-report",
    },
    {
      title: "Collection Amount",
      value: `₹${formatAmount(
        totalAmount
      )}`,
      unit: "",
      icon: "₹",
      subtitle:
        "Today's collection value",
      color: "green",
      path: "/daily-report",
    },
    {
      title: "Cow Milk",
      value: formatAmount(cowMilk),
      unit: "L",
      icon: "🐄",
      subtitle:
        "Today's cow collection",
      color: "orange",
      path: "/milk-summary",
    },
    {
      title: "Buffalo Milk",
      value: formatAmount(
        buffaloMilk
      ),
      unit: "L",
      icon: "🐃",
      subtitle:
        "Today's buffalo collection",
      color: "indigo",
      path: "/milk-summary",
    },
    {
      title: "Pending Feed",
      value: `₹${formatAmount(
        pendingFeedAmount
      )}`,
      unit: "",
      icon: "🌾",
      subtitle:
        "Outstanding feed balance",
      color: "yellow",
      path: "/feed-management",
    },
    {
      title: "Pending Advance",
      value: `₹${formatAmount(
        pendingAdvanceAmount
      )}`,
      unit: "",
      icon: "💰",
      subtitle:
        "Outstanding advance balance",
      color: "red",
      path: "/advance-management",
    },
  ];

  const quickActions = [
    {
      title: "Add Collection",
      description:
        "Record morning or evening milk collection",
      icon: "🥛",
      path: "/collection",
      color: "blue",
    },
    {
      title: "Register Member",
      description:
        "Create a new dairy member account",
      icon: "👤",
      path: "/members",
      color: "purple",
    },
    {
      title: "Generate Bill",
      description:
        "Generate a member's 10-day bill",
      icon: "🧾",
      path: "/member-bill",
      color: "green",
    },
    {
      title: "View Reports",
      description:
        "Open reports and registers hub",
      icon: "📊",
      path: "/reports",
      color: "orange",
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner
          message="Loading dairy dashboard..."
          fullPage
        />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <ErrorCard
          title="Dashboard could not be loaded"
          message={error}
          onRetry={loadDashboardData}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="dashboard-page">
        {/* Welcome header */}
        <section className="dashboard-welcome">
          <div className="dashboard-welcome-content">
            <span className="dashboard-welcome-eyebrow">
              Live Dairy Overview
            </span>

            <h1>
              Welcome back,{" "}
              {user?.name?.split(" ")[0] ||
                "User"}
            </h1>

            <p>
              Monitor milk collection,
              members, deductions, billing
              and recent activities from one
              place.
            </p>

            <div className="dashboard-welcome-actions">
              <button
                type="button"
                className="dashboard-primary-action"
                onClick={() =>
                  navigate("/collection")
                }
              >
                <span>＋</span>
                Add Milk Collection
              </button>

              <button
                type="button"
                className="dashboard-secondary-action"
                onClick={() =>
                  navigate("/reports")
                }
              >
                <span>📊</span>
                Open Reports
              </button>
            </div>
          </div>

          <div className="dashboard-welcome-status">
            <div className="dashboard-live-indicator">
              <span></span>
              Live Today
            </div>

            <strong>
              {new Date().toLocaleDateString(
                "en-IN",
                {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }
              )}
            </strong>

            <small>
              Data refreshed from backend
            </small>
          </div>
        </section>

        {/* Main cards */}
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <span>
                Business Overview
              </span>

              <h2>
                Today's Dairy Summary
              </h2>

              <p>
                Current collection and
                financial information.
              </p>
            </div>

            <button
              type="button"
              onClick={loadDashboardData}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="dashboard-metric-grid">
            {dashboardCards.map(
              (card) => (
                <button
                  type="button"
                  className={`dashboard-metric-card dashboard-metric-${card.color}`}
                  key={card.title}
                  onClick={() =>
                    navigate(card.path)
                  }
                >
                  <div className="dashboard-metric-top">
                    <span className="dashboard-metric-icon">
                      {card.icon}
                    </span>

                    <span className="dashboard-metric-live">
                      Live
                    </span>
                  </div>

                  <p>{card.title}</p>

                  <h3>
                    {card.value}

                    {card.unit && (
                      <span>
                        {card.unit}
                      </span>
                    )}
                  </h3>

                  <small>
                    {card.subtitle}
                  </small>
                </button>
              )
            )}
          </div>
        </section>

        {/* Session and bills */}
        <section className="dashboard-detail-grid">
          <div className="dashboard-session-panel">
            <div className="dashboard-panel-header">
              <div>
                <span>
                  Collection Sessions
                </span>

                <h2>
                  Morning vs Evening
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/collection-register"
                  )
                }
              >
                View Register →
              </button>
            </div>

            <div className="dashboard-session-grid">
              <div className="dashboard-session-item morning">
                <span className="dashboard-session-icon">
                  🌅
                </span>

                <div>
                  <p>Morning Milk</p>

                  <h3>
                    {formatAmount(
                      morningMilk
                    )}{" "}
                    L
                  </h3>

                  <small>
                    {morningEntries} entries
                  </small>
                </div>
              </div>

              <div className="dashboard-session-item evening">
                <span className="dashboard-session-icon">
                  🌇
                </span>

                <div>
                  <p>Evening Milk</p>

                  <h3>
                    {formatAmount(
                      eveningMilk
                    )}{" "}
                    L
                  </h3>

                  <small>
                    {eveningEntries} entries
                  </small>
                </div>
              </div>
            </div>

            <div className="dashboard-progress-area">
              <div className="dashboard-progress-header">
                <span>
                  Morning Contribution
                </span>

                <strong>
                  {totalMilk > 0
                    ? formatAmount(
                        (morningMilk /
                          totalMilk) *
                          100
                      )
                    : "0.00"}
                  %
                </strong>
              </div>

              <div className="dashboard-progress-track">
                <span
                  style={{
                    width: `${
                      totalMilk > 0
                        ? Math.min(
                            (morningMilk /
                              totalMilk) *
                              100,
                            100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="dashboard-billing-panel">
            <div className="dashboard-panel-header">
              <div>
                <span>
                  Billing Status
                </span>

                <h2>
                  Generated Bills
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/bill-history"
                  )
                }
              >
                History →
              </button>
            </div>

            <div className="dashboard-billing-value">
              <span>🧾</span>

              <div>
                <p>Total Bills</p>
                <h3>{bills.length}</h3>
              </div>
            </div>

            <div className="dashboard-billing-value">
              <span>💵</span>

              <div>
                <p>Total Net Payable</p>

                <h3>
                  ₹
                  {formatAmount(
                    generatedBillAmount
                  )}
                </h3>
              </div>
            </div>

            <button
              type="button"
              className="dashboard-generate-bill-button"
              onClick={() =>
                navigate("/member-bill")
              }
            >
              Generate New Bill
              <span>→</span>
            </button>
          </div>
        </section>

        {/* Quick actions */}
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <span>Quick Access</span>

              <h2>
                Frequently Used Operations
              </h2>

              <p>
                Open common modules with one
                click.
              </p>
            </div>
          </div>

          <div className="dashboard-quick-grid">
            {quickActions.map(
              (action) => (
                <button
                  type="button"
                  className={`dashboard-quick-card dashboard-quick-${action.color}`}
                  key={action.title}
                  onClick={() =>
                    navigate(action.path)
                  }
                >
                  <span className="dashboard-quick-icon">
                    {action.icon}
                  </span>

                  <div>
                    <strong>
                      {action.title}
                    </strong>

                    <p>
                      {action.description}
                    </p>
                  </div>

                  <span className="dashboard-quick-arrow">
                    →
                  </span>
                </button>
              )
            )}
          </div>
        </section>

        {/* Recent activity component */}
        <RecentActivities />
      </div>
    </MainLayout>
  );
}

export default Dashboard;