import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorCard from "../components/ErrorCard";
import { getBills, getBillById } from "../services/billService";
import { printAllBills } from "../utils/billPrintUtils";

function PrintAllBills() {
  const [billMonth, setBillMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [billCycle, setBillCycle] = useState("1");
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadBills();
  }, [billMonth, billCycle]);

  async function loadBills() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const list = await getBills({
        billMonth,
        billCycle: Number(billCycle),
      });

      const details = await Promise.all(
        (list.data || []).map(async (bill) => {
          const result = await getBillById(bill.billId);
          return result.data;
        })
      );

      setBills(details);
    } catch (error) {
      setError(error.message || "Unable to load bills");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    try {
      printAllBills(bills);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <MainLayout>
      <div className="print-all-bills-page">
        <div className="print-all-header">
          <div>
            <span>Batch Printing</span>
            <h1>Print All Bills</h1>
            <p>Every generated bill prints on a separate page.</p>
          </div>

          <button
            type="button"
            disabled={loading || bills.length === 0}
            onClick={handlePrint}
          >
            Print {bills.length} Bills
          </button>
        </div>

        {message && <div className="print-message">{message}</div>}

        <section className="print-filter">
          <input
            type="month"
            value={billMonth}
            onChange={(e) => setBillMonth(e.target.value)}
          />

          <select
            value={billCycle}
            onChange={(e) => setBillCycle(e.target.value)}
          >
            <option value="1">Cycle 1: 1–10</option>
            <option value="2">Cycle 2: 11–20</option>
            <option value="3">Cycle 3: 21–End</option>
          </select>

          <button type="button" onClick={loadBills}>Reload</button>
        </section>

        {loading ? (
          <LoadingSpinner message="Loading generated bills..." />
        ) : error ? (
          <ErrorCard
            title="Bills could not be loaded"
            message={error}
            onRetry={loadBills}
          />
        ) : bills.length === 0 ? (
          <div className="print-empty-state">
            No generated bills found for this month and cycle.
          </div>
        ) : (
          <div className="print-bill-list">
            {bills.map((bill) => (
              <div className="print-bill-card" key={bill.billId}>
                <strong>{bill.billNumber}</strong>
                <span>{bill.memberId} - {bill.memberName}</span>
                <span>₹{bill.netPayable}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default PrintAllBills;
