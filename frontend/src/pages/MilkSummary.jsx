import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import DashboardCard from "../components/DashboardCard";

function MilkSummary() {
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

  const totalMilk =
    filteredCollections.reduce(
      (total, collection) =>
        total + Number(collection.quantity),
      0
    );

  const totalAmount =
    filteredCollections.reduce(
      (total, collection) =>
        total + Number(collection.amount),
      0
    );

  const cowMilk =
    filteredCollections
      .filter(
        (collection) =>
          collection.milkType === "Cow"
      )
      .reduce(
        (total, collection) =>
          total + Number(collection.quantity),
        0
      );

  const buffaloMilk =
    filteredCollections
      .filter(
        (collection) =>
          collection.milkType === "Buffalo"
      )
      .reduce(
        (total, collection) =>
          total + Number(collection.quantity),
        0
      );

  const morningMilk =
    filteredCollections
      .filter(
        (collection) =>
          collection.session === "Morning"
      )
      .reduce(
        (total, collection) =>
          total + Number(collection.quantity),
        0
      );

  const eveningMilk =
    filteredCollections
      .filter(
        (collection) =>
          collection.session === "Evening"
      )
      .reduce(
        (total, collection) =>
          total + Number(collection.quantity),
        0
      );

  return (
    <MainLayout>
      <h1>Milk Summary Report</h1>

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
          title="Total Milk"
          value={totalMilk}
          unit="L"
          icon="🥛"
          accent="#1976d2"
          highlight
        />

        <DashboardCard
          title="Cow Milk"
          value={cowMilk}
          unit="L"
          icon="🐄"
          accent="#f57c00"
        />

        <DashboardCard
          title="Buffalo Milk"
          value={buffaloMilk}
          unit="L"
          icon="🐃"
          accent="#00838f"
        />

        <DashboardCard
          title="Morning Milk"
          value={morningMilk}
          unit="L"
          icon="🌅"
          accent="#ef6c00"
        />

        <DashboardCard
          title="Evening Milk"
          value={eveningMilk}
          unit="L"
          icon="🌙"
          accent="#283593"
        />

        <DashboardCard
          title="Total Amount"
          value={`₹${totalAmount}`}
          icon="💰"
          accent="#2e7d32"
          highlight
        />
      </div>
    </MainLayout>
  );
}

export default MilkSummary;