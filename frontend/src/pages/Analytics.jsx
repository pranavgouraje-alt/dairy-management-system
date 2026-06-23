import MainLayout from "../layouts/MainLayout";
import DashboardChart from "../components/DashboardChart";
import "../styles/analytics.css";

function Analytics() {

  const weeklyData = [
    { day: "Mon", milk: 120 },
    { day: "Tue", milk: 140 },
    { day: "Wed", milk: 110 },
    { day: "Thu", milk: 170 },
    { day: "Fri", milk: 160 },
    { day: "Sat", milk: 180 },
    { day: "Sun", milk: 200 }
  ];

  return (
    <MainLayout>

      <h1 className="page-title">
        Analytics Dashboard
      </h1>

      <div className="analytics-grid">

        <div className="analytics-card">
          <h3>Total Milk</h3>
          <h2>1450 L</h2>
        </div>

        <div className="analytics-card">
          <h3>Total Revenue</h3>
          <h2>₹85,000</h2>
        </div>

        <div className="analytics-card">
          <h3>Active Members</h3>
          <h2>65</h2>
        </div>

        <div className="analytics-card">
          <h3>Average FAT</h3>
          <h2>5.8</h2>
        </div>

      </div>

      <DashboardChart data={weeklyData} />

    </MainLayout>
  );
}

export default Analytics;