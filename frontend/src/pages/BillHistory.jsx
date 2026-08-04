import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorCard from "../components/ErrorCard";
import {
  cancelBill,
  getBillHistory,
} from "../services/billHistoryService";
import { formatAmount } from "../utils/amountUtils";

function BillHistory() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    billMonth: "",
    billCycle: "",
    status: "",
  });

  useEffect(() => {
    loadBills();
  }, []);

  async function loadBills() {
    try {
      setLoading(true);
      setError("");

      const result = await getBillHistory();
      setBills(result.data || []);
    } catch (error) {
      console.error("Bill history error:", error);
      setError(error.message || "Unable to load bill history");
    } finally {
      setLoading(false);
    }
  }

  const filteredBills = useMemo(() => {
    const searchText = filters.search.trim().toLowerCase();

    return bills.filter((bill) => {
      const matchesSearch =
        !searchText ||
        bill.billNumber?.toLowerCase().includes(searchText) ||
        bill.memberName?.toLowerCase().includes(searchText) ||
        bill.memberId?.toLowerCase().includes(searchText);

      const matchesMonth =
        !filters.billMonth || bill.billMonth === filters.billMonth;

      const matchesCycle =
        !filters.billCycle ||
        String(bill.billCycle) === String(filters.billCycle);

      const matchesStatus =
        !filters.status || bill.status === filters.status;

      return (
        matchesSearch &&
        matchesMonth &&
        matchesCycle &&
        matchesStatus
      );
    });
  }, [bills, filters]);

  const summary = useMemo(
    () => ({
      totalBills: filteredBills.length,
      totalPayable: filteredBills.reduce(
        (total, bill) => total + Number(bill.netPayable || 0),
        0
      ),
      totalPaid: filteredBills.reduce(
        (total, bill) => total + Number(bill.paidAmount || 0),
        0
      ),
      totalBalance: filteredBills.reduce(
        (total, bill) => total + Number(bill.balanceAmount || 0),
        0
      ),
    }),
    [filteredBills]
  );

  async function handleCancelBill(bill) {
    const confirmed = window.confirm(
      `Cancel bill ${bill.billNumber}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const result = await cancelBill(bill.billId);
      setMessage(result.message);
      await loadBills();
    } catch (error) {
      setMessage(error.message || "Unable to cancel bill");
    }
  }

  return (
    <MainLayout>
      <div className="bill-history-page">
        <div className="bill-history-header">
          <div>
            <span>Billing Records</span>
            <h1>Bill History</h1>
            <p>Review generated bills, payment status and balances.</p>
          </div>
          <button type="button" onClick={() => window.print()}>
            Print
          </button>
        </div>

        {message && (
          <div className="bill-history-message">{message}</div>
        )}

        <div className="bill-history-summary">
          <div>
            <span>Total Bills</span>
            <strong>{summary.totalBills}</strong>
          </div>
          <div>
            <span>Net Payable</span>
            <strong>₹{formatAmount(summary.totalPayable)}</strong>
          </div>
          <div>
            <span>Paid Amount</span>
            <strong>₹{formatAmount(summary.totalPaid)}</strong>
          </div>
          <div>
            <span>Pending Balance</span>
            <strong>₹{formatAmount(summary.totalBalance)}</strong>
          </div>
        </div>

        <section className="bill-history-card">
          <div className="bill-history-filters">
            <input
              placeholder="Search bill or member..."
              value={filters.search}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  search: event.target.value,
                }))
              }
            />

            <input
              type="month"
              value={filters.billMonth}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  billMonth: event.target.value,
                }))
              }
            />

            <select
              value={filters.billCycle}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  billCycle: event.target.value,
                }))
              }
            >
              <option value="">All Cycles</option>
              <option value="1">Cycle 1</option>
              <option value="2">Cycle 2</option>
              <option value="3">Cycle 3</option>
            </select>

            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  status: event.target.value,
                }))
              }
            >
              <option value="">All Statuses</option>
              <option>Pending</option>
              <option>Partially Paid</option>
              <option>Paid</option>
              <option>Cancelled</option>
            </select>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading bill history..." />
          ) : error ? (
            <ErrorCard
              title="Bill history could not be loaded"
              message={error}
              onRetry={loadBills}
            />
          ) : (
            <div className="bill-history-table-scroll">
              <table className="bill-history-table">
                <thead>
                  <tr>
                    <th>Bill No.</th>
                    <th>Member</th>
                    <th>Period</th>
                    <th>Milk</th>
                    <th>Net Payable</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Payments</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan="10">No bill history found</td>
                    </tr>
                  ) : (
                    filteredBills.map((bill) => (
                      <tr key={bill.billId}>
                        <td>{bill.billNumber}</td>
                        <td>
                          {bill.memberId} - {bill.memberName}
                        </td>
                        <td>
                          {bill.periodFrom} to {bill.periodTo}
                        </td>
                        <td>{bill.totalMilk} L</td>
                        <td>₹{formatAmount(bill.netPayable)}</td>
                        <td>₹{formatAmount(bill.paidAmount)}</td>
                        <td>₹{formatAmount(bill.balanceAmount)}</td>
                        <td>
                          <span
                            className={`bill-history-status ${String(
                              bill.status
                            )
                              .toLowerCase()
                              .replace(" ", "-")}`}
                          >
                            {bill.status}
                          </span>
                        </td>
                        <td>{bill.paymentCount}</td>
                        <td>
                          {bill.status !== "Cancelled" &&
                            Number(bill.paidAmount) === 0 && (
                              <button
                                type="button"
                                onClick={() => handleCancelBill(bill)}
                              >
                                Cancel
                              </button>
                            )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}

export default BillHistory;
