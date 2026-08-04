import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import MainLayout from "../layouts/MainLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorCard from "../components/ErrorCard";

import {
  getMembers,
} from "../services/memberService";

import {
  getCollections,
} from "../services/collectionService";

import {
  generateBill,
  generateAllBills,
  getBills,
  getBillById,
} from "../services/billService";

import {
  formatAmount,
} from "../utils/amountUtils";

import {
  printSingleBill,
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

function MemberBill() {
  const [members, setMembers] =
    useState([]);

  const [collections, setCollections] =
    useState([]);

  const [
    selectedMemberId,
    setSelectedMemberId,
  ] = useState("");

  const [billMonth, setBillMonth] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 7)
    );

  const [billCycle, setBillCycle] =
    useState("1");

  const [
    generatedBill,
    setGeneratedBill,
  ] = useState(null);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [
    savedBillLoading,
    setSavedBillLoading,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [pageError, setPageError] =
    useState("");

  const [message, setMessage] =
    useState("");

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

  const selectedMember =
    useMemo(
      () =>
        members.find(
          (member) =>
            String(
              member.memberId
            ) ===
            String(
              selectedMemberId
            )
        ),
      [
        members,
        selectedMemberId,
      ]
    );

  const previewCollections =
    useMemo(() => {
      if (
        !selectedMemberId ||
        !billingPeriod.fromDate
      ) {
        return [];
      }

      return collections.filter(
        (collection) =>
          String(
            collection.memberId
          ) ===
            String(
              selectedMemberId
            ) &&
          collection.collectionDate >=
            billingPeriod.fromDate &&
          collection.collectionDate <=
            billingPeriod.toDate
      );
    }, [
      collections,
      selectedMemberId,
      billingPeriod,
    ]);

  const displayedCollections =
    useMemo(
      () =>
        generatedBill?.collections ||
        generatedBill?.items ||
        previewCollections,
      [
        generatedBill,
        previewCollections,
      ]
    );

  const loadInitialData =
    useCallback(
      async () => {
        try {
          setPageLoading(true);
          setPageError("");

          const [
            membersResult,
            collectionsResult,
          ] = await Promise.all([
            getMembers(),
            getCollections(),
          ]);

          if (
            !membersResult.success
          ) {
            throw new Error(
              membersResult.message ||
                "Unable to load members"
            );
          }

          if (
            !collectionsResult.success
          ) {
            throw new Error(
              collectionsResult.message ||
                "Unable to load collections"
            );
          }

          setMembers(
            membersResult.data || []
          );

          setCollections(
            collectionsResult.data ||
              []
          );
        } catch (error) {
          console.error(
            "Member bill loading error:",
            error
          );

          setPageError(
            error.message ||
              "Unable to load billing information"
          );
        } finally {
          setPageLoading(false);
        }
      },
      []
    );

  const loadSavedBill =
    useCallback(
      async () => {
        if (
          !selectedMemberId ||
          !billMonth ||
          !billCycle
        ) {
          setGeneratedBill(null);
          return;
        }

        try {
          setSavedBillLoading(true);
          setMessage("");

          const result =
            await getBills({
              memberId:
                selectedMemberId,

              billMonth,

              billCycle:
                Number(billCycle),
            });

          const savedBill =
            result.data?.[0];

          if (!savedBill) {
            setGeneratedBill(null);
            return;
          }

          const details =
            await getBillById(
              savedBill.billId
            );

          setGeneratedBill(
            details.data
          );
        } catch (error) {
          console.error(
            "Saved bill loading error:",
            error
          );

          setGeneratedBill(null);

          setMessage(
            error.message ||
              "Unable to load saved bill"
          );
        } finally {
          setSavedBillLoading(false);
        }
      },
      [
        selectedMemberId,
        billMonth,
        billCycle,
      ]
    );

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadSavedBill();
  }, [loadSavedBill]);

  async function handleGenerateBill() {
    if (!selectedMemberId) {
      setMessage(
        "Please select a member."
      );

      return;
    }

    if (
      previewCollections.length === 0 &&
      !generatedBill
    ) {
      setMessage(
        "No milk collection was found for this member and billing cycle."
      );

      return;
    }

    const confirmed =
      window.confirm(
        generatedBill
          ? `Regenerate bill for ${selectedMember?.name || selectedMemberId}?`
          : `Generate bill for ${selectedMember?.name || selectedMemberId}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");

      const result =
        await generateBill({
          memberId:
            selectedMemberId,

          billMonth,

          billCycle:
            Number(billCycle),

          reservePercent: 10,

          generatedBy:
            "Admin",
        });

      const details =
        result.data?.billId
          ? await getBillById(
              result.data.billId
            )
          : result;

      setGeneratedBill(
        details.data ||
          result.data
      );

      setMessage(
        result.message ||
          "Bill generated successfully."
      );
    } catch (error) {
      console.error(
        "Generate bill error:",
        error
      );

      setMessage(
        error.message ||
          "Unable to generate bill"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGenerateAllBills() {
    const confirmed =
      window.confirm(
        "Generate or update bills for all active members for this cycle?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");

      const result =
        await generateAllBills({
          billMonth,

          billCycle:
            Number(billCycle),

          reservePercent: 10,

          generatedBy:
            "Admin",
        });

      setMessage(
        result.message ||
          "Bills generated successfully."
      );

      await loadSavedBill();
    } catch (error) {
      console.error(
        "Generate all bills error:",
        error
      );

      setMessage(
        error.message ||
          "Unable to generate bills"
      );
    } finally {
      setActionLoading(false);
    }
  }

  function handlePrint() {
    if (!generatedBill) {
      setMessage(
        "Generate or load a saved bill before printing."
      );

      return;
    }

    try {
      printSingleBill(
        generatedBill
      );
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to open print preview"
      );
    }
  }

  function sessionRecords(
    milkType,
    session
  ) {
    return displayedCollections.filter(
      (item) =>
        item.milkType ===
          milkType &&
        item.session ===
          session
    );
  }

  function renderSessionTable(
    title,
    milkType,
    session
  ) {
    const records =
      sessionRecords(
        milkType,
        session
      );

    const totalAmount =
      records.reduce(
        (sum, item) =>
          sum +
          numberValue(
            item.amount
          ),
        0
      );

    const totalLitres =
      records.reduce(
        (sum, item) =>
          sum +
          numberValue(
            item.quantity
          ),
        0
      );

    return (
      <section className="target-session-table">
        <div className="target-session-title">
          <h3>{title}</h3>

          <span>
            {formatAmount(
              totalLitres
            )}{" "}
            L
          </span>
        </div>

        <div className="target-session-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Litres</th>
                <th>FAT</th>
                <th>SNF</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    No collection
                  </td>
                </tr>
              ) : (
                records.map(
                  (item) => (
                    <tr
                      key={
                        item.collectionId ||
                        item.billItemId
                      }
                    >
                      <td>
                        {
                          item.collectionDate
                        }
                      </td>

                      <td>
                        {
                          item.quantity
                        }
                      </td>

                      <td>
                        {item.fat}
                      </td>

                      <td>
                        {item.snf}
                      </td>

                      <td>
                        ₹
                        {formatAmount(
                          item.rate
                        )}
                      </td>

                      <td>
                        ₹
                        {formatAmount(
                          item.amount
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>

            <tfoot>
              <tr>
                <th>Total</th>

                <th>
                  {formatAmount(
                    totalLitres
                  )}
                </th>

                <th colSpan="3" />

                <th>
                  ₹
                  {formatAmount(
                    totalAmount
                  )}
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    );
  }

  const billData =
    generatedBill || {};

  return (
    <MainLayout>
      {pageLoading ? (
        <LoadingSpinner
          message="Loading member bill..."
        />
      ) : pageError ? (
        <ErrorCard
          title="Member bill could not be loaded"
          message={pageError}
          onRetry={loadInitialData}
        />
      ) : (
        <div className="target-member-bill">
          <div className="target-page-header">
            <div>
              <span className="target-page-label">
                10-Day Milk Bill
              </span>

              <h1>Member Bill</h1>

              <p>
                Detailed morning and
                evening milk entries with
                deductions and final
                payable amount.
              </p>
            </div>

            <div className="target-header-actions">
              <button
                type="button"
                onClick={
                  handleGenerateAllBills
                }
                disabled={actionLoading}
              >
                Generate All
              </button>

              <button
                type="button"
                className="primary-action"
                onClick={handlePrint}
                disabled={!generatedBill}
              >
                Print Bill
              </button>
            </div>
          </div>

          {message && (
            <div className="target-message">
              {message}
            </div>
          )}

          <section className="target-filter-card member-bill-filter-card">
            <div>
              <label>Member</label>

              <select
                value={
                  selectedMemberId
                }
                onChange={(event) => {
                  setSelectedMemberId(
                    event.target.value
                  );

                  setMessage("");
                }}
              >
                <option value="">
                  Select member
                </option>

                {members.map(
                  (member) => (
                    <option
                      key={
                        member.memberId
                      }
                      value={
                        member.memberId
                      }
                    >
                      {member.memberId}
                      {" - "}
                      {member.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label>Month</label>

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
              <label>Cycle</label>

              <select
                value={billCycle}
                onChange={(event) =>
                  setBillCycle(
                    event.target.value
                  )
                }
              >
                <option value="1">
                  1–10
                </option>

                <option value="2">
                  11–20
                </option>

                <option value="3">
                  21–Month End
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
          </section>

          {savedBillLoading ? (
            <LoadingSpinner
              message="Loading saved bill..."
            />
          ) : !selectedMemberId ? (
            <div className="target-empty-state">
              Select a member to view
              collection entries and
              generated bill.
            </div>
          ) : (
            <>
              <section className="target-member-banner">
                <div>
                  <span>Account</span>

                  <strong>
                    {selectedMemberId}
                  </strong>
                </div>

                <div>
                  <span>Name</span>

                  <strong>
                    {
                      selectedMember?.name
                    }
                  </strong>
                </div>

                <div>
                  <span>Village</span>

                  <strong>
                    {selectedMember?.village ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>Status</span>

                  <strong>
                    {generatedBill
                      ? generatedBill.status
                      : "Not Generated"}
                  </strong>
                </div>
              </section>

              <section className="target-milk-groups">
                <div className="target-milk-group">
                  <div className="target-milk-group-title">
                    <h2>
                      म्हैस
                      <small>
                        Buffalo
                      </small>
                    </h2>
                  </div>

                  <div className="target-two-session-grid">
                    {renderSessionTable(
                      "Morning",
                      "Buffalo",
                      "Morning"
                    )}

                    {renderSessionTable(
                      "Evening",
                      "Buffalo",
                      "Evening"
                    )}
                  </div>
                </div>

                <div className="target-milk-group">
                  <div className="target-milk-group-title">
                    <h2>
                      गाय
                      <small>Cow</small>
                    </h2>
                  </div>

                  <div className="target-two-session-grid">
                    {renderSessionTable(
                      "Morning",
                      "Cow",
                      "Morning"
                    )}

                    {renderSessionTable(
                      "Evening",
                      "Cow",
                      "Evening"
                    )}
                  </div>
                </div>
              </section>

              {generatedBill && (
                <section className="target-bill-bottom-grid">
                  <div className="target-info-panel reserve-panel">
                    <h3>
                      ठेव माहिती
                      <small>
                        Reserve Information
                      </small>
                    </h3>

                    <p>
                      <span>
                        Milk Amount
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          billData.milkAmount
                        )}
                      </strong>
                    </p>

                    <p className="deduction-value">
                      <span>
                        Reserve Deduction
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          billData.reserveAmount
                        )}
                      </strong>
                    </p>

                    <p>
                      <span>
                        After Reserve
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          numberValue(
                            billData.milkAmount
                          ) -
                            numberValue(
                              billData.reserveAmount
                            )
                        )}
                      </strong>
                    </p>
                  </div>

                  <div className="target-info-panel advance-panel">
                    <h3>
                      एडव्हान्स माहिती
                      <small>
                        Advance Information
                      </small>
                    </h3>

                    <p>
                      <span>
                        Advance Due
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          billData.advanceDue
                        )}
                      </strong>
                    </p>

                    <p className="deduction-value">
                      <span>
                        Advance Deducted
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          billData.advanceDeducted
                        )}
                      </strong>
                    </p>

                    <p>
                      <span>
                        Remaining Advance
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          Math.max(
                            numberValue(
                              billData.advanceDue
                            ) -
                              numberValue(
                                billData.advanceDeducted
                              ),
                            0
                          )
                        )}
                      </strong>
                    </p>
                  </div>

                  <div className="target-info-panel feed-panel">
                    <h3>
                      खाद्य माहिती
                      <small>
                        Feed Information
                      </small>
                    </h3>

                    <p>
                      <span>Feed Due</span>

                      <strong>
                        ₹
                        {formatAmount(
                          billData.feedDue
                        )}
                      </strong>
                    </p>

                    <p className="deduction-value">
                      <span>
                        Feed Deducted
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          billData.feedDeducted
                        )}
                      </strong>
                    </p>

                    <p>
                      <span>
                        Remaining Feed
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          Math.max(
                            numberValue(
                              billData.feedDue
                            ) -
                              numberValue(
                                billData.feedDeducted
                              ),
                            0
                          )
                        )}
                      </strong>
                    </p>
                  </div>

                  <div className="target-info-panel other-panel">
                    <h3>
                      इतर माहिती
                      <small>
                        Other Information
                      </small>
                    </h3>

                    <p>
                      <span>
                        Total Milk
                      </span>

                      <strong>
                        {formatAmount(
                          billData.totalMilk
                        )}{" "}
                        L
                      </strong>
                    </p>

                    <p>
                      <span>
                        Other Deduction
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          billData.otherDeduction
                        )}
                      </strong>
                    </p>

                    <p>
                      <span>
                        Paid Amount
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          billData.paidAmount
                        )}
                      </strong>
                    </p>
                  </div>

                  <div className="target-info-panel final-bill-panel">
                    <h3>
                      बिल माहिती
                      <small>
                        Final Bill
                      </small>
                    </h3>

                    <p>
                      <span>
                        Milk Amount
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          billData.milkAmount
                        )}
                      </strong>
                    </p>

                    <p className="deduction-value">
                      <span>
                        Total Deduction
                      </span>

                      <strong>
                        - ₹
                        {formatAmount(
                          billData.totalDeduction
                        )}
                      </strong>
                    </p>

                    <p>
                      <span>
                        Net Payable
                      </span>

                      <strong className="net-payable-amount">
                        ₹
                        {formatAmount(
                          billData.netPayable
                        )}
                      </strong>
                    </p>

                    <p>
                      <span>Balance</span>

                      <strong>
                        ₹
                        {formatAmount(
                          billData.balanceAmount
                        )}
                      </strong>
                    </p>
                  </div>
                </section>
              )}

              <div className="target-bill-actions">
                <button
                  type="button"
                  className="primary-action"
                  onClick={
                    handleGenerateBill
                  }
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Processing..."
                    : generatedBill
                      ? "Regenerate Bill"
                      : "Generate Bill"}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!generatedBill}
                >
                  Print / Save PDF
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </MainLayout>
  );
}

export default MemberBill;
