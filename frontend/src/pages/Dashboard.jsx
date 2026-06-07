import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import DashboardCard from "../components/DashboardCard";

function Dashboard() {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    const savedCollections = localStorage.getItem("collections");
    if (savedCollections) {
      setCollections(JSON.parse(savedCollections));
    }
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const todayCollections = collections.filter((c) => c.collectionDate === today);

  const totalMilk = todayCollections.reduce((t, c) => t + Number(c.quantity), 0);
  const totalAmount = todayCollections.reduce((t, c) => t + Number(c.amount), 0);
  const cowMilk = todayCollections.filter((c) => c.milkType === "Cow").reduce((t, c) => t + Number(c.quantity), 0);
  const buffaloMilk = todayCollections.filter((c) => c.milkType === "Buffalo").reduce((t, c) => t + Number(c.quantity), 0);
  const morningMilk = todayCollections.filter((c) => c.session === "Morning").reduce((t, c) => t + Number(c.quantity), 0);
  const eveningMilk = todayCollections.filter((c) => c.session === "Evening").reduce((t, c) => t + Number(c.quantity), 0);

  const todayDisplay = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <MainLayout>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0d1b2a", margin: "0 0 4px 0" }}>
            Dairy Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "#78909c", margin: 0, fontWeight: "600" }}>{todayDisplay}</p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "#e8f5e9", color: "#2e7d32", fontSize: "13px",
          fontWeight: "700", padding: "8px 16px", borderRadius: "20px",
          border: "1px solid #a5d6a7",
        }}>
          <span style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: "#43a047", display: "inline-block",
            animation: "pulse 1.5s infinite",
          }} />
          Live Today
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
        }}
      >
        <DashboardCard title="Total Milk"      value={totalMilk}              unit="L"  icon="🥛" accent="#1976d2" highlight />
        <DashboardCard title="Total Amount"    value={`₹${totalAmount}`}             icon="💰" accent="#2e7d32" highlight />
        <DashboardCard title="Entries Today"   value={todayCollections.length}        icon="📋" accent="#6a1b9a" />
        <DashboardCard title="Cow Milk"        value={cowMilk}                unit="L"  icon="🐄" accent="#f57c00" />
        <DashboardCard title="Buffalo Milk"    value={buffaloMilk}            unit="L"  icon="🐃" accent="#00838f" />
        <DashboardCard title="Morning Session" value={morningMilk}            unit="L"  icon="🌅" accent="#ef6c00" />
        <DashboardCard title="Evening Session" value={eveningMilk}            unit="L"  icon="🌙" accent="#283593" />
      </div>
    </MainLayout>
  );
}

export default Dashboard;
