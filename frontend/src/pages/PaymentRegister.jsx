import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";

function PaymentRegister() {
  const [members, setMembers] = useState([]);
  const [collections, setCollections] = useState([]);

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

  const periodCollections = collections.filter(
    (collection) =>
      collection.collectionDate >= fromDate &&
      collection.collectionDate <= toDate
  );

  const paymentRows = members.map((member) => {
    const memberCollections = periodCollections.filter(
      (collection) =>
        collection.memberId === member.memberId
    );

    const cowMilk = memberCollections
      .filter(
        (collection) =>
          collection.milkType === "Cow"
      )
      .reduce(
        (total, collection) =>
          total + Number(collection.quantity),
        0
      );

    const buffaloMilk = memberCollections
      .filter(
        (collection) =>
          collection.milkType === "Buffalo"
      )
      .reduce(
        (total, collection) =>
          total + Number(collection.quantity),
        0
      );

    const totalMilk =
      cowMilk + buffaloMilk;

    const milkAmount =
      memberCollections.reduce(
        (total, collection) =>
          total + Number(collection.amount),
        0
      );

    const finalPay = milkAmount;

    return {
      memberId: member.memberId,
      name: member.name,
      village: member.village,
      cowMilk,
      buffaloMilk,
      totalMilk,
      milkAmount,
      finalPay,
    };
  });

  const payableRows =
    paymentRows.filter(
      (row) => row.totalMilk > 0
    );

  const totalMilk =
    payableRows.reduce(
      (total, row) =>
        total + row.totalMilk,
      0
    );

  const totalAmount =
    payableRows.reduce(
      (total, row) =>
        total + row.finalPay,
      0
    );

  return (
    <MainLayout>
      <h1>Payment Register</h1>

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

      <div className="session-summary-grid">
        <div className="session-summary-card">
          <h3>Total Members</h3>
          <h2>{payableRows.length}</h2>
          <p>Members with milk</p>
        </div>

        <div className="session-summary-card">
          <h3>Total Milk</h3>
          <h2>{totalMilk} L</h2>
          <p>Period milk</p>
        </div>

        <div className="session-summary-card">
          <h3>Total Payable</h3>
          <h2>₹{totalAmount}</h2>
          <p>Owner payment amount</p>
        </div>
      </div>

      <table className="member-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Member Name</th>
            <th>Village</th>
            <th>Cow Milk</th>
            <th>Buffalo Milk</th>
            <th>Total Milk</th>
            <th>Milk Amount</th>
            <th>Final Pay</th>
          </tr>
        </thead>

        <tbody>
          {payableRows.map((row) => (
            <tr key={row.memberId}>
              <td>{row.memberId}</td>
              <td>{row.name}</td>
              <td>{row.village}</td>
              <td>{row.cowMilk} L</td>
              <td>{row.buffaloMilk} L</td>
              <td>{row.totalMilk} L</td>
              <td>₹{row.milkAmount}</td>
              <td>₹{row.finalPay}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </MainLayout>
  );
}

export default PaymentRegister;