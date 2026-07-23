import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  getActivities,
} from "../services/notificationService";

function RecentActivities() {
  const navigate = useNavigate();

  const [activities, setActivities] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      setLoading(true);
      setError("");

      const result =
        await getActivities({
          limit: 8,
        });

      setActivities(
        result.data || []
      );
    } catch (error) {
      console.error(
        "Recent activities error:",
        error
      );

      setError(
        error.message ||
          "Unable to load activities"
      );
    } finally {
      setLoading(false);
    }
  }

  function getActivityIcon(module) {
    const icons = {
      Members: "👥",
      Collection: "🥛",
      "Rate Master": "📈",
      Feed: "🌾",
      Advance: "💰",
      Billing: "🧾",
      Authentication: "🔐",
      Reports: "📊",
    };

    return icons[module] || "📌";
  }

  return (
    <section className="recent-activities-card">
      <div className="recent-activities-header">
        <div>
          <span>Live Activity</span>
          <h2>Recent Activities</h2>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/activity-logs")
          }
        >
          View All →
        </button>
      </div>

      <div className="recent-activities-list">
        {loading ? (
          <p className="recent-activity-message">
            Loading activities...
          </p>
        ) : error ? (
          <div className="recent-activity-error">
            <p>{error}</p>

            <button
              type="button"
              onClick={loadActivities}
            >
              Retry
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="recent-activity-empty">
            <span>📋</span>
            <p>
              No recent activity available.
            </p>
          </div>
        ) : (
          activities.map(
            (activity) => (
              <article
                className="recent-activity-item"
                key={
                  activity.activityId
                }
              >
                <span className="recent-activity-icon">
                  {getActivityIcon(
                    activity.module
                  )}
                </span>

                <div className="recent-activity-content">
                  <strong>
                    {activity.title}
                  </strong>

                  <p>
                    {activity.description}
                  </p>

                  <small>
                    {activity.createdTime} ·{" "}
                    {activity.createdBy}
                  </small>
                </div>

                <span
                  className={`recent-activity-status ${activity.status?.toLowerCase()}`}
                >
                  {activity.status}
                </span>
              </article>
            )
          )
        )}
      </div>
    </section>
  );
}

export default RecentActivities;