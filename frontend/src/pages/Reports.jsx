import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

function Reports() {
  const reportGroups = [
    {
      groupTitle: "Collection Reports",
      groupIcon: "🥛",
      groupDesc: "Milk collection, daily entries and quality reports",
      reports: [
        {
          title: "Daily Collection",
          description: "View date-wise collection summary",
          path: "/daily-report",
          icon: "📅",
        },
        {
          title: "Collection Register",
          description: "View all milk collection entries",
          path: "/collection-register",
          icon: "📖",
        },
        {
          title: "Milk Summary",
          description: "Cow and buffalo milk totals",
          path: "/milk-summary",
          icon: "🥛",
        },
        {
          title: "Fat & SNF Report",
          description: "Milk quality analysis report",
          path: "/fat-snf-report",
          icon: "📊",
        },
      ],
    },
    {
      groupTitle: "Billing Reports",
      groupIcon: "🧾",
      groupDesc: "Member bills, payment register and printable bills",
      reports: [
        {
          title: "Member Bill",
          description: "Generate member-wise milk bill",
          path: "/member-bill",
          icon: "👤",
        },
        {
          title: "Bill History",
          description: "View generated bill records",
          path: "/bill-history",
          icon: "📜",
        },
        {
          title: "Payment Register",
          description: "Cycle-wise payment register",
          path: "/payment-register",
          icon: "💰",
        },
        {
          title: "Print All Bills",
          description: "Print all member bills together",
          path: "/print-all-bills",
          icon: "🖨️",
        },
      ],
    },
    {
      groupTitle: "Financial Reports",
      groupIcon: "🏦",
      groupDesc: "Reserve, feed and advance related financial reports",
      reports: [
        {
          title: "Reserve Report",
          description: "View member-wise reserve amount",
          path: "/reserve-report",
          icon: "🏦",
        },
        {
          title: "Feed & Advance Report",
          description: "View feed and advance deductions",
          path: "/feed-advance-report",
          icon: "📒",
        },
      ],
    },
    {
      groupTitle: "Master & Utility",
      groupIcon: "⚙️",
      groupDesc: "Master records, rate charts and backup utilities",
      reports: [
        {
          title: "Rate Master",
          description: "Manage current and history rates",
          path: "/rate-master",
          icon: "📈",
        },
        {
          title: "Backup & Restore",
          description: "Export and restore dairy data",
          path: "/backup",
          icon: "💾",
        },
      ],
    },
  ];

  return (
    <MainLayout>
      <div className="reports-hero">
        <div>
          <h1>Reports Center</h1>
          <p>
            Access all collection, billing, financial and master reports
            from one professional dashboard.
          </p>
        </div>

        <div className="reports-hero-badge">
          📊 Dairy Reports
        </div>
      </div>

      {reportGroups.map((group) => (
        <div
          className="report-group-section"
          key={group.groupTitle}
        >
          <div className="report-group-header">
            <div className="report-group-icon">
              {group.groupIcon}
            </div>

            <div>
              <h2>{group.groupTitle}</h2>
              <p>{group.groupDesc}</p>
            </div>
          </div>

          <div className="reports-grid">
            {group.reports.map((report) => (
              <Link
                to={report.path}
                className="report-link"
                key={report.title}
              >
                <div className="report-card">
                  <div className="report-card-icon">
                    {report.icon}
                  </div>

                  <h3>{report.title}</h3>

                  <p>{report.description}</p>

                  <span className="report-open-btn">
                    Open Report →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </MainLayout>
  );
}

export default Reports;