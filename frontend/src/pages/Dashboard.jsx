import MainLayout from "../layouts/MainLayout";
import DashboardCard from "../components/DashboardCard";

function Dashboard() {
  return (
    <MainLayout>
      <h1>Dashboard</h1>

      <div className="dashboard-grid">

        <DashboardCard
          title="Total Members"
          value="325"
        />

        <DashboardCard
          title="Today's Milk"
          value="1450 L"
        />

        <DashboardCard
          title="Today's Amount"
          value="₹45,620"
        />

        <DashboardCard
          title="Pending Payments"
          value="₹12,000"
        />

      </div>
    </MainLayout>
  );
}

export default Dashboard;