import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { formatAmount } from "../utils/amountUtils";

function BillHistory() {
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

  const filteredBills = billRecords.filter((bill) => {
    const monthMatch = bill.billMonth === billMonth;

    const cycleMatch = bill.billCycle === billCycle;

    const memberMatch =
      reportType === "all" ||
      bill.memberId === selectedMemberId;

    return monthMatch && cycleMatch && memberMatch;
  });

  const totalBills = filteredBills.length;

  const totalMilk = filteredBills.reduce(
    (total, bill) =>
      total + Number(bill.totalMilk || 0),
    0
  );

  const totalMilkAmount = filteredBills.reduce(
    (total, bill) =>
      total + Number(bill.milkAmount || 0),
    0
  );

  const totalReserve = filteredBills.reduce(
    (total, bill) =>
      total + Number(bill.reserveAmount || 0),
    0
  );

  const totalFeed = filteredBills.reduce(
    (total, bill) =>
      total + Number(bill.feedDeducted || 0),
    0
  );

  const totalAdvance = filteredBills.reduce(
    (total, bill) =>
      total + Number(bill.advanceDeducted || 0),
    0
  );

  const totalNetPayable = filteredBills.reduce(
    (total, bill) =>
      total + Number(bill.netPayable || 0),
    0
  );

  return (
    <MainLayout>
      <h1>Bill History Report</h1>

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
          <h3>Total Bills</h3>
          <h2>{totalBills}</h2>
          <p>Generated bills</p>
        </div>

        <div className="session-summary-card">
          <h3>Total Milk</h3>
          <h2>{formatAmount(totalMilk)} L</h2>
          <p>Cycle milk</p>
        </div>

        <div className="session-summary-card">
          <h3>Milk Amount</h3>
          <h2>₹{formatAmount(totalMilkAmount)}</h2>
          <p>Total milk amount</p>
        </div>

        <div className="session-summary-card">
          <h3>Net Payable</h3>
          <h2>₹{formatAmount(totalNetPayable)}</h2>
          <p>Final payable</p>
        </div>
      </div>

      <table className="member-table">
        <thead>
          <tr>
            <th>Bill ID</th>
            <th>Member ID</th>
            <th>Member Name</th>
            <th>Month</th>
            <th>Cycle</th>
            <th>Total Milk</th>
            <th>Milk Amount</th>
            <th>Reserve</th>
            <th>Feed</th>
            <th>Advance</th>
            <th>Remaining Due</th>
            <th>Net Payable</th>
            <th>Generated Date</th>
          </tr>
        </thead>

        <tbody>
          {filteredBills.length === 0 ? (
            <tr>
              <td colSpan="13">
                No bill records found.
              </td>
            </tr>
          ) : (
            filteredBills.map((bill) => (
              <tr key={bill.billId}>
                <td>{bill.billId}</td>
                <td>{bill.memberId}</td>
                <td>{bill.memberName}</td>
                <td>{bill.billMonth}</td>
                <td>{bill.billCycle}</td>
                <td>{formatAmount(bill.totalMilk)} L</td>
                <td>₹{formatAmount(bill.milkAmount)}</td>
                <td>₹{formatAmount(bill.reserveAmount)}</td>
                <td>₹{formatAmount(bill.feedDeducted)}</td>
                <td>₹{formatAmount(bill.advanceDeducted)}</td>
                <td>₹{formatAmount(bill.remainingDue)}</td>
                <td>₹{formatAmount(bill.netPayable)}</td>
                <td>{bill.generatedDate}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="payment-summary-section">
        <h2>Bill History Summary</h2>

        <table className="payment-summary-table">
          <tbody>
            <tr>
              <td>
                <strong>Total Bills</strong>
                <br />
                {totalBills}
              </td>

              <td>
                <strong>Total Milk</strong>
                <br />
                {formatAmount(totalMilk)} L
              </td>

              <td>
                <strong>Milk Amount</strong>
                <br />
                ₹{formatAmount(totalMilkAmount)}
              </td>

              <td>
                <strong>Reserve</strong>
                <br />
                ₹{formatAmount(totalReserve)}
              </td>
            </tr>

            <tr>
              <td>
                <strong>Feed</strong>
                <br />
                ₹{formatAmount(totalFeed)}
              </td>

              <td>
                <strong>Advance</strong>
                <br />
                ₹{formatAmount(totalAdvance)}
              </td>

              <td>
                <strong>Net Payable</strong>
                <br />
                ₹{formatAmount(totalNetPayable)}
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

export default BillHistory;