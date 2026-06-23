import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import DashboardCard from "../components/DashboardCard";
import { formatAmount } from "../utils/amountUtils";

function Dashboard() {
  const [collections, setCollections] = useState([]);
  const [members, setMembers] = useState([]);
  const [billRecords, setBillRecords] = useState([]);

  useEffect(() => {
    const savedCollections = localStorage.getItem("collections");
    const savedMembers = localStorage.getItem("members");
    const savedBills = localStorage.getItem("billRecords");

    if (savedCollections) {
      setCollections(JSON.parse(savedCollections));
    }

    if (savedMembers) {
      setMembers(JSON.parse(savedMembers));
    }

    if (savedBills) {
      setBillRecords(JSON.parse(savedBills));
    }
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const todayCollections = collections.filter(
    (collection) => collection.collectionDate === today
  );

  const totalMilk = todayCollections.reduce(
    (total, collection) =>
      total + Number(collection.quantity || 0),
    0
  );

  const totalAmount = todayCollections.reduce(
    (total, collection) =>
      total + Number(collection.amount || 0),
    0
  );

  const cowMilk = todayCollections
    .filter((collection) => collection.milkType === "Cow")
    .reduce(
      (total, collection) =>
        total + Number(collection.quantity || 0),
      0
    );

  const buffaloMilk = todayCollections
    .filter((collection) => collection.milkType === "Buffalo")
    .reduce(
      (total, collection) =>
        total + Number(collection.quantity || 0),
      0
    );

  const morningMilk = todayCollections
    .filter((collection) => collection.session === "Morning")
    .reduce(
      (total, collection) =>
        total + Number(collection.quantity || 0),
      0
    );

  const eveningMilk = todayCollections
    .filter((collection) => collection.session === "Evening")
    .reduce(
      (total, collection) =>
        total + Number(collection.quantity || 0),
      0
    );

  const recentCollections = [...todayCollections]
    .reverse()
    .slice(0, 5);

  const todayDisplay = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <MainLayout>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Dairy Dashboard
          </h1>

          <p className="dashboard-date">
            {todayDisplay}
          </p>
        </div>

        <div className="dashboard-badge">
          <span className="live-dot"></span>
          Live Today
        </div>
      </div>

      <div className="dashboard-pro-grid">
        <DashboardCard
          title="Total Milk"
          value={formatAmount(totalMilk)}
          unit="L"
          icon="🥛"
          variant="blue"
          subtitle="Today's collection"
        />

        <DashboardCard
          title="Total Amount"
          value={`₹${formatAmount(totalAmount)}`}
          icon="💰"
          variant="green"
          subtitle="Today's milk value"
        />

        <DashboardCard
          title="Entries Today"
          value={todayCollections.length}
          icon="📋"
          variant="purple"
          subtitle="Milk entries"
        />

        <DashboardCard
          title="Total Members"
          value={members.length}
          icon="👥"
          variant="orange"
          subtitle="Registered members"
        />

        <DashboardCard
          title="Cow Milk"
          value={formatAmount(cowMilk)}
          unit="L"
          icon="🐄"
          variant="orange"
          subtitle="Cow collection"
        />

        <DashboardCard
          title="Buffalo Milk"
          value={formatAmount(buffaloMilk)}
          unit="L"
          icon="🐃"
          variant="blue"
          subtitle="Buffalo collection"
        />

        <DashboardCard
          title="Morning Session"
          value={formatAmount(morningMilk)}
          unit="L"
          icon="🌅"
          variant="green"
          subtitle="Morning milk"
        />

        <DashboardCard
          title="Evening Session"
          value={formatAmount(eveningMilk)}
          unit="L"
          icon="🌙"
          variant="purple"
          subtitle="Evening milk"
        />

        <DashboardCard
          title="Generated Bills"
          value={billRecords.length}
          icon="🧾"
          variant="green"
          subtitle="Total bill records"
        />
      </div>

      <div className="dashboard-section">
        <h2>Recent Collection Activity</h2>

        <table className="member-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Milk Type</th>
              <th>Session</th>
              <th>Quantity</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {recentCollections.length === 0 ? (
              <tr>
                <td colSpan="5">
                  No collection entries today
                </td>
              </tr>
            ) : (
              recentCollections.map((item) => (
                <tr key={item.collectionId}>
                  <td>{item.memberName}</td>
                  <td>{item.milkType}</td>
                  <td>{item.session}</td>
                  <td>{formatAmount(item.quantity)} L</td>
                  <td>₹{formatAmount(item.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}

export default Dashboard;