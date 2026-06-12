import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";

function MemberBill() {
  const [members, setMembers] = useState([]);
  const [collections, setCollections] = useState([]);

  const [selectedMemberId, setSelectedMemberId] = useState("");

  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [toDate, setToDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    const savedMembers = localStorage.getItem("members");
    const savedCollections = localStorage.getItem("collections");

    if (savedMembers) {
      setMembers(JSON.parse(savedMembers));
    }

    if (savedCollections) {
      setCollections(JSON.parse(savedCollections));
    }
  }, []);

  const selectedMember = members.find(
    (member) => member.memberId === selectedMemberId
  );

  const billCollections = collections.filter(
    (collection) =>
      collection.memberId === selectedMemberId &&
      collection.collectionDate >= fromDate &&
      collection.collectionDate <= toDate
  );

  const cowMorningCollections = billCollections.filter(
    (collection) =>
      collection.milkType === "Cow" &&
      collection.session === "Morning"
  );

  const cowEveningCollections = billCollections.filter(
    (collection) =>
      collection.milkType === "Cow" &&
      collection.session === "Evening"
  );

  const buffaloMorningCollections = billCollections.filter(
    (collection) =>
      collection.milkType === "Buffalo" &&
      collection.session === "Morning"
  );

  const buffaloEveningCollections = billCollections.filter(
    (collection) =>
      collection.milkType === "Buffalo" &&
      collection.session === "Evening"
  );

  const cowMilk = billCollections
    .filter((collection) => collection.milkType === "Cow")
    .reduce((total, collection) => total + Number(collection.quantity), 0);

  const buffaloMilk = billCollections
    .filter((collection) => collection.milkType === "Buffalo")
    .reduce((total, collection) => total + Number(collection.quantity), 0);

  const cowAmount = billCollections
    .filter((collection) => collection.milkType === "Cow")
    .reduce((total, collection) => total + Number(collection.amount), 0);

  const buffaloAmount = billCollections
    .filter((collection) => collection.milkType === "Buffalo")
    .reduce((total, collection) => total + Number(collection.amount), 0);

  const totalMilk = cowMilk + buffaloMilk;

  const totalAmount = cowAmount + buffaloAmount;

  function renderTable(data) {
    return (
      <table className="bill-mini-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Lit</th>
            <th>Fat</th>
            <th>SNF</th>
            <th>Rate</th>
            <th>Amt</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="6">No Data</td>
            </tr>
          ) : (
            data.map((collection) => (
              <tr key={collection.collectionId}>
                <td>{collection.collectionDate}</td>
                <td>{collection.quantity}</td>
                <td>{collection.fat}</td>
                <td>{collection.snf}</td>
                <td>₹{collection.rate}</td>
                <td>₹{collection.amount}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    );
  }

  return (
    <MainLayout>
      <h1>Member Bill Report</h1>

      <div className="collection-form">
        <select
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
        >
          <option value="">Select Member</option>

          {members.map((member) => (
            <option key={member.memberId} value={member.memberId}>
              {member.memberId} - {member.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </div>

      {selectedMemberId && (
        <div className="bill-box">
          <div className="bill-header">
            <h2>Milk Bill</h2>

            <p>
              <strong>Member:</strong> {selectedMember?.memberId} -{" "}
              {selectedMember?.name}
            </p>

            <p>
              <strong>Period:</strong> {fromDate} to {toDate}
            </p>
          </div>

          <div className="bill-parallel-layout">
            <div className="bill-animal-section">
              <h2>🐄 Cow Milk</h2>

              <div className="bill-session-container">
                <div className="bill-session-box">
                  <h3>Morning</h3>
                  {renderTable(cowMorningCollections)}
                </div>

                <div className="bill-session-box">
                  <h3>Evening</h3>
                  {renderTable(cowEveningCollections)}
                </div>
              </div>

              <div className="animal-total">
                <p>
                  <strong>Cow Milk:</strong> {cowMilk} L
                </p>

                <p>
                  <strong>Cow Amount:</strong> ₹{cowAmount}
                </p>
              </div>
            </div>

            <div className="bill-animal-section">
              <h2>🐃 Buffalo Milk</h2>

              <div className="bill-session-container">
                <div className="bill-session-box">
                  <h3>Morning</h3>
                  {renderTable(buffaloMorningCollections)}
                </div>

                <div className="bill-session-box">
                  <h3>Evening</h3>
                  {renderTable(buffaloEveningCollections)}
                </div>
              </div>

              <div className="animal-total">
                <p>
                  <strong>Buffalo Milk:</strong> {buffaloMilk} L
                </p>

                <p>
                  <strong>Buffalo Amount:</strong> ₹{buffaloAmount}
                </p>
              </div>
            </div>
          </div>

          <div className="bill-final-summary">
            <h2>Total Milk: {totalMilk} L</h2>
            <h2>Total Amount: ₹{totalAmount}</h2>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default MemberBill;