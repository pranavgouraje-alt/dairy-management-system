import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import DashboardCard from "../components/DashboardCard";

function FatSNFReport() {
  const [collections, setCollections] = useState([]);

  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [toDate, setToDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    const savedCollections =
      localStorage.getItem("collections");

    if (savedCollections) {
      setCollections(JSON.parse(savedCollections));
    }
  }, []);

  const filteredCollections =
    collections.filter(
      (collection) =>
        collection.collectionDate >= fromDate &&
        collection.collectionDate <= toDate
    );

  const totalEntries =
    filteredCollections.length;

  const averageFat =
    totalEntries === 0
      ? 0
      : (
          filteredCollections.reduce(
            (total, collection) =>
              total + Number(collection.fat),
            0
          ) / totalEntries
        ).toFixed(2);

  const averageSNF =
    totalEntries === 0
      ? 0
      : (
          filteredCollections.reduce(
            (total, collection) =>
              total + Number(collection.snf),
            0
          ) / totalEntries
        ).toFixed(2);

  const cowCollections =
    filteredCollections.filter(
      (collection) =>
        collection.milkType === "Cow"
    );

  const buffaloCollections =
    filteredCollections.filter(
      (collection) =>
        collection.milkType === "Buffalo"
    );

  const cowAvgFat =
    cowCollections.length === 0
      ? 0
      : (
          cowCollections.reduce(
            (total, collection) =>
              total + Number(collection.fat),
            0
          ) / cowCollections.length
        ).toFixed(2);

  const cowAvgSNF =
    cowCollections.length === 0
      ? 0
      : (
          cowCollections.reduce(
            (total, collection) =>
              total + Number(collection.snf),
            0
          ) / cowCollections.length
        ).toFixed(2);

  const buffaloAvgFat =
    buffaloCollections.length === 0
      ? 0
      : (
          buffaloCollections.reduce(
            (total, collection) =>
              total + Number(collection.fat),
            0
          ) / buffaloCollections.length
        ).toFixed(2);

  const buffaloAvgSNF =
    buffaloCollections.length === 0
      ? 0
      : (
          buffaloCollections.reduce(
            (total, collection) =>
              total + Number(collection.snf),
            0
          ) / buffaloCollections.length
        ).toFixed(2);

  return (
    <MainLayout>
      <h1>Fat / SNF Analysis Report</h1>

      <div className="collection-form">
        <input
          type="date"
          value={fromDate}
          onChange={(e) =>
            setFromDate(e.target.value)
          }
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) =>
            setToDate(e.target.value)
          }
        />
      </div>

      <div className="dashboard-cards">
        <DashboardCard
          title="Total Entries"
          value={totalEntries}
          icon="📋"
          accent="#6a1b9a"
        />

        <DashboardCard
          title="Average Fat"
          value={averageFat}
          icon="🧪"
          accent="#1976d2"
          highlight
        />

        <DashboardCard
          title="Average SNF"
          value={averageSNF}
          icon="📊"
          accent="#2e7d32"
          highlight
        />

        <DashboardCard
          title="Cow Avg Fat"
          value={cowAvgFat}
          icon="🐄"
          accent="#f57c00"
        />

        <DashboardCard
          title="Cow Avg SNF"
          value={cowAvgSNF}
          icon="🐄"
          accent="#ef6c00"
        />

        <DashboardCard
          title="Buffalo Avg Fat"
          value={buffaloAvgFat}
          icon="🐃"
          accent="#00838f"
        />

        <DashboardCard
          title="Buffalo Avg SNF"
          value={buffaloAvgSNF}
          icon="🐃"
          accent="#283593"
        />
      </div>

      <table className="member-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Member ID</th>
            <th>Member Name</th>
            <th>Milk Type</th>
            <th>Session</th>
            <th>Quantity</th>
            <th>Fat</th>
            <th>SNF</th>
          </tr>
        </thead>

        <tbody>
          {filteredCollections.map(
            (collection, index) => (
              <tr key={index}>
                <td>{collection.collectionDate}</td>
                <td>{collection.memberId}</td>
                <td>{collection.memberName}</td>
                <td>{collection.milkType}</td>
                <td>{collection.session}</td>
                <td>{collection.quantity}</td>
                <td>{collection.fat}</td>
                <td>{collection.snf}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </MainLayout>
  );
}

export default FatSNFReport;