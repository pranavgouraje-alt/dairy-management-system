import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";

function FeedManagement() {
  const emptyForm = {
    memberId: "",
    memberName: "",
    feedType: "",
    quantity: "",
    rate: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    status: "Unpaid",
  };

  const [members, setMembers] = useState([]);
  const [feedData, setFeedData] = useState(emptyForm);
  const [feedRecords, setFeedRecords] = useState([]);

  useEffect(() => {
    const savedMembers = localStorage.getItem("members");
    const savedFeed = localStorage.getItem("feedRecords");

    if (savedMembers) {
      setMembers(JSON.parse(savedMembers));
    }

    if (savedFeed) {
      setFeedRecords(JSON.parse(savedFeed));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "feedRecords",
      JSON.stringify(feedRecords)
    );
  }, [feedRecords]);

  function handleChange(e) {
    const updatedData = {
      ...feedData,
      [e.target.name]: e.target.value,
    };

    if (
      e.target.name === "quantity" ||
      e.target.name === "rate"
    ) {
      updatedData.amount =
        Number(updatedData.quantity || 0) *
        Number(updatedData.rate || 0);
    }

    setFeedData(updatedData);
  }

  function findMember(memberId) {
    const member = members.find(
      (m) => m.memberId === memberId
    );

    if (member) {
      setFeedData((prev) => ({
        ...prev,
        memberId,
        memberName: member.name,
      }));
    }
  }

  function saveFeedRecord() {
    if (
      !feedData.memberId ||
      !feedData.memberName ||
      !feedData.feedType ||
      !feedData.quantity ||
      !feedData.rate
    ) {
      alert("Please fill all required fields");
      return;
    }

    const record = {
      feedId: Date.now(),
      ...feedData,
    };

    setFeedRecords([
      ...feedRecords,
      record,
    ]);

    setFeedData(emptyForm);
  }

  function deleteFeedRecord(feedId) {
    const updatedRecords =
      feedRecords.filter(
        (record) => record.feedId !== feedId
      );

    setFeedRecords(updatedRecords);
  }

  return (
    <MainLayout>
      <h1>Feed Management</h1>

      <div className="collection-form">
        <input
          name="memberId"
          placeholder="Member ID"
          value={feedData.memberId}
          onChange={(e) => {
            handleChange(e);
            findMember(e.target.value);
          }}
        />

        <input
          name="memberName"
          placeholder="Member Name"
          value={feedData.memberName}
          onChange={handleChange}
        />

        <input
          name="feedType"
          placeholder="Feed Type"
          value={feedData.feedType}
          onChange={handleChange}
        />

        <input
          name="quantity"
          placeholder="Quantity"
          value={feedData.quantity}
          onChange={handleChange}
        />

        <input
          name="rate"
          placeholder="Rate"
          value={feedData.rate}
          onChange={handleChange}
        />

        <input
          value={feedData.amount}
          readOnly
          placeholder="Amount"
        />

        <input
          type="date"
          name="date"
          value={feedData.date}
          onChange={handleChange}
        />

        <select
          name="status"
          value={feedData.status}
          onChange={handleChange}
        >
          <option>Unpaid</option>
          <option>Paid</option>
        </select>

        <button onClick={saveFeedRecord}>
          Save Feed
        </button>
      </div>

      <table className="member-table">
        <thead>
          <tr>
            <th>Member ID</th>
            <th>Name</th>
            <th>Feed Type</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {feedRecords.map((record) => (
            <tr key={record.feedId}>
              <td>{record.memberId}</td>
              <td>{record.memberName}</td>
              <td>{record.feedType}</td>
              <td>{record.quantity}</td>
              <td>₹{record.rate}</td>
              <td>₹{record.amount}</td>
              <td>{record.date}</td>
              <td>{record.status}</td>
              <td>
                <button
                  onClick={() =>
                    deleteFeedRecord(record.feedId)
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

export default FeedManagement;