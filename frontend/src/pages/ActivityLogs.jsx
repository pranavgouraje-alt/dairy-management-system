import {
  useEffect,
  useMemo,
  useState,
} from "react";

import MainLayout from "../layouts/MainLayout";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorCard from "../components/ErrorCard";

import {
  clearActivities,
  getActivities,
} from "../services/notificationService";

function ActivityLogs() {
  const [activities, setActivities] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [moduleFilter, setModuleFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      setLoading(true);
      setError("");

      const result =
        await getActivities();

      setActivities(
        result.data || []
      );
    } catch (error) {
      console.error(
        "Activity logs error:",
        error
      );

      setError(
        error.message ||
          "Unable to load activity logs"
      );
    } finally {
      setLoading(false);
    }
  }

  const modules = useMemo(() => {
    return [
      ...new Set(
        activities
          .map(
            (item) => item.module
          )
          .filter(Boolean)
      ),
    ];
  }, [activities]);

  const filteredActivities =
    useMemo(() => {
      const searchText = search
        .trim()
        .toLowerCase();

      return activities.filter(
        (activity) => {
          const matchesSearch =
            searchText === "" ||
            activity.title
              ?.toLowerCase()
              .includes(searchText) ||
            activity.description
              ?.toLowerCase()
              .includes(searchText) ||
            activity.createdBy
              ?.toLowerCase()
              .includes(searchText) ||
            activity.module
              ?.toLowerCase()
              .includes(searchText);

          const matchesModule =
            !moduleFilter ||
            activity.module ===
              moduleFilter;

          const matchesStatus =
            !statusFilter ||
            activity.status ===
              statusFilter;

          const matchesFrom =
            !fromDate ||
            activity.createdDate >=
              fromDate;

          const matchesTo =
            !toDate ||
            activity.createdDate <=
              toDate;

          return (
            matchesSearch &&
            matchesModule &&
            matchesStatus &&
            matchesFrom &&
            matchesTo
          );
        }
      );
    }, [
      activities,
      search,
      moduleFilter,
      statusFilter,
      fromDate,
      toDate,
    ]);

  async function handleClearActivities() {
    if (activities.length === 0) {
      return;
    }

    const confirmed =
      window.confirm(
        "Clear all activity logs?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await clearActivities();
      setActivities([]);
    } catch (error) {
      alert(error.message);
    }
  }

  function exportCsv() {
    if (
      filteredActivities.length === 0
    ) {
      alert(
        "No activity records available"
      );
      return;
    }

    const columns = [
      "createdDate",
      "createdTime",
      "createdBy",
      "action",
      "module",
      "status",
      "method",
      "path",
      "ip",
    ];

    const header =
      columns.join(",");

    const rows =
      filteredActivities.map(
        (activity) =>
          columns
            .map((key) => {
              const value =
                activity[key] || "";

              return `"${String(
                value
              ).replace(/"/g, '""')}"`;
            })
            .join(",")
      );

    const csv = [
      header,
      ...rows,
    ].join("\n");

    const blob = new Blob([csv], {
      type:
        "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `activity-logs-${new Date()
        .toISOString()
        .split("T")[0]}.csv`;

    link.click();

    URL.revokeObjectURL(url);
  }

  const columns = [
    {
      key: "createdDate",
      label: "Date",
    },
    {
      key: "createdTime",
      label: "Time",
    },
    {
      key: "createdBy",
      label: "User",
    },
    {
      key: "action",
      label: "Action",
    },
    {
      key: "module",
      label: "Module",
    },
    {
      key: "status",
      label: "Status",

      render: (row) => (
        <span
          className={`activity-status-badge ${row.status?.toLowerCase()}`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "method",
      label: "Method",
    },
    {
      key: "ip",
      label: "IP Address",
    },
  ];

  return (
    <MainLayout>
      <div className="activity-page">
        <div className="activity-page-header">
          <div>
            <span className="activity-eyebrow">
              System Audit
            </span>

            <h1>Activity Logs</h1>

            <p>
              Review system actions, users,
              modules and API operations.
            </p>
          </div>

          <div className="activity-header-actions">
            <button
              type="button"
              onClick={exportCsv}
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={() =>
                window.print()
              }
            >
              Print
            </button>

            <button
              type="button"
              className="activity-clear-button"
              onClick={
                handleClearActivities
              }
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div className="activity-summary-grid">
          <div>
            <span>📋</span>
            <p>Total Activities</p>
            <h2>{activities.length}</h2>
          </div>

          <div>
            <span>✅</span>
            <p>Successful</p>
            <h2>
              {
                activities.filter(
                  (item) =>
                    item.status ===
                    "Success"
                ).length
              }
            </h2>
          </div>

          <div>
            <span>👤</span>
            <p>Active Users</p>
            <h2>
              {
                new Set(
                  activities
                    .map(
                      (item) =>
                        item.createdBy
                    )
                    .filter(Boolean)
                ).size
              }
            </h2>
          </div>

          <div>
            <span>🧩</span>
            <p>Modules</p>
            <h2>{modules.length}</h2>
          </div>
        </div>

        <div className="activity-filter-panel">
          <div>
            <label>Search</label>

            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <label>Module</label>

            <select
              value={moduleFilter}
              onChange={(event) =>
                setModuleFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Modules
              </option>

              {modules.map(
                (module) => (
                  <option
                    key={module}
                    value={module}
                  >
                    {module}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label>Status</label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Statuses
              </option>

              <option value="Success">
                Success
              </option>

              <option value="Failed">
                Failed
              </option>
            </select>
          </div>

          <div>
            <label>From Date</label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <label>To Date</label>

            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner
            message="Loading activity logs..."
          />
        ) : error ? (
          <ErrorCard
            title="Activity logs unavailable"
            message={error}
            onRetry={loadActivities}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredActivities}
            searchPlaceholder="Search activity records..."
          />
        )}
      </div>
    </MainLayout>
  );
}

export default ActivityLogs;