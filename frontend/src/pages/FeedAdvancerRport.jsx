import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import DashboardCard from "../components/DashboardCard";

function FeedAdvanceReport() {
  const [members, setMembers] = useState([]);
  const [feedRecords, setFeedRecords] = useState([]);
  const [advanceRecords, setAdvanceRecords] = useState([]);

  const [reportType, setReportType] = useState("all");
  const [selectedMemberId, setSelectedMemberId] = useState("");

  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [toDate, setToDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    const savedMembers = localStorage.getItem("members");
    const savedFeed = localStorage.getItem("feedRecords");
    const savedAdvance = localStorage.getItem("advanceRecords");

    if (savedMembers) {
      setMembers(JSON.parse(savedMembers));
    }

    if (savedFeed) {
      setFeedRecords(JSON.parse(savedFeed));
    }

    if (savedAdvance) {
      setAdvanceRecords(JSON.parse(savedAdvance));
    }
  }, []);

  const filteredFeedRecords = feedRecords.filter((record) => {
    const dateMatch =
      record.date >= fromDate &&
      record.date <= toDate;

    const memberMatch =
      reportType === "all" ||
      record.memberId === selectedMemberId;

    return dateMatch && memberMatch;
  });

  const filteredAdvanceRecords = advanceRecords.filter((record) => {
    const dateMatch =
      record.date >= fromDate &&
      record.date <= toDate;

    const memberMatch =
      reportType === "all" ||
      record.memberId === selectedMemberId;

    return dateMatch && memberMatch;
  });

  const totalFeedAmount = filteredFeedRecords.reduce(
    (total, record) =>
      total + Number(record.amount),
    0
  );

  const totalAdvanceAmount = filteredAdvanceRecords.reduce(
    (total, record) =>
      total + Number(record.amount),
    0
  );

  const totalRemainingAdvance = filteredAdvanceRecords.reduce(
    (total, record) =>
      total + Number(record.remainingAmount || 0),
    0
  );

  const selectedMember = members.find(
    (member) => member.memberId === selectedMemberId
  );

  return (
    <MainLayout>
      <h1>Feed & Advance Report</h1>

      <div className="collection-form">
        <select
          value={reportType}
          onChange={(e) => {
            setReportType(e.target.value);
            setSelectedMemberId("");
          }}
        >
          <option value="all">All Members</option>
          <option value="single">Single Member</option>
        </select>

        {reportType === "single" && (
          <select
            value={selectedMemberId}
            onChange={(e) =>
              setSelectedMemberId(e.target.value)
            }
          >
            <option value="">Select Member</option>

            {members.map((member) => (
              <option
                key={member.memberId}
                value={member.memberId}
              >
                {member.memberId} - {member.name}
              </option>
            ))}
          </select>
        )}

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

      {reportType === "single" && selectedMember && (
        <div className="bill-box">
          <h3>
            Member: {selectedMember.memberId} - {selectedMember.name}
          </h3>
        </div>
      )}

      <div className="dashboard-cards">
        <DashboardCard
          title="Feed Amount"
          value={`₹${totalFeedAmount}`}
          icon="🌾"
          accent="#8d6e63"
          highlight
        />

        <DashboardCard
          title="Advance Amount"
          value={`₹${totalAdvanceAmount}`}
          icon="💰"
          accent="#1976d2"
          highlight
        />

        <DashboardCard
          title="Remaining Advance"
          value={`₹${totalRemainingAdvance}`}
          icon="📌"
          accent="#c62828"
        />
      </div>

      <div className="bill-box">
        <h2>Feed Details</h2>

        <table className="member-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Member ID</th>
              <th>Name</th>
              <th>Feed Type</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredFeedRecords.length === 0 ? (
              <tr>
                <td colSpan="8">No feed records found</td>
              </tr>
            ) : (
              filteredFeedRecords.map((record) => (
                <tr key={record.feedId}>
                  <td>{record.date}</td>
                  <td>{record.memberId}</td>
                  <td>{record.memberName}</td>
                  <td>{record.feedType}</td>
                  <td>{record.quantity}</td>
                  <td>₹{record.rate}</td>
                  <td>₹{record.amount}</td>
                  <td>{record.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bill-box">
        <h2>Advance Details</h2>

        <table className="member-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Member ID</th>
              <th>Name</th>
              <th>Advance Amount</th>
              <th>Remaining Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredAdvanceRecords.length === 0 ? (
              <tr>
                <td colSpan="6">No advance records found</td>
              </tr>
            ) : (
              filteredAdvanceRecords.map((record) => (
                <tr key={record.advanceId}>
                  <td>{record.date}</td>
                  <td>{record.memberId}</td>
                  <td>{record.memberName}</td>
                  <td>₹{record.amount}</td>
                  <td>₹{record.remainingAmount}</td>
                  <td>{record.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}

export default FeedAdvanceReport;