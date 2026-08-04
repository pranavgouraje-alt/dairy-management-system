import {
  useEffect,
  useMemo,
  useState,
} from "react";

import MainLayout from "../layouts/MainLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorCard from "../components/ErrorCard";

import {
  getBills,
  getBillById,
} from "../services/billService";

import {
  addPayment,
} from "../services/paymentService";

import {
  formatAmount,
} from "../utils/amountUtils";

import {
  printPaymentRegister,
} from "../utils/billPrintUtils";

function getBillingPeriod(
  month,
  cycle
) {
  if (!month) {
    return {
      fromDate: "",
      toDate: "",
    };
  }

  const [
    year,
    monthNumber,
  ] = month.split("-");

  let fromDay = "01";
  let toDay = "10";

  if (String(cycle) === "2") {
    fromDay = "11";
    toDay = "20";
  }

  if (String(cycle) === "3") {
    fromDay = "21";

    toDay = String(
      new Date(
        Number(year),
        Number(monthNumber),
        0
      ).getDate()
    ).padStart(2, "0");
  }

  return {
    fromDate:
      `${year}-${monthNumber}-${fromDay}`,

    toDate:
      `${year}-${monthNumber}-${toDay}`,
  };
}

function numberValue(value) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function PaymentRegister() {
  const [billMonth, setBillMonth] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 7)
    );

  const [billCycle, setBillCycle] =
    useState("1");

  const [bills, setBills] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
    selectedPaymentBill,
    setSelectedPaymentBill,
  ] = useState(null);

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("Cash");

  const [
    paymentReference,
    setPaymentReference,
  ] = useState("");

  const billingPeriod =
    useMemo(
      () =>
        getBillingPeriod(
          billMonth,
          billCycle
        ),
      [
        billMonth,
        billCycle,
      ]
    );

  useEffect(() => {
    loadBills();
  }, [
    billMonth,
    billCycle,
  ]);

  async function loadBills() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const result =
        await getBills({
          billMonth,
          billCycle:
            Number(billCycle),
        });

      setBills(
        result.data || []
      );
    } catch (error) {
      console.error(
        "Payment register loading error:",
        error
      );

      setError(
        error.message ||
          "Unable to load payment register"
      );
    } finally {
      setLoading(false);
    }
  }

  const totals =
    useMemo(() => {
      return bills.reduce(
        (summary, bill) => {
          summary.cowMilk +=
            numberValue(
              bill.cowMilk
            );

          summary.cowAmount +=
            numberValue(
              bill.cowAmount
            );

          summary.buffaloMilk +=
            numberValue(
              bill.buffaloMilk
            );

          summary.buffaloAmount +=
            numberValue(
              bill.buffaloAmount
            );

          summary.milkAmount +=
            numberValue(
              bill.milkAmount
            );

          summary.reserveAmount +=
            numberValue(
              bill.reserveAmount
            );

          summary.feedDeducted +=
            numberValue(
              bill.feedDeducted
            );

          summary.advanceDeducted +=
            numberValue(
              bill.advanceDeducted
            );

          summary.otherDeduction +=
            numberValue(
              bill.otherDeduction
            );

          summary.totalDeduction +=
            numberValue(
              bill.totalDeduction
            );

          summary.netPayable +=
            numberValue(
              bill.netPayable
            );

          summary.paidAmount +=
            numberValue(
              bill.paidAmount
            );

          summary.balanceAmount +=
            numberValue(
              bill.balanceAmount
            );

          summary.totalMilk +=
            numberValue(
              bill.totalMilk
            );

          return summary;
        },
        {
          cowMilk: 0,
          cowAmount: 0,
          buffaloMilk: 0,
          buffaloAmount: 0,
          milkAmount: 0,
          reserveAmount: 0,
          feedDeducted: 0,
          advanceDeducted: 0,
          otherDeduction: 0,
          totalDeduction: 0,
          netPayable: 0,
          paidAmount: 0,
          balanceAmount: 0,
          totalMilk: 0,
        }
      );
    }, [bills]);

  function openPaymentModal(
    bill
  ) {
    setSelectedPaymentBill(
      bill
    );

    setPaymentAmount(
      String(
        bill.balanceAmount || ""
      )
    );

    setPaymentMethod("Cash");
    setPaymentReference("");
    setMessage("");
  }

  function closePaymentModal() {
    setSelectedPaymentBill(
      null
    );

    setPaymentAmount("");
    setPaymentReference("");
  }

  async function handleSavePayment() {
    if (!selectedPaymentBill) {
      return;
    }

    const amount =
      numberValue(
        paymentAmount
      );

    if (amount <= 0) {
      setMessage(
        "Please enter a valid payment amount."
      );

      return;
    }

    if (
      amount >
      numberValue(
        selectedPaymentBill.balanceAmount
      )
    ) {
      setMessage(
        "Payment cannot exceed the pending balance."
      );

      return;
    }

    try {
      const result =
        await addPayment(
          selectedPaymentBill.billId,
          {
            amount,

            paymentDate:
              new Date()
                .toISOString()
                .slice(0, 10),

            paymentMethod,

            referenceNumber:
              paymentReference,

            note:
              `Payment for ${selectedPaymentBill.billNumber}`,

            receivedBy:
              "Admin",
          }
        );

      setMessage(
        result.message ||
          "Payment recorded successfully."
      );

      closePaymentModal();

      await loadBills();
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      setMessage(
        error.message ||
          "Unable to record payment"
      );
    }
  }

  async function handlePrint() {
    try {
      setMessage("");

      const billDetails =
        await Promise.all(
          bills.map(
            async (bill) => {
              const result =
                await getBillById(
                  bill.billId
                );

              return result.data;
            }
          )
        );

      printPaymentRegister({
        bills:
          billDetails,

        billMonth,

        billCycle:
          Number(billCycle),

        fromDate:
          billingPeriod.fromDate,

        toDate:
          billingPeriod.toDate,

        totals,
      });
    } catch (error) {
      console.error(
        "Payment register print error:",
        error
      );

      setMessage(
        error.message ||
          "Unable to print payment register"
      );
    }
  }

  return (
    <MainLayout>
      <div className="target-payment-register">
        <div className="target-page-header">
          <div>
            <span className="target-page-label">
              10-Day Settlement
            </span>

            <h1>
              Payment Register
            </h1>

            <p>
              Member-wise milk amount,
              deductions, payment and
              remaining balance.
            </p>
          </div>

          <div className="target-header-actions">
            <button
              type="button"
              onClick={loadBills}
              disabled={loading}
            >
              Refresh
            </button>

            <button
              type="button"
              className="primary-action"
              onClick={handlePrint}
              disabled={
                loading ||
                bills.length === 0
              }
            >
              Print Register
            </button>
          </div>
        </div>

        {message && (
          <div className="target-message">
            {message}
          </div>
        )}

        <section className="target-filter-card">
          <div>
            <label>Bill Month</label>

            <input
              type="month"
              value={billMonth}
              onChange={(event) =>
                setBillMonth(
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <label>Bill Cycle</label>

            <select
              value={billCycle}
              onChange={(event) =>
                setBillCycle(
                  event.target.value
                )
              }
            >
              <option value="1">
                Cycle 1 · 1–10
              </option>

              <option value="2">
                Cycle 2 · 11–20
              </option>

              <option value="3">
                Cycle 3 · 21–Month End
              </option>
            </select>
          </div>

          <div className="target-period-box">
            <span>Period</span>

            <strong>
              {billingPeriod.fromDate}
              {" to "}
              {billingPeriod.toDate}
            </strong>
          </div>

          <div className="target-record-count">
            <span>
              Generated Bills
            </span>

            <strong>
              {bills.length}
            </strong>
          </div>
        </section>

        {loading ? (
          <LoadingSpinner
            message="Loading payment register..."
          />
        ) : error ? (
          <ErrorCard
            title="Payment register could not be loaded"
            message={error}
            onRetry={loadBills}
          />
        ) : (
          <>
            <section className="target-register-card">
              <div className="target-table-scroll">
                <table className="target-payment-table">
                  <thead>
                    <tr>
                      <th rowSpan="2">
                        खाते
                        <small>
                          Account
                        </small>
                      </th>

                      <th rowSpan="2">
                        नाव
                        <small>Name</small>
                      </th>

                      <th colSpan="2">
                        म्हैस
                        <small>
                          Buffalo
                        </small>
                      </th>

                      <th colSpan="2">
                        गाय
                        <small>Cow</small>
                      </th>

                      <th rowSpan="2">
                        बिल
                        <small>
                          Milk Amount
                        </small>
                      </th>

                      <th rowSpan="2">
                        ठेव
                        <small>
                          Reserve
                        </small>
                      </th>

                      <th rowSpan="2">
                        खाद्य
                        <small>Feed</small>
                      </th>

                      <th rowSpan="2">
                        एडव्हान्स
                        <small>
                          Advance
                        </small>
                      </th>

                      <th rowSpan="2">
                        एकूण कपात
                        <small>
                          Total Deduction
                        </small>
                      </th>

                      <th rowSpan="2">
                        कपातीनंतर
                        <small>
                          Net Payable
                        </small>
                      </th>

                      <th rowSpan="2">
                        भरले
                        <small>Paid</small>
                      </th>

                      <th rowSpan="2">
                        बाकी
                        <small>
                          Balance
                        </small>
                      </th>

                      <th rowSpan="2">
                        अदा
                        <small>Action</small>
                      </th>
                    </tr>

                    <tr>
                      <th>लिटर</th>
                      <th>रक्कम</th>
                      <th>लिटर</th>
                      <th>रक्कम</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bills.length ===
                    0 ? (
                      <tr>
                        <td colSpan="15">
                          No generated bills
                          found for the
                          selected period.
                        </td>
                      </tr>
                    ) : (
                      bills.map(
                        (bill) => (
                          <tr
                            key={
                              bill.billId
                            }
                          >
                            <td>
                              {
                                bill.memberId
                              }
                            </td>

                            <td className="member-name-cell">
                              {
                                bill.memberName
                              }
                            </td>

                            <td>
                              {formatAmount(
                                bill.buffaloMilk
                              )}
                            </td>

                            <td>
                              ₹
                              {formatAmount(
                                bill.buffaloAmount
                              )}
                            </td>

                            <td>
                              {formatAmount(
                                bill.cowMilk
                              )}
                            </td>

                            <td>
                              ₹
                              {formatAmount(
                                bill.cowAmount
                              )}
                            </td>

                            <td>
                              ₹
                              {formatAmount(
                                bill.milkAmount
                              )}
                            </td>

                            <td>
                              ₹
                              {formatAmount(
                                bill.reserveAmount
                              )}
                            </td>

                            <td>
                              ₹
                              {formatAmount(
                                bill.feedDeducted
                              )}
                            </td>

                            <td>
                              ₹
                              {formatAmount(
                                bill.advanceDeducted
                              )}
                            </td>

                            <td>
                              ₹
                              {formatAmount(
                                bill.totalDeduction
                              )}
                            </td>

                            <td>
                              ₹
                              {formatAmount(
                                bill.netPayable
                              )}
                            </td>

                            <td>
                              ₹
                              {formatAmount(
                                bill.paidAmount
                              )}
                            </td>

                            <td>
                              ₹
                              {formatAmount(
                                bill.balanceAmount
                              )}
                            </td>

                            <td>
                              {numberValue(
                                bill.balanceAmount
                              ) > 0 ? (
                                <button
                                  type="button"
                                  className="table-pay-button"
                                  onClick={() =>
                                    openPaymentModal(
                                      bill
                                    )
                                  }
                                >
                                  Pay
                                </button>
                              ) : (
                                <span className="paid-status">
                                  Paid
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>

                  <tfoot>
                    <tr>
                      <th colSpan="2">
                        Total
                      </th>

                      <th>
                        {formatAmount(
                          totals.buffaloMilk
                        )}
                      </th>

                      <th>
                        ₹
                        {formatAmount(
                          totals.buffaloAmount
                        )}
                      </th>

                      <th>
                        {formatAmount(
                          totals.cowMilk
                        )}
                      </th>

                      <th>
                        ₹
                        {formatAmount(
                          totals.cowAmount
                        )}
                      </th>

                      <th>
                        ₹
                        {formatAmount(
                          totals.milkAmount
                        )}
                      </th>

                      <th>
                        ₹
                        {formatAmount(
                          totals.reserveAmount
                        )}
                      </th>

                      <th>
                        ₹
                        {formatAmount(
                          totals.feedDeducted
                        )}
                      </th>

                      <th>
                        ₹
                        {formatAmount(
                          totals.advanceDeducted
                        )}
                      </th>

                      <th>
                        ₹
                        {formatAmount(
                          totals.totalDeduction
                        )}
                      </th>

                      <th>
                        ₹
                        {formatAmount(
                          totals.netPayable
                        )}
                      </th>

                      <th>
                        ₹
                        {formatAmount(
                          totals.paidAmount
                        )}
                      </th>

                      <th>
                        ₹
                        {formatAmount(
                          totals.balanceAmount
                        )}
                      </th>

                      <th />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <section className="target-register-summary">
              <div className="summary-block buffalo-summary">
                <h3>
                  म्हैस माहिती
                  <small>
                    Buffalo Information
                  </small>
                </h3>

                <p>
                  <span>
                    Total Buffalo Litres
                  </span>

                  <strong>
                    {formatAmount(
                      totals.buffaloMilk
                    )}{" "}
                    L
                  </strong>
                </p>

                <p>
                  <span>
                    Total Buffalo Amount
                  </span>

                  <strong>
                    ₹
                    {formatAmount(
                      totals.buffaloAmount
                    )}
                  </strong>
                </p>
              </div>

              <div className="summary-block cow-summary">
                <h3>
                  गाय माहिती
                  <small>
                    Cow Information
                  </small>
                </h3>

                <p>
                  <span>
                    Total Cow Litres
                  </span>

                  <strong>
                    {formatAmount(
                      totals.cowMilk
                    )}{" "}
                    L
                  </strong>
                </p>

                <p>
                  <span>
                    Total Cow Amount
                  </span>

                  <strong>
                    ₹
                    {formatAmount(
                      totals.cowAmount
                    )}
                  </strong>
                </p>
              </div>

              <div className="summary-block milk-summary">
                <h3>
                  एकूण माहिती
                  <small>
                    Combined Information
                  </small>
                </h3>

                <p>
                  <span>Total Litres</span>

                  <strong>
                    {formatAmount(
                      totals.totalMilk
                    )}{" "}
                    L
                  </strong>
                </p>

                <p>
                  <span>
                    Total Milk Amount
                  </span>

                  <strong>
                    ₹
                    {formatAmount(
                      totals.milkAmount
                    )}
                  </strong>
                </p>
              </div>

              <div className="summary-block payment-summary">
                <h3>
                  एकूण संक्षेप
                  <small>
                    Payment Summary
                  </small>
                </h3>

                <p>
                  <span>
                    Total Deduction
                  </span>

                  <strong>
                    ₹
                    {formatAmount(
                      totals.totalDeduction
                    )}
                  </strong>
                </p>

                <p>
                  <span>
                    Total Net Payable
                  </span>

                  <strong>
                    ₹
                    {formatAmount(
                      totals.netPayable
                    )}
                  </strong>
                </p>

                <p>
                  <span>
                    Total Balance
                  </span>

                  <strong>
                    ₹
                    {formatAmount(
                      totals.balanceAmount
                    )}
                  </strong>
                </p>
              </div>
            </section>
          </>
        )}

        {selectedPaymentBill && (
          <div className="target-modal-overlay">
            <div className="target-payment-modal">
              <div className="target-modal-heading">
                <div>
                  <span>
                    Record Payment
                  </span>

                  <h2>
                    {
                      selectedPaymentBill.memberName
                    }
                  </h2>

                  <p>
                    Bill:{" "}
                    {
                      selectedPaymentBill.billNumber
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closePaymentModal
                  }
                >
                  ×
                </button>
              </div>

              <div className="target-payment-balance">
                <span>
                  Pending Balance
                </span>

                <strong>
                  ₹
                  {formatAmount(
                    selectedPaymentBill.balanceAmount
                  )}
                </strong>
              </div>

              <label>
                Payment Amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(event) =>
                  setPaymentAmount(
                    event.target.value
                  )
                }
              />

              <label>
                Payment Method
              </label>

              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value
                  )
                }
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>
                  Bank Transfer
                </option>
                <option>Cheque</option>
                <option>Other</option>
              </select>

              <label>
                Reference Number
              </label>

              <input
                value={
                  paymentReference
                }
                placeholder="Optional"
                onChange={(event) =>
                  setPaymentReference(
                    event.target.value
                  )
                }
              />

              <div className="target-modal-actions">
                <button
                  type="button"
                  onClick={
                    closePaymentModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-action"
                  onClick={
                    handleSavePayment
                  }
                >
                  Save Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default PaymentRegister;
