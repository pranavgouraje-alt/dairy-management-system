import {
  useEffect,
  useState,
} from "react";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorCard from "../components/ErrorCard";
import MainLayout from "../layouts/MainLayout";

import {
  getMembers,
} from "../services/memberService";

import {
  generateAllBills,
  generateBill,
  previewBill,
} from "../services/billService";

import {
  formatAmount,
} from "../utils/amountUtils";

function MemberBill() {
  const [members, setMembers] =
    useState([]);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [pageError, setPageError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

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

  const [reservePercent, setReservePercent] =
    useState("10");

  const [feedDue, setFeedDue] =
    useState("0");

  const [advanceDue, setAdvanceDue] =
    useState("0");

  const [otherDeduction, setOtherDeduction] =
    useState("0");

  const [billPreview, setBillPreview] =
    useState(null);

  const [generatedBill, setGeneratedBill] =
    useState(null);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setPageLoading(true);
      setPageError("");

      const result =
        await getMembers();

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to load members"
        );
      }

      setMembers(
        result.data || []
      );
    } catch (error) {
      console.error(
        "Member Bill loading error:",
        error
      );

      setPageError(
        error.message ||
          "Unable to load billing data"
      );
    } finally {
      setPageLoading(false);
    }
  }

  function resetResult() {
    setBillPreview(null);
    setGeneratedBill(null);
    setMessage("");
  }

  function createRequestData() {
    return {
      memberId:
        selectedMemberId,

      billMonth,

      billCycle:
        Number(billCycle),

      reservePercent:
        Number(
          reservePercent || 0
        ),

      feedDue:
        Number(feedDue || 0),

      advanceDue:
        Number(
          advanceDue || 0
        ),

      otherDeduction:
        Number(
          otherDeduction || 0
        ),

      generatedBy: "Admin",
    };
  }

  function validateForm() {
    if (!selectedMemberId) {
      setMessage(
        "Please select a member"
      );

      return false;
    }

    if (!billMonth) {
      setMessage(
        "Please select billing month"
      );

      return false;
    }

    const numericValues = [
      Number(reservePercent),
      Number(feedDue),
      Number(advanceDue),
      Number(otherDeduction),
    ];

    if (
      numericValues.some(
        (value) =>
          !Number.isFinite(value) ||
          value < 0
      )
    ) {
      setMessage(
        "Deduction values cannot be negative"
      );

      return false;
    }

    if (
      Number(reservePercent) > 100
    ) {
      setMessage(
        "Reserve percentage cannot exceed 100"
      );

      return false;
    }

    return true;
  }

  async function handlePreview() {
    if (!validateForm()) {
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");
      setGeneratedBill(null);

      const result =
        await previewBill(
          createRequestData()
        );

      setBillPreview(
        result.data
      );

      setMessage(
        result.data.existing
          ? "Existing bill loaded as a fresh preview. Saving will update it."
          : "Bill preview calculated successfully."
      );
    } catch (error) {
      console.error(
        "Bill preview error:",
        error
      );

      setBillPreview(null);

      setMessage(
        error.message ||
          "Unable to calculate bill preview"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGenerateBill() {
    if (!validateForm()) {
      return;
    }

    if (!billPreview) {
      setMessage(
        "Calculate the preview before saving the bill"
      );

      return;
    }

    const confirmed =
      window.confirm(
        billPreview.existing
          ? "Update this existing bill using the displayed calculation?"
          : "Generate and save this bill?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");

      const result =
        await generateBill(
          createRequestData()
        );

      setGeneratedBill(
        result.data
      );

      setBillPreview(
        result.data
      );

      setMessage(
        result.message
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
        "Generate or update bills for all active members? Feed and advance deductions are kept at zero for bulk generation."
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
          reservePercent:
            Number(
              reservePercent || 0
            ),
          otherDeduction:
            Number(
              otherDeduction || 0
            ),
          generatedBy: "Admin",
        });

      setMessage(
        `${result.data.generatedCount} generated, ${result.data.skippedCount} skipped and ${result.data.failedCount} failed.`
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
    collections
  ) {
    return (
      <div className="bill-table-scroll">
        <table className="bill-items-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Session</th>
              <th>Type</th>
              <th>Litres</th>
              <th>FAT</th>
              <th>SNF</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {collections.map(
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
                      collection.collectionTime
                    }
                  </td>

                  <td>
                    {
                      collection.session
                    }
                  </td>

                  <td>
                    {
                      collection.milkType
                    }
                  </td>

                  <td>
                    {
                      collection.quantity
                    }
                  </td>

                  <td>
                    {collection.fat}
                  </td>

                  <td>
                    {collection.snf}
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
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <MainLayout>
      {pageLoading ? (
        <LoadingSpinner
          message="Loading billing information..."
        />
      ) : pageError ? (
        <ErrorCard
          title="Billing data could not be loaded"
          message={pageError}
          onRetry={loadInitialData}
        />
      ) : (
        <div className="member-bill-page">
          <div className="member-bill-heading">
            <div>
              <span>
                Bill Migration Part 2
              </span>

              <h1>Member Bill</h1>

              <p>
                Preview and save MySQL-backed
                milk bills with feed, advance,
                reserve and other deductions.
              </p>
            </div>

            <button
              type="button"
              className="bill-secondary-button"
              disabled={actionLoading}
              onClick={
                handleGenerateAllBills
              }
            >
              Generate All Bills
            </button>
          </div>

          {message && (
            <div className="bill-page-message">
              {message}
            </div>
          )}

          <section className="bill-control-card">
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

                  resetResult();
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

            <div>
              <label>Bill Month</label>

              <input
                type="month"
                value={billMonth}
                onChange={(event) => {
                  setBillMonth(
                    event.target.value
                  );

                  resetResult();
                }}
              />
            </div>

            <div>
              <label>Bill Cycle</label>

              <select
                value={billCycle}
                onChange={(event) => {
                  setBillCycle(
                    event.target.value
                  );

                  resetResult();
                }}
              >
                <option value="1">
                  Cycle 1: 1–10
                </option>

                <option value="2">
                  Cycle 2: 11–20
                </option>

                <option value="3">
                  Cycle 3: 21–Month End
                </option>
              </select>
            </div>

            <div>
              <label>
                Feed Due (₹)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={feedDue}
                onChange={(event) => {
                  setFeedDue(
                    event.target.value
                  );

                  resetResult();
                }}
              />
            </div>

            <div>
              <label>
                Advance Due (₹)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={advanceDue}
                onChange={(event) => {
                  setAdvanceDue(
                    event.target.value
                  );

                  resetResult();
                }}
              />
            </div>

            <div>
              <label>
                Other Deduction (₹)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  otherDeduction
                }
                onChange={(event) => {
                  setOtherDeduction(
                    event.target.value
                  );

                  resetResult();
                }}
              />
            </div>

            <div>
              <label>
                Reserve (%)
              </label>

              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={
                  reservePercent
                }
                onChange={(event) => {
                  setReservePercent(
                    event.target.value
                  );

                  resetResult();
                }}
              />
            </div>

            <button
              type="button"
              className="bill-primary-button"
              disabled={actionLoading}
              onClick={handlePreview}
            >
              {actionLoading
                ? "Please wait..."
                : "Calculate Preview"}
            </button>
          </section>

          {billPreview && (
            <>
              <section className="bill-preview-document">
                <div className="bill-preview-header">
                  <div>
                    <span>
                      Dairy Management System
                    </span>

                    <h2>
                      Milk Collection Bill
                    </h2>
                  </div>

                  <div>
                    <small>
                      Bill Period
                    </small>

                    <strong>
                      {
                        billPreview.periodFrom
                      }{" "}
                      to{" "}
                      {
                        billPreview.periodTo
                      }
                    </strong>
                  </div>
                </div>

                <div className="bill-member-summary">
                  <div>
                    <span>Member ID</span>
                    <strong>
                      {
                        billPreview.memberId
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Member</span>
                    <strong>
                      {
                        billPreview.memberName
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Village</span>
                    <strong>
                      {billPreview.village ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Collections
                    </span>
                    <strong>
                      {
                        billPreview.collectionCount
                      }
                    </strong>
                  </div>
                </div>

                <div className="bill-total-grid">
                  <div>
                    <span>Cow Milk</span>
                    <strong>
                      {
                        billPreview.cowMilk
                      }{" "}
                      L
                    </strong>
                    <small>
                      ₹
                      {formatAmount(
                        billPreview.cowAmount
                      )}
                    </small>
                  </div>

                  <div>
                    <span>
                      Buffalo Milk
                    </span>
                    <strong>
                      {
                        billPreview.buffaloMilk
                      }{" "}
                      L
                    </strong>
                    <small>
                      ₹
                      {formatAmount(
                        billPreview.buffaloAmount
                      )}
                    </small>
                  </div>

                  <div>
                    <span>Total Milk</span>
                    <strong>
                      {
                        billPreview.totalMilk
                      }{" "}
                      L
                    </strong>
                    <small>
                      Avg FAT{" "}
                      {
                        billPreview.averageFat
                      }{" "}
                      / SNF{" "}
                      {
                        billPreview.averageSnf
                      }
                    </small>
                  </div>

                  <div className="bill-highlight-card">
                    <span>
                      Milk Amount
                    </span>
                    <strong>
                      ₹
                      {formatAmount(
                        billPreview.milkAmount
                      )}
                    </strong>
                  </div>
                </div>

                <div className="bill-calculation-grid">
                  <div>
                    <span>
                      Feed Deducted
                    </span>
                    <strong>
                      - ₹
                      {formatAmount(
                        billPreview.feedDeducted
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Advance Deducted
                    </span>
                    <strong>
                      - ₹
                      {formatAmount(
                        billPreview.advanceDeducted
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Other Deduction
                    </span>
                    <strong>
                      - ₹
                      {formatAmount(
                        billPreview.otherDeduction
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Reserve
                    </span>
                    <strong>
                      - ₹
                      {formatAmount(
                        billPreview.reserveAmount
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
                        billPreview.totalDeduction
                      )}
                    </strong>
                  </div>

                  <div className="bill-net-card">
                    <span>
                      Net Payable
                    </span>
                    <strong>
                      ₹
                      {formatAmount(
                        billPreview.netPayable
                      )}
                    </strong>
                  </div>
                </div>

                <h3>
                  Collection Items
                </h3>

                {renderCollectionTable(
                  billPreview.collections
                )}
              </section>

              <div className="bill-save-actions">
                <button
                  type="button"
                  className="bill-primary-button"
                  disabled={actionLoading}
                  onClick={
                    handleGenerateBill
                  }
                >
                  {generatedBill
                    ? "Update Saved Bill"
                    : billPreview.existing
                      ? "Update Existing Bill"
                      : "Generate and Save Bill"}
                </button>

                <button
                  type="button"
                  className="bill-secondary-button"
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
