import MainLayout from "../layouts/MainLayout";
import DashboardCard from "../components/DashboardCard";

function Dashboard() {

  return (

    <MainLayout>

      <h1>Dairy Dashboard</h1>

      <div className="dashboard-grid">

        <DashboardCard
          title="Total Members"
          value="125"
        />

        <DashboardCard
          title="Today's Collection"
          value="850 L"
        />

        <DashboardCard
          title="Revenue"
          value="₹45,000"
        />

        <DashboardCard
          title="Pending Payments"
          value="₹12,000"
        />

         <DashboardCard
          title="Active Members"
          value="₹12,0"
        />

       <DashboardCard
          title="Inactive Members"
          value="₹12"
        />

      </div>

    </MainLayout>

  );
}

export default Dashboard;