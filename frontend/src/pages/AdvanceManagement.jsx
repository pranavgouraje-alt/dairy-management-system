import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";

function AdvanceManagement() {
  const emptyForm = {
    memberId: "",
    memberName: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    status: "Pending",
  };

  const [members, setMembers] = useState([]);
  const [advanceData, setAdvanceData] =
    useState(emptyForm);
  const [advanceRecords, setAdvanceRecords] =
    useState([]);

  useEffect(() => {
    const savedMembers =
      localStorage.getItem("members");

    const savedAdvances =
      localStorage.getItem("advanceRecords");

    if (savedMembers) {
      setMembers(JSON.parse(savedMembers));
    }

    if (savedAdvances) {
      setAdvanceRecords(
        JSON.parse(savedAdvances)
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "advanceRecords",
      JSON.stringify(advanceRecords)
    );
  }, [advanceRecords]);

  function handleChange(e) {
    setAdvanceData({
      ...advanceData,
      [e.target.name]: e.target.value,
    });
  }

  function findMember(memberId) {
    const member = members.find(
      (m) => m.memberId === memberId
    );

    if (member) {
      setAdvanceData((prev) => ({
        ...prev,
        memberId,
        memberName: member.name,
      }));
    }
  }

  function saveAdvanceRecord() {
    if (
      !advanceData.memberId ||
      !advanceData.memberName ||
      !advanceData.amount
    ) {
      alert("Please fill all required fields");
      return;
    }

    const record = {
      advanceId: Date.now(),
      ...advanceData,
      remainingAmount: Number(advanceData.amount),
    };

    setAdvanceRecords([
      ...advanceRecords,
      record,
    ]);

    setAdvanceData(emptyForm);
  }

  function deleteAdvanceRecord(advanceId) {
    const updatedRecords =
      advanceRecords.filter(
        (record) =>
          record.advanceId !== advanceId
      );

    setAdvanceRecords(updatedRecords);
  }

  return (
    <MainLayout>
      <h1>Advance Management</h1>

      <div className="collection-form">
        <input
          name="memberId"
          placeholder="Member ID"
          value={advanceData.memberId}
          onChange={(e) => {
            handleChange(e);
            findMember(e.target.value);
          }}
        />

        <input
          name="memberName"
          placeholder="Member Name"
          value={advanceData.memberName}
          onChange={handleChange}
        />

        <input
          name="amount"
          placeholder="Advance Amount"
          value={advanceData.amount}
          onChange={handleChange}
        />

        <input
          type="date"
          name="date"
          value={advanceData.date}
          onChange={handleChange}
        />

        <select
          name="status"
          value={advanceData.status}
          onChange={handleChange}
        >
          <option>Pending</option>
          <option>Cleared</option>
        </select>

        <button onClick={saveAdvanceRecord}>
          Save Advance
        </button>
      </div>

      <table className="member-table">
        <thead>
          <tr>
            <th>Member ID</th>
            <th>Name</th>
            <th>Advance Amount</th>
            <th>Remaining</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {advanceRecords.map((record) => (
            <tr key={record.advanceId}>
              <td>{record.memberId}</td>
              <td>{record.memberName}</td>
              <td>₹{record.amount}</td>
              <td>₹{record.remainingAmount}</td>
              <td>{record.date}</td>
              <td>{record.status}</td>
              <td>
                <button
                  onClick={() =>
                    deleteAdvanceRecord(
                      record.advanceId
                    )
                  }
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </MainLayout>
  );
}

export default AdvanceManagement;