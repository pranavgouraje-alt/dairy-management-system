import {
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
} from "../services/billService";

import {
  formatAmount,
} from "../utils/amountUtils";

function MemberBill() {
  const [members, setMembers] =
    useState([]);

  const [collections, setCollections] =
    useState([]);

  const [selectedMemberId, setSelectedMemberId] =
    useState("");

  const [billMonth, setBillMonth] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 7)
    );

  const [billCycle, setBillCycle] =
    useState("1");

  const [generatedBill, setGeneratedBill] =
    useState(null);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [pageError, setPageError] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
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

      if (!membersResult.success) {
        throw new Error(
          membersResult.message ||
            "Unable to load members"
        );
      }

      if (!collectionsResult.success) {
        throw new Error(
          collectionsResult.message ||
            "Unable to load collections"
        );
      }

      setMembers(
        membersResult.data || []
      );

      setCollections(
        collectionsResult.data || []
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
  }

  function getBillingPeriod(
    month,
    cycle
  ) {
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

      const lastDay =
        new Date(
          Number(year),
          Number(monthNumber),
          0
        ).getDate();

      toDay = String(
        lastDay
      ).padStart(2, "0");
    }

    return {
      fromDate:
        `${year}-${monthNumber}-${fromDay}`,

      toDate:
        `${year}-${monthNumber}-${toDay}`,
    };
  }

  const billingPeriod =
    useMemo(() => {
      return getBillingPeriod(
        billMonth,
        billCycle
      );
    }, [
      billMonth,
      billCycle,
    ]);

  const selectedMember =
    useMemo(() => {
      return members.find(
        (member) =>
          String(member.memberId) ===
          String(selectedMemberId)
      );
    }, [
      members,
      selectedMemberId,
    ]);

  const previewCollections =
    useMemo(() => {
      if (!selectedMemberId) {
        return [];
      }

      return collections.filter(
        (collection) => {
          return (
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
        }
      );
    }, [
      collections,
      selectedMemberId,
      billingPeriod,
    ]);

  const collectionSummary =
    useMemo(() => {
      const summary = {
        cowMilk: 0,
        buffaloMilk: 0,
        totalMilk: 0,

        cowAmount: 0,
        buffaloAmount: 0,
        totalAmount: 0,

        averageFat: 0,
        averageSnf: 0,
      };

      let weightedFat = 0;
      let weightedSnf = 0;

      previewCollections.forEach(
        (collection) => {
          const quantity =
            Number(
              collection.quantity || 0
            );

          const amount =
            Number(
              collection.amount || 0
            );

          const fat =
            Number(
              collection.fat || 0
            );

          const snf =
            Number(
              collection.snf || 0
            );

          if (
            collection.milkType ===
            "Cow"
          ) {
            summary.cowMilk +=
              quantity;

            summary.cowAmount +=
              amount;
          } else {
            summary.buffaloMilk +=
              quantity;

            summary.buffaloAmount +=
              amount;
          }

          summary.totalMilk +=
            quantity;

          summary.totalAmount +=
            amount;

          weightedFat +=
            fat * quantity;

          weightedSnf +=
            snf * quantity;
        }
      );

      if (
        summary.totalMilk > 0
      ) {
        summary.averageFat =
          weightedFat /
          summary.totalMilk;

        summary.averageSnf =
          weightedSnf /
          summary.totalMilk;
      }

      return {
        cowMilk:
          Number(
            summary.cowMilk.toFixed(2)
          ),

        buffaloMilk:
          Number(
            summary.buffaloMilk.toFixed(
              2
            )
          ),

        totalMilk:
          Number(
            summary.totalMilk.toFixed(
              2
            )
          ),

        cowAmount:
          Number(
            summary.cowAmount.toFixed(
              2
            )
          ),

        buffaloAmount:
          Number(
            summary.buffaloAmount.toFixed(
              2
            )
          ),

        totalAmount:
          Number(
            summary.totalAmount.toFixed(
              2
            )
          ),

        averageFat:
          Number(
            summary.averageFat.toFixed(
              2
            )
          ),

        averageSnf:
          Number(
            summary.averageSnf.toFixed(
              2
            )
          ),
      };
    }, [previewCollections]);

  function handleFilterChange() {
    setGeneratedBill(null);
    setMessage("");
  }

  async function handleGenerateBill() {
    if (!selectedMemberId) {
      setMessage(
        "Please select a member."
      );

      return;
    }

    if (
      previewCollections.length === 0
    ) {
      setMessage(
        "No milk collection was found for this member and billing cycle."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Generate bill for ${selectedMember?.name || selectedMemberId}?`
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

          generatedBy:
            "Admin",
        });

      if (!result.success) {
        throw new Error(
          result.message ||
            "Bill generation failed"
        );
      }

      setGeneratedBill(
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
        "Generate bills for all active members for this billing cycle?"
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

          generatedBy:
            "Admin",
        });

      setMessage(
        result.message ||
          "Bills generated successfully."
      );
    } catch (error) {
      console.error(
        "Generate all bills error:",
        error
      );

      setMessage(
        error.message ||
          "Unable to generate all bills"
      );
    } finally {
      setActionLoading(false);
    }
  }

  function renderCollectionTable(
    title,
    milkType,
    session
  ) {
    const records =
      previewCollections.filter(
        (collection) =>
          collection.milkType ===
            milkType &&
          collection.session ===
            session
      );

    return (
      <div className="bill-session-card">
        <div className="bill-session-header">
          <div>
            <span>
              {milkType === "Cow"
                ? "🐄"
                : "🐃"}
            </span>

            <div>
              <h3>{title}</h3>

              <p>
                {records.length} entries
              </p>
            </div>
          </div>

          <strong>
            {records
              .reduce(
                (
                  total,
                  collection
                ) =>
                  total +
                  Number(
                    collection.quantity ||
                      0
                  ),
                0
              )
              .toFixed(2)}{" "}
            L
          </strong>
        </div>

        <div className="bill-table-wrapper">
          <table className="bill-preview-table">
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
                  (collection) => (
                    <tr
                      key={
                        collection.collectionId
                      }
                    >
                      <td>
                        {
                          collection.collectionDate
                        }
                      </td>

                      <td>
                        {
                          collection.quantity
                        }
                      </td>

                      <td>
                        {
                          collection.fat
                        }
                      </td>

                      <td>
                        {
                          collection.snf
                        }
                      </td>

                      <td>
                        ₹
                        {formatAmount(
                          collection.rate
                        )}
                      </td>

                      <td>
                        ₹
                        {formatAmount(
                          collection.amount
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      {pageLoading ? (
        <LoadingSpinner
          message="Loading member billing..."
        />
      ) : pageError ? (
        <ErrorCard
          title="Member bill could not be loaded"
          message={pageError}
          onRetry={loadInitialData}
        />
      ) : (
        <div className="member-bill-page">
          <div className="member-bill-topbar">
            <div>
              <span className="page-eyebrow">
                Milk Payment
              </span>

              <h1>Member Bill</h1>

              <p>
                View milk collection and
                generate the selected
                member&apos;s 10-day bill.
              </p>
            </div>

            <button
              type="button"
              className="generate-all-bills-button"
              disabled={actionLoading}
              onClick={
                handleGenerateAllBills
              }
            >
              Generate All Bills
            </button>
          </div>

          {message && (
            <div className="member-bill-message">
              {message}
            </div>
          )}

          <section className="bill-filter-panel">
            <div className="bill-filter-field member-field">
              <label>Member</label>

              <select
                value={
                  selectedMemberId
                }
                onChange={(event) => {
                  setSelectedMemberId(
                    event.target.value
                  );

                  handleFilterChange();
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
                      {member.memberId} -{" "}
                      {member.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="bill-filter-field">
              <label>Bill Month</label>

              <input
                type="month"
                value={billMonth}
                onChange={(event) => {
                  setBillMonth(
                    event.target.value
                  );

                  handleFilterChange();
                }}
              />
            </div>

            <div className="bill-filter-field">
              <label>Bill Cycle</label>

              <select
                value={billCycle}
                onChange={(event) => {
                  setBillCycle(
                    event.target.value
                  );

                  handleFilterChange();
                }}
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

            <div className="bill-period-display">
              <span>Selected Period</span>

              <strong>
                {
                  billingPeriod.fromDate
                }{" "}
                to{" "}
                {billingPeriod.toDate}
              </strong>
            </div>
          </section>

          {!selectedMemberId ? (
            <section className="bill-empty-state">
              <div>🧾</div>

              <h2>
                Select a member
              </h2>

              <p>
                Choose a member, month and
                billing cycle to view the
                milk collection preview.
              </p>
            </section>
          ) : previewCollections.length ===
            0 ? (
            <section className="bill-empty-state">
              <div>🥛</div>

              <h2>
                No collection found
              </h2>

              <p>
                There are no milk entries
                for this member in the
                selected billing period.
              </p>
            </section>
          ) : (
            <>
              <section className="bill-member-profile">
                <div className="bill-member-avatar">
                  {selectedMember?.name
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <span>
                    Member details
                  </span>

                  <h2>
                    {selectedMember?.name}
                  </h2>

                  <p>
                    Member ID:{" "}
                    {
                      selectedMember?.memberId
                    }
                    {selectedMember?.village
                      ? ` · ${selectedMember.village}`
                      : ""}
                  </p>
                </div>
              </section>

              <section className="bill-summary-cards">
                <div>
                  <span>
                    🐄 Cow Milk
                  </span>

                  <strong>
                    {
                      collectionSummary.cowMilk
                    }{" "}
                    L
                  </strong>

                  <small>
                    ₹
                    {formatAmount(
                      collectionSummary.cowAmount
                    )}
                  </small>
                </div>

                <div>
                  <span>
                    🐃 Buffalo Milk
                  </span>

                  <strong>
                    {
                      collectionSummary.buffaloMilk
                    }{" "}
                    L
                  </strong>

                  <small>
                    ₹
                    {formatAmount(
                      collectionSummary.buffaloAmount
                    )}
                  </small>
                </div>

                <div>
                  <span>
                    🥛 Total Milk
                  </span>

                  <strong>
                    {
                      collectionSummary.totalMilk
                    }{" "}
                    L
                  </strong>

                  <small>
                    {
                      previewCollections.length
                    }{" "}
                    collection entries
                  </small>
                </div>

                <div className="bill-total-amount-card">
                  <span>
                    Milk Amount
                  </span>

                  <strong>
                    ₹
                    {formatAmount(
                      collectionSummary.totalAmount
                    )}
                  </strong>

                  <small>
                    FAT{" "}
                    {
                      collectionSummary.averageFat
                    }{" "}
                    · SNF{" "}
                    {
                      collectionSummary.averageSnf
                    }
                  </small>
                </div>
              </section>

              <section className="bill-session-grid">
                {renderCollectionTable(
                  "Cow Morning",
                  "Cow",
                  "Morning"
                )}

                {renderCollectionTable(
                  "Cow Evening",
                  "Cow",
                  "Evening"
                )}

                {renderCollectionTable(
                  "Buffalo Morning",
                  "Buffalo",
                  "Morning"
                )}

                {renderCollectionTable(
                  "Buffalo Evening",
                  "Buffalo",
                  "Evening"
                )}
              </section>

              {generatedBill && (
                <section className="generated-bill-summary">
                  <div className="generated-bill-heading">
                    <div>
                      <span>
                        Generated Bill
                      </span>

                      <h2>
                        {
                          generatedBill.billNumber
                        }
                      </h2>
                    </div>

                    <span className="bill-status-badge">
                      {
                        generatedBill.status
                      }
                    </span>
                  </div>

                  <div className="generated-calculation-grid">
                    <div>
                      <span>
                        Milk Amount
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          generatedBill.milkAmount
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Feed Deduction
                      </span>

                      <strong>
                        - ₹
                        {formatAmount(
                          generatedBill.feedDeducted
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Advance Deduction
                      </span>

                      <strong>
                        - ₹
                        {formatAmount(
                          generatedBill.advanceDeducted
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Reserve Amount
                      </span>

                      <strong>
                        - ₹
                        {formatAmount(
                          generatedBill.reserveAmount
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Total Deduction
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          generatedBill.totalDeduction
                        )}
                      </strong>
                    </div>

                    <div className="net-payable-result">
                      <span>
                        Net Payable
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          generatedBill.netPayable
                        )}
                      </strong>
                    </div>
                  </div>
                </section>
              )}

              <div className="member-bill-actions">
                <button
                  type="button"
                  className="generate-member-bill-button"
                  disabled={actionLoading}
                  onClick={
                    handleGenerateBill
                  }
                >
                  {actionLoading
                    ? "Generating Bill..."
                    : generatedBill
                      ? "Regenerate Bill"
                      : "Generate Member Bill"}
                </button>

                <button
                  type="button"
                  className="print-member-bill-button"
                  onClick={() =>
                    window.print()
                  }
                >
                  Print Preview
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