import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { formatAmount } from "../utils/amountUtils";

function PaymentRegister() {
  const [billRecords, setBillRecords] = useState([]);

  const [billMonth, setBillMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [billCycle, setBillCycle] = useState("1");

  useEffect(() => {
    const savedBills =
      localStorage.getItem("billRecords");

    if (savedBills) {
      setBillRecords(JSON.parse(savedBills));
    }
  }, []);

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

  const billingDates =
    getBillingDates(billMonth, billCycle);

  const fromDate = billingDates.fromDate;
  const toDate = billingDates.toDate;

  const paymentRows =
    billRecords.filter(
      (bill) =>
        bill.billMonth === billMonth &&
        bill.billCycle === billCycle
    );

  const totalMembers =
    paymentRows.length;

  const totalCowMilk =
    paymentRows.reduce(
      (total, bill) =>
        total + Number(bill.cowMilk || 0),
      0
    );

  const totalBuffaloMilk =
    paymentRows.reduce(
      (total, bill) =>
        total + Number(bill.buffaloMilk || 0),
      0
    );

  const totalMilk =
    paymentRows.reduce(
      (total, bill) =>
        total + Number(bill.totalMilk || 0),
      0
    );

  const totalMilkAmount =
    paymentRows.reduce(
      (total, bill) =>
        total + Number(bill.milkAmount || 0),
      0
    );

  const totalReserve =
    paymentRows.reduce(
      (total, bill) =>
        total + Number(bill.reserveAmount || 0),
      0
    );

  const totalFeed =
    paymentRows.reduce(
      (total, bill) =>
        total + Number(bill.feedDeducted || 0),
      0
    );

  const totalAdvance =
    paymentRows.reduce(
      (total, bill) =>
        total + Number(bill.advanceDeducted || 0),
      0
    );

  const totalDeduction =
    paymentRows.reduce(
      (total, bill) =>
        total + Number(bill.totalDeduction || 0),
      0
    );

  const totalRemainingDue =
    paymentRows.reduce(
      (total, bill) =>
        total + Number(bill.remainingDue || 0),
      0
    );

  const totalNetPayable =
    paymentRows.reduce(
      (total, bill) =>
        total + Number(bill.netPayable || 0),
      0
    );

  return (
    <MainLayout>
      <h1>Payment Register</h1>

      <div className="collection-form">
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

      <div className="session-summary-grid">
        <div className="session-summary-card">
          <h3>Total Bills</h3>
          <h2>{totalMembers}</h2>
          <p>Generated bills</p>
        </div>

        <div className="session-summary-card">
          <h3>Total Milk</h3>
          <h2>{formatAmount(totalMilk)} L</h2>
          <p>Cycle milk</p>
        </div>

        <div className="session-summary-card">
          <h3>Net Payable</h3>
          <h2>₹{formatAmount(totalNetPayable)}</h2>
          <p>Amount to distribute</p>
        </div>
      </div>

      <table className="member-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Member Name</th>
            <th>Cow Milk</th>
            <th>Buffalo Milk</th>
            <th>Total Milk</th>
            <th>Milk Amount</th>
            <th>Reserve</th>
            <th>Feed</th>
            <th>Advance</th>
            <th>Total Deduction</th>
            <th>Remaining Due</th>
            <th>Net Payable</th>
          </tr>
        </thead>

        <tbody>
          {paymentRows.length === 0 ? (
            <tr>
              <td colSpan="12">
                No generated bills found for this cycle.
              </td>
            </tr>
          ) : (
            paymentRows.map((bill) => (
              <tr key={bill.billId}>
                <td>{bill.memberId}</td>

                <td>{bill.memberName}</td>

                <td>
                  {formatAmount(bill.cowMilk)} L
                </td>

                <td>
                  {formatAmount(bill.buffaloMilk)} L
                </td>

                <td>
                  {formatAmount(bill.totalMilk)} L
                </td>

                <td>
                  ₹{formatAmount(bill.milkAmount)}
                </td>

                <td>
                  ₹{formatAmount(bill.reserveAmount)}
                </td>

                <td>
                  ₹{formatAmount(bill.feedDeducted)}
                </td>

                <td>
                  ₹{formatAmount(bill.advanceDeducted)}
                </td>

                <td>
                  ₹{formatAmount(bill.totalDeduction)}
                </td>

                <td>
                  ₹{formatAmount(bill.remainingDue)}
                </td>

                <td>
                  ₹{formatAmount(bill.netPayable)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="payment-summary-section">
        <h2>Payment Register Summary</h2>

        <table className="payment-summary-table">
          <thead>
            <tr>
              <th>Cow Information</th>
              <th>Buffalo Information</th>
              <th>Total Information</th>
              <th>Deduction Information</th>
              <th>Payment Information</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>
                <strong>Total Cow Liter</strong>
                <br />
                {formatAmount(totalCowMilk)} L
              </td>

              <td>
                <strong>Total Buffalo Liter</strong>
                <br />
                {formatAmount(totalBuffaloMilk)} L
              </td>

              <td>
                <strong>Total Milk</strong>
                <br />
                {formatAmount(totalMilk)} L
              </td>

              <td>
                <strong>Total Reserve</strong>
                <br />
                ₹{formatAmount(totalReserve)}
              </td>

              <td>
                <strong>Net Payable</strong>
                <br />
                ₹{formatAmount(totalNetPayable)}
              </td>
            </tr>

            <tr>
              <td>
                <strong>Cow Amount</strong>
                <br />
                ₹{formatAmount(
                  totalMilkAmount -
                    paymentRows.reduce(
                      (total, bill) =>
                        total +
                        Number(bill.buffaloAmount || 0),
                      0
                    )
                )}
              </td>

              <td>
                <strong>Buffalo Amount</strong>
                <br />
                ₹{formatAmount(
                  paymentRows.reduce(
                    (total, bill) =>
                      total +
                      Number(bill.buffaloAmount || 0),
                    0
                  )
                )}
              </td>

              <td>
                <strong>Milk Amount</strong>
                <br />
                ₹{formatAmount(totalMilkAmount)}
              </td>

              <td>
                <strong>Feed Deducted</strong>
                <br />
                ₹{formatAmount(totalFeed)}
              </td>

              <td>
                <strong>Remaining Due</strong>
                <br />
                ₹{formatAmount(totalRemainingDue)}
              </td>
            </tr>

            <tr>
              <td>-</td>
              <td>-</td>

              <td>
                <strong>Total Deduction</strong>
                <br />
                ₹{formatAmount(totalDeduction)}
              </td>

              <td>
                <strong>Advance Deducted</strong>
                <br />
                ₹{formatAmount(totalAdvance)}
              </td>

              <td>
                <strong>Final Payable</strong>
                <br />
                ₹{formatAmount(totalNetPayable)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}

export default PaymentRegister;