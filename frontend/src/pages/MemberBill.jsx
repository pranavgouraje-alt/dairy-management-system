import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { formatAmount } from "../utils/amountUtils";

function MemberBill() {
  const [members, setMembers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [feedRecords, setFeedRecords] = useState([]);
  const [advanceRecords, setAdvanceRecords] = useState([]);
  const [billRecords, setBillRecords] = useState([]);

  const [selectedMemberId, setSelectedMemberId] = useState("");

  const [billMonth, setBillMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [billCycle, setBillCycle] = useState("1");

  useEffect(() => {
    const savedMembers = localStorage.getItem("members");
    const savedCollections = localStorage.getItem("collections");
    const savedFeed = localStorage.getItem("feedRecords");
    const savedAdvance = localStorage.getItem("advanceRecords");
    const savedBills = localStorage.getItem("billRecords");

    if (savedMembers) {
      setMembers(JSON.parse(savedMembers));
    }

    if (savedCollections) {
      setCollections(JSON.parse(savedCollections));
    }

    if (savedFeed) {
      setFeedRecords(JSON.parse(savedFeed));
    }

    if (savedAdvance) {
      setAdvanceRecords(JSON.parse(savedAdvance));
    }

    if (savedBills) {
      setBillRecords(JSON.parse(savedBills));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "billRecords",
      JSON.stringify(billRecords)
    );
  }, [billRecords]);

  function getBillingDates(month, cycle) {
    const [year, monthNumber] = month.split("-");

    let fromDay = "01";
    let toDay = "10";

    if (cycle === "2") {
      fromDay = "11";
      toDay = "20";
    }

    if (cycle === "3") {
      fromDay = "21";

      const lastDay = new Date(
        Number(year),
        Number(monthNumber),
        0
      ).getDate();

      toDay = String(lastDay).padStart(2, "0");
    }

    return {
      fromDate: `${year}-${monthNumber}-${fromDay}`,
      toDate: `${year}-${monthNumber}-${toDay}`,
    };
  }

  function getFinancialYear(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    if (month >= 9) {
      return `${year}-${year + 1}`;
    }

    return `${year - 1}-${year}`;
  }

  const billingDates = getBillingDates(billMonth, billCycle);

  const fromDate = billingDates.fromDate;
  const toDate = billingDates.toDate;

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

  function getMilkTotal(data, milkType) {
    return data
      .filter((collection) => collection.milkType === milkType)
      .reduce(
        (total, collection) =>
          total + Number(collection.quantity || 0),
        0
      );
  }

  function getAmountTotal(data, milkType) {
    return data
      .filter((collection) => collection.milkType === milkType)
      .reduce(
        (total, collection) =>
          total + Number(collection.amount || 0),
        0
      );
  }

  function calculateDeductions({
    milkAmount,
    feedDue,
    advanceDue,
  }) {
    const reserveAmount = Number(
      (milkAmount * 0.1).toFixed(2)
    );

    const amountAfterReserve = Number(
      (milkAmount - reserveAmount).toFixed(2)
    );

    const feedDeducted = Number(
      Math.min(
        feedDue,
        Math.max(amountAfterReserve, 0)
      ).toFixed(2)
    );

    const amountAfterFeed = Number(
      (amountAfterReserve - feedDeducted).toFixed(2)
    );

    const advanceDeducted = Number(
      Math.min(
        advanceDue,
        Math.max(amountAfterFeed, 0)
      ).toFixed(2)
    );

    const netPayable = Number(
      Math.max(
        amountAfterFeed - advanceDeducted,
        0
      ).toFixed(2)
    );

    const remainingDue = Number(
      (
        feedDue +
        advanceDue -
        feedDeducted -
        advanceDeducted
      ).toFixed(2)
    );

    const totalDeduction = Number(
      (
        reserveAmount +
        feedDeducted +
        advanceDeducted
      ).toFixed(2)
    );

    return {
      reserveAmount,
      feedDeducted,
      advanceDeducted,
      totalDeduction,
      remainingDue,
      netPayable,
    };
  }

  function getFeedDue(memberId) {
    const memberFeedRecords = feedRecords.filter(
      (record) =>
        record.memberId === memberId &&
        record.date >= fromDate &&
        record.date <= toDate &&
        record.status !== "Deducted"
    );

    return Number(
      memberFeedRecords
        .reduce(
          (total, record) =>
            total +
            Number(
              record.remainingAmount ??
              record.amount ??
              0
            ),
          0
        )
        .toFixed(2)
    );
  }

  function getAdvanceDue(memberId) {
    const memberAdvanceRecords = advanceRecords.filter(
      (record) =>
        record.memberId === memberId &&
        record.status !== "Cleared"
    );

    return Number(
      memberAdvanceRecords
        .reduce(
          (total, record) =>
            total +
            Number(
              record.remainingAmount ??
              record.amount ??
              0
            ),
          0
        )
        .toFixed(2)
    );
  }

  const cowMilk = getMilkTotal(billCollections, "Cow");
  const buffaloMilk = getMilkTotal(billCollections, "Buffalo");

  const cowAmount = getAmountTotal(billCollections, "Cow");
  const buffaloAmount = getAmountTotal(billCollections, "Buffalo");

  const totalMilk = cowMilk + buffaloMilk;

  const totalAmount = Number(
    (cowAmount + buffaloAmount).toFixed(2)
  );

  const feedDeduction = getFeedDue(selectedMemberId);
  const advanceDue = getAdvanceDue(selectedMemberId);

  const singleBillDeductions = calculateDeductions({
    milkAmount: totalAmount,
    feedDue: feedDeduction,
    advanceDue,
  });

  const reserveAmount = singleBillDeductions.reserveAmount;
  const feedDeductionApplied = singleBillDeductions.feedDeducted;
  const advanceDeductionApplied = singleBillDeductions.advanceDeducted;
  const totalDeduction = singleBillDeductions.totalDeduction;
  const remainingDue = singleBillDeductions.remainingDue;
  const netPayable = singleBillDeductions.netPayable;

  const periodCollections = collections.filter(
    (collection) =>
      collection.collectionDate >= fromDate &&
      collection.collectionDate <= toDate
  );

  const billMemberIds = [
    ...new Set(
      periodCollections.map(
        (collection) => collection.memberId
      )
    ),
  ];

  function createBillRecord(memberId) {
    const member = members.find(
      (m) => m.memberId === memberId
    );

    const memberCollections = periodCollections.filter(
      (collection) => collection.memberId === memberId
    );

    const cowMilk = getMilkTotal(memberCollections, "Cow");
    const buffaloMilk = getMilkTotal(memberCollections, "Buffalo");

    const cowAmount = getAmountTotal(memberCollections, "Cow");
    const buffaloAmount = getAmountTotal(
      memberCollections,
      "Buffalo"
    );

    const totalMilk = cowMilk + buffaloMilk;

    const milkAmount = Number(
      (cowAmount + buffaloAmount).toFixed(2)
    );

    const feedDue = getFeedDue(memberId);
    const advanceDue = getAdvanceDue(memberId);

    const deductionResult = calculateDeductions({
      milkAmount,
      feedDue,
      advanceDue,
    });

    return {
      billId:
        Date.now() +
        Math.floor(Math.random() * 100000),

      memberId,
      memberName: member?.name || "",

      billMonth,
      billCycle,

      fromDate,
      toDate,

      totalMilk,
      cowMilk,
      buffaloMilk,

      milkAmount,
      cowAmount,
      buffaloAmount,

      reserveAmount: deductionResult.reserveAmount,

      feedDue,
      feedDeducted: deductionResult.feedDeducted,

      advanceDue,
      advanceDeducted: deductionResult.advanceDeducted,

      totalDeduction: deductionResult.totalDeduction,
      remainingDue: deductionResult.remainingDue,
      netPayable: deductionResult.netPayable,

      financialYear: getFinancialYear(fromDate),

      billStatus: "Generated",

      generatedDate: new Date()
        .toISOString()
        .split("T")[0],

      generatedTime: new Date().toLocaleTimeString(),
    };
  }

  function generateBill() {
    if (!selectedMemberId) {
      alert("Please select member");
      return;
    }

    if (billCollections.length === 0) {
      alert("No milk collection found for this bill cycle");
      return;
    }

    const billRecord = createBillRecord(selectedMemberId);

    const filteredBills = billRecords.filter(
      (bill) =>
        !(
          bill.memberId === selectedMemberId &&
          bill.billMonth === billMonth &&
          bill.billCycle === billCycle
        )
    );

    setBillRecords([
      ...filteredBills,
      billRecord,
    ]);

    alert("Bill generated / updated successfully");
  }

  function generateAllBills() {
    if (periodCollections.length === 0) {
      alert(
        "No milk collection found for this billing cycle"
      );
      return;
    }

    const newBills = billMemberIds.map(
      (memberId) => createBillRecord(memberId)
    );

    const filteredBills = billRecords.filter(
      (bill) =>
        !(
          bill.billMonth === billMonth &&
          bill.billCycle === billCycle
        )
    );

    setBillRecords([
      ...filteredBills,
      ...newBills,
    ]);

    alert(
      `${newBills.length} bills generated / updated successfully`
    );
  }

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
                <td>₹{formatAmount(collection.rate)}</td>
                <td>₹{formatAmount(collection.amount)}</td>
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
          <option value="1">
            Cycle 1: 1 - 10
          </option>

          <option value="2">
            Cycle 2: 11 - 20
          </option>

          <option value="3">
            Cycle 3: 21 - End Month
          </option>
        </select>
      </div>

      <p>
        <strong>Billing Period:</strong>{" "}
        {fromDate} to {toDate}
      </p>

      <div style={{ marginBottom: "20px" }}>
        <button
          className="generate-bill-btn"
          onClick={generateAllBills}
        >
          Generate / Update All Bills
        </button>
      </div>

      {selectedMemberId && (
        <div className="bill-box">
          <div className="bill-header">
            <h2>Milk Bill Preview</h2>

            <p>
              <strong>Member:</strong>{" "}
              {selectedMember?.memberId} -{" "}
              {selectedMember?.name}
            </p>

            <p>
              <strong>Period:</strong>{" "}
              {fromDate} to {toDate}
            </p>
          </div>

          <div className="bill-parallel-layout">
            <div className="bill-animal-section">
              <h2>🐄 Cow Milk</h2>

              <div className="bill-session-container">
                <div className="bill-session-box">
                  <h3 className="bill-session-title">
                    Morning
                  </h3>
                  {renderTable(cowMorningCollections)}
                </div>

                <div className="bill-session-box">
                  <h3>Evening</h3>
                  {renderTable(cowEveningCollections)}
                </div>
              </div>

              <div className="animal-total">
                <p>
                  <strong>Cow Milk:</strong>{" "}
                  {cowMilk} L
                </p>

                <p>
                  <strong>Cow Amount:</strong>{" "}
                  ₹{formatAmount(cowAmount)}
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
                  <strong>Buffalo Milk:</strong>{" "}
                  {buffaloMilk} L
                </p>

                <p>
                  <strong>Buffalo Amount:</strong>{" "}
                  ₹{formatAmount(buffaloAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bill-final-summary">
            <h2>Bill Summary</h2>

            <table className="bill-summary-table">
              <tbody>
                <tr>
                  <td>Total Milk</td>
                  <td>{totalMilk} L</td>
                </tr>

                <tr>
                  <td>Milk Amount</td>
                  <td>₹{formatAmount(totalAmount)}</td>
                </tr>

                <tr>
                  <td>Reserve Amount 10%</td>
                  <td>₹{formatAmount(reserveAmount)}</td>
                </tr>

                <tr>
                  <td>Feed Due</td>
                  <td>₹{formatAmount(feedDeduction)}</td>
                </tr>

                <tr>
                  <td>Feed Deducted</td>
                  <td>₹{formatAmount(feedDeductionApplied)}</td>
                </tr>

                <tr>
                  <td>Advance Due</td>
                  <td>₹{formatAmount(advanceDue)}</td>
                </tr>

                <tr>
                  <td>Advance Deducted</td>
                  <td>₹{formatAmount(advanceDeductionApplied)}</td>
                </tr>

                <tr>
                  <td>Total Deduction</td>
                  <td>₹{formatAmount(totalDeduction)}</td>
                </tr>

                <tr>
                  <td>Remaining Due</td>
                  <td>₹{formatAmount(remainingDue)}</td>
                </tr>

                <tr className="net-payable-row">
                  <td>Net Payable</td>
                  <td>₹{formatAmount(netPayable)}</td>
                </tr>
              </tbody>
            </table>

            <button
              className="generate-bill-btn"
              onClick={generateBill}
            >
              Generate / Update This Bill
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default MemberBill;
