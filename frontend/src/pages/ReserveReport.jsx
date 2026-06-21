import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { formatAmount } from "../utils/amountUtils";

function ReserveReport() {
  const [billRecords, setBillRecords] = useState([]);
  const [members, setMembers] = useState([]);

  const [reportType, setReportType] = useState("all");
  const [selectedMemberId, setSelectedMemberId] = useState("");

  const [billMonth, setBillMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [billCycle, setBillCycle] = useState("1");

  useEffect(() => {
    const savedBills = localStorage.getItem("billRecords");
    const savedMembers = localStorage.getItem("members");

    if (savedBills) {
      setBillRecords(JSON.parse(savedBills));
    }

    if (savedMembers) {
      setMembers(JSON.parse(savedMembers));
    }
  }, []);

  const filteredReserveRecords = billRecords.filter((bill) => {
    const monthMatch = bill.billMonth === billMonth;

    const cycleMatch = bill.billCycle === billCycle;

    const memberMatch =
      reportType === "all" ||
      bill.memberId === selectedMemberId;

    return monthMatch && cycleMatch && memberMatch;
  });

  const totalMembers = filteredReserveRecords.length;

  const totalMilkAmount = filteredReserveRecords.reduce(
    (total, bill) =>
      total + Number(bill.milkAmount || 0),
    0
  );

  const totalReserve = filteredReserveRecords.reduce(
    (total, bill) =>
      total + Number(bill.reserveAmount || 0),
    0
  );

  const totalNetPayable = filteredReserveRecords.reduce(
    (total, bill) =>
      total + Number(bill.netPayable || 0),
    0
  );

  return (
    <MainLayout>
      <h1>Reserve Report</h1>

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
          type="month"
          value={billMonth}
          onChange={(e) =>
            setBillMonth(e.target.value)
          }
        />

        <select
          value={billCycle}
          onChange={(e) =>
            setBillCycle(e.target.value)
          }
        >
          <option value="1">Cycle 1: 1 - 10</option>
          <option value="2">Cycle 2: 11 - 20</option>
          <option value="3">Cycle 3: 21 - End Month</option>
        </select>
      </div>

      <div className="session-summary-grid">
        <div className="session-summary-card">
          <h3>Total Members</h3>
          <h2>{totalMembers}</h2>
          <p>Members with reserve</p>
        </div>

        <div className="session-summary-card">
          <h3>Milk Amount</h3>
          <h2>₹{formatAmount(totalMilkAmount)}</h2>
          <p>Total milk amount</p>
        </div>

        <div className="session-summary-card">
          <h3>Reserve Amount</h3>
          <h2>₹{formatAmount(totalReserve)}</h2>
          <p>10% reserve</p>
        </div>

        <div className="session-summary-card">
          <h3>Net Payable</h3>
          <h2>₹{formatAmount(totalNetPayable)}</h2>
          <p>After deductions</p>
        </div>
      </div>

      <table className="member-table">
        <thead>
          <tr>
            <th>Member ID</th>
            <th>Member Name</th>
            <th>Month</th>
            <th>Cycle</th>
            <th>Milk Amount</th>
            <th>Reserve 10%</th>
            <th>Financial Year</th>
            <th>Generated Date</th>
          </tr>
        </thead>

        <tbody>
          {filteredReserveRecords.length === 0 ? (
            <tr>
              <td colSpan="8">
                No reserve records found.
              </td>
            </tr>
          ) : (
            filteredReserveRecords.map((bill) => (
              <tr key={bill.billId}>
                <td>{bill.memberId}</td>
                <td>{bill.memberName}</td>
                <td>{bill.billMonth}</td>
                <td>{bill.billCycle}</td>
                <td>₹{formatAmount(bill.milkAmount)}</td>
                <td>₹{formatAmount(bill.reserveAmount)}</td>
                <td>{bill.financialYear}</td>
                <td>{bill.generatedDate}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="payment-summary-section">
        <h2>Reserve Summary</h2>

        <table className="payment-summary-table">
          <tbody>
            <tr>
              <td>
                <strong>Total Members</strong>
                <br />
                {totalMembers}
              </td>

              <td>
                <strong>Total Milk Amount</strong>
                <br />
                ₹{formatAmount(totalMilkAmount)}
              </td>

              <td>
                <strong>Total Reserve</strong>
                <br />
                ₹{formatAmount(totalReserve)}
              </td>

              <td>
                <strong>Cycle</strong>
                <br />
                {billCycle}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}

export default ReserveReport;