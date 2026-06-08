import MainLayout from "../layouts/MainLayout";
import { Link } from "react-router-dom";

function Reports() {

  return (

    <MainLayout>

      <h1>
        Reports Dashboard
      </h1>

      <div className="reports-grid">

        <Link
          to="/daily-report"
          className="report-link"
        >
          <div className="report-card">
            <h3>📅 Daily Collection</h3>
            <p>
              View date-wise collection summary
            </p>
          </div>
        </Link>

        <Link
          to="/collection-register"
          className="report-link"
        >
          <div className="report-card">
            <h3>📖 Collection Register</h3>
            <p>
              View all collection entries
            </p>
          </div>
        </Link>

        <Link
          to="/member-ledger"
          className="report-link"
        >
          <div className="report-card">
            <h3>👤 Member Ledger</h3>
            <p>
              Member wise milk statement
            </p>
          </div>
        </Link>

        <Link
          to="/milk-summary"
          className="report-link"
        >
          <div className="report-card">
            <h3>🥛 Milk Summary</h3>
            <p>
              Cow and Buffalo milk totals
            </p>
          </div>
        </Link>

        <Link
          to="/fat-snf-report"
          className="report-link"
        >
          <div className="report-card">
            <h3>📊 Fat & SNF Report</h3>
            <p>
              Quality analysis report
            </p>
          </div>
        </Link>

      </div>

    </MainLayout>

  );

}

export default Reports;