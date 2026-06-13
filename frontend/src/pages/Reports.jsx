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

        <Link
          to="/payment-register"
          className="report-link"
        >
          <div className="report-card">
            <h3>💵 Payment Register</h3>
            <p>
              Member-wise payable milk amount
            </p>
          </div>

        </Link>

        <Link
          to="/member-bill"
          className="report-link"
        >
          <div className="report-card">
            <h3>🧾 Member Bill</h3>
            <p>
              Generate member-wise milk bill
            </p>
          </div>
        </Link>

        <Link
          to="/feed-advance-report"
          className="report-link"
        >
          <div className="report-card">
            <h3>📑 Feed & Advance Report</h3>
            <p>
              View member-wise feed and advance details
            </p>
          </div>
        </Link>

      </div>

    </MainLayout>

  );

}

export default Reports;