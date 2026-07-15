import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import reportMenu from "../config/reportMenu";

function Reports() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        reportMenu.map(
          (report) => report.category
        )
      ),
    ];
  }, []);

  const filteredReports = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return reportMenu.filter((report) => {
      const categoryMatched =
        selectedCategory === "All" ||
        report.category === selectedCategory;

      const searchMatched =
        searchText === "" ||
        report.title
          .toLowerCase()
          .includes(searchText) ||
        report.description
          .toLowerCase()
          .includes(searchText) ||
        report.category
          .toLowerCase()
          .includes(searchText);

      return categoryMatched && searchMatched;
    });
  }, [search, selectedCategory]);

  function openReport(path) {
    navigate(path);
  }

  return (
    <MainLayout>
      <div className="reports-hub-page">
        {/* HERO SECTION */}
        <section className="reports-hub-hero">
          <div className="reports-hub-hero-content">
            <span className="reports-hub-eyebrow">
              Dairy Reporting Centre
            </span>

            <h1>Reports & Registers</h1>

            <p>
              Open milk collection reports, member
              bills, payment registers, financial
              reports and system tools from one
              professional dashboard.
            </p>

            <div className="reports-hub-hero-actions">
              <button
                type="button"
                className="reports-hub-primary-btn"
                onClick={() =>
                  navigate("/daily-report")
                }
              >
                <span>📅</span>
                Daily Report
              </button>

              <button
                type="button"
                className="reports-hub-secondary-btn"
                onClick={() =>
                  navigate("/member-bill")
                }
              >
                <span>🧾</span>
                Generate Member Bill
              </button>
            </div>
          </div>

          <div className="reports-hub-hero-visual">
            <div className="reports-main-visual">
              📊
            </div>

            <div className="reports-floating-item reports-floating-one">
              <span>🥛</span>

              <div>
                <strong>Collection</strong>
                <small>Daily reports</small>
              </div>
            </div>

            <div className="reports-floating-item reports-floating-two">
              <span>🧾</span>

              <div>
                <strong>Billing</strong>
                <small>10-day cycles</small>
              </div>
            </div>

            <div className="reports-floating-item reports-floating-three">
              <span>💳</span>

              <div>
                <strong>Payments</strong>
                <small>Registers</small>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK ACCESS */}
        <section className="reports-hub-quick-grid">
          <button
            type="button"
            onClick={() =>
              navigate("/daily-report")
            }
          >
            <span>📅</span>

            <div>
              <strong>Daily Report</strong>
              <small>Today's milk details</small>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/member-bill")
            }
          >
            <span>🧾</span>

            <div>
              <strong>Member Bill</strong>
              <small>Generate 10-day bill</small>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/bill-history")
            }
          >
            <span>📚</span>

            <div>
              <strong>Bill History</strong>
              <small>Previous generated bills</small>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/analytics")
            }
          >
            <span>📈</span>

            <div>
              <strong>Analytics</strong>
              <small>Charts and trends</small>
            </div>
          </button>
        </section>

        {/* REPORT LIBRARY HEADER */}
        <section className="reports-library-section">
          <div className="reports-library-header">
            <div>
              <span className="reports-section-label">
                Report Library
              </span>

              <h2>Select a Report</h2>

              <p>
                Click a card to open its complete
                report component.
              </p>
            </div>

            <div className="reports-hub-search">
              <span>🔍</span>

              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* CATEGORY FILTERS */}
          <div className="reports-category-tabs">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={
                  selectedCategory === category
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedCategory(category)
                }
              >
                {category}
              </button>
            ))}
          </div>

          {/* REDIRECTION CARDS */}
          {filteredReports.length === 0 ? (
            <div className="reports-empty-box">
              <span>🔎</span>

              <h3>No reports found</h3>

              <p>
                Try changing the search or selected
                category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                }}
              >
                Show All Reports
              </button>
            </div>
          ) : (
            <div className="reports-module-grid">
              {filteredReports.map((report) => (
                <button
                  type="button"
                  key={report.id}
                  className={`reports-module-card reports-module-${report.color}`}
                  onClick={() =>
                    openReport(report.path)
                  }
                >
                  <div className="reports-module-card-top">
                    <span className="reports-module-icon">
                      {report.icon}
                    </span>

                    <span className="reports-module-badge">
                      {report.badge}
                    </span>
                  </div>

                  <div className="reports-module-content">
                    <span className="reports-module-category">
                      {report.category}
                    </span>

                    <h3>{report.title}</h3>

                    <p>{report.description}</p>
                  </div>

                  <div className="reports-module-footer">
                    <span>Open Report</span>

                    <span className="reports-module-arrow">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}

export default Reports;