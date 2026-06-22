import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { formatAmount } from "../utils/amountUtils";

function PrintAllBills() {
  const [billRecords, setBillRecords] = useState([]);
  const [collections, setCollections] = useState([]);

  const [billMonth, setBillMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [billCycle, setBillCycle] = useState("1");

  useEffect(() => {
    const savedBills = localStorage.getItem("billRecords");
    const savedCollections = localStorage.getItem("collections");

    if (savedBills) {
      setBillRecords(JSON.parse(savedBills));
    }

    if (savedCollections) {
      setCollections(JSON.parse(savedCollections));
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

  function getDateLabel(date) {
    const d = new Date(date);

    return (
      String(d.getDate()).padStart(2, "0") +
      "/" +
      String(d.getMonth() + 1).padStart(2, "0")
    );
  }

  function getEntry(data, date, session) {
    return data.find(
      (entry) =>
        entry.collectionDate === date &&
        entry.session === session
    );
  }

  const billingDates = getBillingDates(billMonth, billCycle);

  const fromDate = billingDates.fromDate;
  const toDate = billingDates.toDate;

  const printableBills = billRecords.filter(
    (bill) =>
      bill.billMonth === billMonth &&
      bill.billCycle === billCycle
  );

  function renderCompactBill(bill) {
    const billCollections = collections.filter(
      (collection) =>
        collection.memberId === bill.memberId &&
        collection.collectionDate >= bill.fromDate &&
        collection.collectionDate <= bill.toDate
    );

    const billDates = [
      ...new Set(
        billCollections.map(
          (entry) => entry.collectionDate
        )
      ),
    ].sort();

    const cowCollections = billCollections.filter(
      (entry) => entry.milkType === "Cow"
    );

    const buffaloCollections = billCollections.filter(
      (entry) => entry.milkType === "Buffalo"
    );

    return (
      <div className="single-print-bill" key={bill.billId}>
        <div className="compact-bill">
          <div className="compact-bill-header">
            <h2>Dairy Milk Bill</h2>

            <div className="compact-bill-top">
              <p>
                <strong>खाते:</strong>{" "}
                {bill.memberId} ({bill.memberName})
              </p>

              <p>
                <strong>कालावधी:</strong>{" "}
                {bill.fromDate} ते {bill.toDate}
              </p>
            </div>
          </div>

          <table className="compact-ledger-table">
            <thead>
              <tr>
                <th rowSpan="3">दिनांक</th>
                <th colSpan="10">गाय</th>
                <th colSpan="10">म्हैस</th>
              </tr>

              <tr>
                <th colSpan="5">M सकाळ</th>
                <th colSpan="5">E संध्याकाळ</th>
                <th colSpan="5">M सकाळ</th>
                <th colSpan="5">E संध्याकाळ</th>
              </tr>

              <tr>
                <th>लिटर</th>
                <th>फॅट</th>
                <th>SNF</th>
                <th>रेट</th>
                <th>रक्कम</th>

                <th>लिटर</th>
                <th>फॅट</th>
                <th>SNF</th>
                <th>रेट</th>
                <th>रक्कम</th>

                <th>लिटर</th>
                <th>फॅट</th>
                <th>SNF</th>
                <th>रेट</th>
                <th>रक्कम</th>

                <th>लिटर</th>
                <th>फॅट</th>
                <th>SNF</th>
                <th>रेट</th>
                <th>रक्कम</th>
              </tr>
            </thead>

            <tbody>
              {billDates.length === 0 ? (
                <tr>
                  <td colSpan="21">
                    No milk collection records found for this bill.
                  </td>
                </tr>
              ) : (
                billDates.map((date) => {
                  const cowMorning = getEntry(
                    cowCollections,
                    date,
                    "Morning"
                  );

                  const cowEvening = getEntry(
                    cowCollections,
                    date,
                    "Evening"
                  );

                  const buffaloMorning = getEntry(
                    buffaloCollections,
                    date,
                    "Morning"
                  );

                  const buffaloEvening = getEntry(
                    buffaloCollections,
                    date,
                    "Evening"
                  );

                  return (
                    <tr key={`${bill.billId}-${date}`}>
                      <td>{getDateLabel(date)}</td>

                      <td>{cowMorning?.quantity || ""}</td>
                      <td>{cowMorning?.fat || ""}</td>
                      <td>{cowMorning?.snf || ""}</td>
                      <td>{cowMorning?.rate || ""}</td>
                      <td>
                        {cowMorning
                          ? formatAmount(cowMorning.amount)
                          : ""}
                      </td>

                      <td>{cowEvening?.quantity || ""}</td>
                      <td>{cowEvening?.fat || ""}</td>
                      <td>{cowEvening?.snf || ""}</td>
                      <td>{cowEvening?.rate || ""}</td>
                      <td>
                        {cowEvening
                          ? formatAmount(cowEvening.amount)
                          : ""}
                      </td>

                      <td>{buffaloMorning?.quantity || ""}</td>
                      <td>{buffaloMorning?.fat || ""}</td>
                      <td>{buffaloMorning?.snf || ""}</td>
                      <td>{buffaloMorning?.rate || ""}</td>
                      <td>
                        {buffaloMorning
                          ? formatAmount(buffaloMorning.amount)
                          : ""}
                      </td>

                      <td>{buffaloEvening?.quantity || ""}</td>
                      <td>{buffaloEvening?.fat || ""}</td>
                      <td>{buffaloEvening?.snf || ""}</td>
                      <td>{buffaloEvening?.rate || ""}</td>
                      <td>
                        {buffaloEvening
                          ? formatAmount(buffaloEvening.amount)
                          : ""}
                      </td>
                    </tr>
                  );
                })
              )}

              <tr className="compact-total-row">
                <td>एकूण</td>

                <td colSpan="4">गाय लिटर</td>
                <td>{formatAmount(bill.cowMilk)}</td>

                <td colSpan="4">गाय रक्कम</td>
                <td>{formatAmount(bill.cowAmount)}</td>

                <td colSpan="4">म्हैस लिटर</td>
                <td>{formatAmount(bill.buffaloMilk)}</td>

                <td colSpan="4">म्हैस रक्कम</td>
                <td>{formatAmount(bill.buffaloAmount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="compact-summary-grid">
            <div className="compact-summary-box">
              <h4>गाय माहिती</h4>
              <p>लिटर: {formatAmount(bill.cowMilk)}</p>
              <p>रक्कम: ₹{formatAmount(bill.cowAmount)}</p>
            </div>

            <div className="compact-summary-box">
              <h4>म्हैस माहिती</h4>
              <p>लिटर: {formatAmount(bill.buffaloMilk)}</p>
              <p>रक्कम: ₹{formatAmount(bill.buffaloAmount)}</p>
            </div>

            <div className="compact-summary-box">
              <h4>एकूण माहिती</h4>
              <p>एकूण लिटर: {formatAmount(bill.totalMilk)}</p>
              <p>एकूण रक्कम: ₹{formatAmount(bill.milkAmount)}</p>
            </div>

            <div className="compact-summary-box bill-info-box">
              <h4>बिल माहिती</h4>
              <p>दूध रक्कम: ₹{formatAmount(bill.milkAmount)}</p>
              <p>राखीव 10%: ₹{formatAmount(bill.reserveAmount)}</p>
              <p>फीड कपात: ₹{formatAmount(bill.feedDeducted)}</p>
              <p>
                अ‍ॅडव्हान्स कपात: ₹
                {formatAmount(bill.advanceDeducted)}
              </p>
              <p>उर्वरित देय: ₹{formatAmount(bill.remainingDue)}</p>
              <h3>देय रक्कम: ₹{formatAmount(bill.netPayable)}</h3>
            </div>
          </div>

          <div className="compact-bottom-summary">
            <div>
              <strong>एकूण लिटर</strong>
              <br />
              {formatAmount(bill.totalMilk)}
            </div>

            <div>
              <strong>एकूण रक्कम</strong>
              <br />
              ₹{formatAmount(bill.milkAmount)}
            </div>

            <div>
              <strong>एकूण कपात</strong>
              <br />
              ₹{formatAmount(bill.totalDeduction)}
            </div>

            <div>
              <strong>बाकी (+)</strong>
              <br />
              ₹{formatAmount(bill.remainingDue)}
            </div>

            <div>
              <strong>अदा रक्कम</strong>
              <br />
              ₹{formatAmount(bill.netPayable)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <h1>Print All Bills</h1>

      <div className="collection-form no-print">
        <input
          type="month"
          value={billMonth}
          onChange={(e) => setBillMonth(e.target.value)}
        />

        <select
          value={billCycle}
          onChange={(e) => setBillCycle(e.target.value)}
        >
          <option value="1">Cycle 1: 1 - 10</option>
          <option value="2">Cycle 2: 11 - 20</option>
          <option value="3">Cycle 3: 21 - End Month</option>
        </select>

        <button
          className="print-bill-btn"
          onClick={() => window.print()}
        >
          Print All Bills
        </button>
      </div>

      <p className="no-print">
        <strong>Billing Period:</strong>{" "}
        {fromDate} to {toDate}
      </p>

      <div className="print-all-area">
        {printableBills.length === 0 ? (
          <p>No bills found for this cycle.</p>
        ) : (
          printableBills.map((bill) => renderCompactBill(bill))
        )}
      </div>
    </MainLayout>
  );
}

export default PrintAllBills;
