import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";

function DailyReport() {

  const [collections, setCollections] =
    useState([]);

  const [reportDate, setReportDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  useEffect(() => {

    const savedCollections =
      localStorage.getItem(
        "collections"
      );

    if (savedCollections) {

      setCollections(
        JSON.parse(savedCollections)
      );

    }

  }, []);

  const dailyCollections =
    collections.filter(
      (collection) =>
        collection.collectionDate ===
        reportDate
    );

  const totalEntries =
    dailyCollections.length;

  const totalMilk =
    dailyCollections.reduce(
      (total, collection) =>
        total +
        Number(collection.quantity),
      0
    );

  const totalAmount =
    dailyCollections.reduce(
      (total, collection) =>
        total +
        Number(collection.amount),
      0
    );

  const cowMilk =
    dailyCollections
      .filter(
        (collection) =>
          collection.milkType ===
          "Cow"
      )
      .reduce(
        (total, collection) =>
          total +
          Number(collection.quantity),
        0
      );

  const buffaloMilk =
    dailyCollections
      .filter(
        (collection) =>
          collection.milkType ===
          "Buffalo"
      )
      .reduce(
        (total, collection) =>
          total +
          Number(collection.quantity),
        0
      );

  const morningMilk =
    dailyCollections
      .filter(
        (collection) =>
          collection.session ===
          "Morning"
      )
      .reduce(
        (total, collection) =>
          total +
          Number(collection.quantity),
        0
      );

  const eveningMilk =
    dailyCollections
      .filter(
        (collection) =>
          collection.session ===
          "Evening"
      )
      .reduce(
        (total, collection) =>
          total +
          Number(collection.quantity),
        0
      );

  return (

    <MainLayout>

      <h1>
        Daily Collection Report
      </h1>

      <input
        type="date"
        value={reportDate}
        onChange={(e) =>
          setReportDate(
            e.target.value
          )
        }
      />

      <div
        className="dashboard-cards"
      >

        <div className="card">
          <h3>Entries</h3>
          <h2>{totalEntries}</h2>
        </div>

        <div className="card">
          <h3>Total Milk</h3>
          <h2>{totalMilk} L</h2>
        </div>

        <div className="card">
          <h3>Cow Milk</h3>
          <h2>{cowMilk} L</h2>
        </div>

        <div className="card">
          <h3>Buffalo Milk</h3>
          <h2>{buffaloMilk} L</h2>
        </div>

        <div className="card">
          <h3>Morning Milk</h3>
          <h2>{morningMilk} L</h2>
        </div>

        <div className="card">
          <h3>Evening Milk</h3>
          <h2>{eveningMilk} L</h2>
        </div>

        <div className="card">
          <h3>Total Amount</h3>
          <h2>₹{totalAmount}</h2>
        </div>

      </div>

    </MainLayout>

  );

}

export default DailyReport;