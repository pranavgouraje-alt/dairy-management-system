import {
  useEffect,
  useMemo,
  useState,
} from "react";

import MainLayout from "../layouts/MainLayout";
import { formatAmount } from "../utils/amountUtils";

import { getMembers } from "../services/memberService";

import { getCollections } from "../services/collectionService";

import {
  generateBill,
  generateAllBills,
} from "../services/billService";

function MemberBill() {
  const [members, setMembers] = useState([]);
  const [collections, setCollections] = useState([]);

  const [selectedMemberId, setSelectedMemberId] =
    useState("");

  const [billMonth, setBillMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [billCycle, setBillCycle] =
    useState("1");

  const [generatedBill, setGeneratedBill] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  /*
    Loads members from the backend.

    This function is placed before useEffect so
    ESLint/React Compiler does not report:

    Cannot access variable before it is declared.
  */
  async function loadMembers() {
    try {
      const result = await getMembers();

      if (result.success) {
        setMembers(result.data || []);
      } else {
        alert(
          result.message ||
            "Unable to load members"
        );
      }
    } catch (error) {
      console.error(
        "Member loading error:",
        error
      );

      alert(
        error.message ||
          "Unable to load members from backend"
      );
    }
  }

  /*
    Loads collections from the backend.
  */
  async function loadCollections() {
    try {
      const result =
        await getCollections();

      if (result.success) {
        setCollections(result.data || []);
      } else {
        alert(
          result.message ||
            "Unable to load collections"
        );
      }
    } catch (error) {
      console.error(
        "Collection loading error:",
        error
      );

      alert(
        error.message ||
          "Unable to load collections from backend"
      );
    }
  }

  /*
    Runs once when the Member Bill page opens.
  */
  useEffect(() => {
    loadMembers();
    loadCollections();
  }, []);

  function getBillingDates(
    month,
    cycle
  ) {
    const [year, monthNumber] =
      month.split("-");

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

      toDay = String(lastDay).padStart(
        2,
        "0"
      );
    }

    return {
      fromDate:
        `${year}-${monthNumber}-${fromDay}`,

      toDate:
        `${year}-${monthNumber}-${toDay}`,
    };
  }

  const { fromDate, toDate } =
    getBillingDates(
      billMonth,
      billCycle
    );

  const selectedMember =
    members.find(
      (member) =>
        String(member.memberId) ===
        String(selectedMemberId)
    );

  /*
    Filters only the selected member's collections
    from the selected billing period.
  */
  const previewCollections =
    useMemo(() => {
      return collections.filter(
        (collection) =>
          String(collection.memberId) ===
            String(selectedMemberId) &&
          collection.collectionDate >=
            fromDate &&
          collection.collectionDate <=
            toDate
      );
    }, [
      collections,
      selectedMemberId,
      fromDate,
      toDate,
    ]);

  const cowMorningCollections =
    previewCollections.filter(
      (collection) =>
        collection.milkType === "Cow" &&
        collection.session === "Morning"
    );

  const cowEveningCollections =
    previewCollections.filter(
      (collection) =>
        collection.milkType === "Cow" &&
        collection.session === "Evening"
    );

  const buffaloMorningCollections =
    previewCollections.filter(
      (collection) =>
        collection.milkType ===
          "Buffalo" &&
        collection.session === "Morning"
    );

  const buffaloEveningCollections =
    previewCollections.filter(
      (collection) =>
        collection.milkType ===
          "Buffalo" &&
        collection.session === "Evening"
    );

  function getMilkTotal(
    data,
    milkType
  ) {
    return data
      .filter(
        (collection) =>
          collection.milkType === milkType
      )
      .reduce(
        (total, collection) =>
          total +
          Number(collection.quantity || 0),
        0
      );
  }

  function getAmountTotal(
    data,
    milkType
  ) {
    return data
      .filter(
        (collection) =>
          collection.milkType === milkType
      )
      .reduce(
        (total, collection) =>
          total +
          Number(collection.amount || 0),
        0
      );
  }

  const cowMilk = getMilkTotal(
    previewCollections,
    "Cow"
  );

  const buffaloMilk = getMilkTotal(
    previewCollections,
    "Buffalo"
  );

  const cowAmount = getAmountTotal(
    previewCollections,
    "Cow"
  );

  const buffaloAmount = getAmountTotal(
    previewCollections,
    "Buffalo"
  );

  const totalMilk = Number(
    (cowMilk + buffaloMilk).toFixed(2)
  );

  const totalAmount = Number(
    (cowAmount + buffaloAmount).toFixed(2)
  );

  async function handleGenerateBill() {
    if (!selectedMemberId) {
      alert("Please select a member");
      return;
    }

    if (
      previewCollections.length === 0
    ) {
      alert(
        "No milk collection found for this member and billing period"
      );
      return;
    }

    try {
      setLoading(true);

      const result = await generateBill({
        memberId: selectedMemberId,
        billMonth,
        billCycle,
      });

      if (!result.success) {
        alert(
          result.message ||
            "Bill generation failed"
        );
        return;
      }

      setGeneratedBill(result.data);

      alert(result.message);
    } catch (error) {
      console.error(
        "Generate bill error:",
        error
      );

      alert(
        error.message ||
          "Unable to generate bill"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAllBills() {
    const confirmGeneration =
      window.confirm(
        "Generate or update all bills for this billing cycle?"
      );

    if (!confirmGeneration) {
      return;
    }

    try {
      setLoading(true);

      const result =
        await generateAllBills({
          billMonth,
          billCycle,
        });

      if (!result.success) {
        alert(
          result.message ||
            "All bill generation failed"
        );
        return;
      }

      alert(result.message);
    } catch (error) {
      console.error(
        "Generate all bills error:",
        error
      );

      alert(
        error.message ||
          "Unable to generate all bills"
      );
    } finally {
      setLoading(false);
    }
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
              <td colSpan="6">
                No Data
              </td>
            </tr>
          ) : (
            data.map((collection) => (
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
                  {collection.quantity}
                </td>

                <td>{collection.fat}</td>

                <td>{collection.snf}</td>

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
          onChange={(event) => {
            setSelectedMemberId(
              event.target.value
            );

            setGeneratedBill(null);
          }}
        >
          <option value="">
            Select Member
          </option>

          {members.map((member) => (
            <option
              key={member.memberId}
              value={member.memberId}
            >
              {member.memberId} -{" "}
              {member.name}
            </option>
          ))}
        </select>

        <input
          type="month"
          value={billMonth}
          onChange={(event) => {
            setBillMonth(
              event.target.value
            );

            setGeneratedBill(null);
          }}
        />

        <select
          value={billCycle}
          onChange={(event) => {
            setBillCycle(
              event.target.value
            );

            setGeneratedBill(null);
          }}
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
        <strong>
          Billing Period:
        </strong>{" "}
        {fromDate} to {toDate}
      </p>

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <button
          type="button"
          className="generate-bill-btn"
          onClick={
            handleGenerateAllBills
          }
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : "Generate / Update All Bills"}
        </button>
      </div>

      {selectedMemberId && (
        <div className="bill-box">
          <div className="bill-header">
            <h2>Milk Bill Preview</h2>

            <p>
              <strong>Member:</strong>{" "}
              {
                selectedMember?.memberId
              }{" "}
              - {selectedMember?.name}
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
                  <h3>Morning</h3>

                  {renderTable(
                    cowMorningCollections
                  )}
                </div>

                <div className="bill-session-box">
                  <h3>Evening</h3>

                  {renderTable(
                    cowEveningCollections
                  )}
                </div>
              </div>

              <div className="animal-total">
                <p>
                  <strong>
                    Cow Milk:
                  </strong>{" "}
                  {formatAmount(cowMilk)} L
                </p>

                <p>
                  <strong>
                    Cow Amount:
                  </strong>{" "}
                  ₹
                  {formatAmount(
                    cowAmount
                  )}
                </p>
              </div>
            </div>

            <div className="bill-animal-section">
              <h2>🐃 Buffalo Milk</h2>

              <div className="bill-session-container">
                <div className="bill-session-box">
                  <h3>Morning</h3>

                  {renderTable(
                    buffaloMorningCollections
                  )}
                </div>

                <div className="bill-session-box">
                  <h3>Evening</h3>

                  {renderTable(
                    buffaloEveningCollections
                  )}
                </div>
              </div>

              <div className="animal-total">
                <p>
                  <strong>
                    Buffalo Milk:
                  </strong>{" "}
                  {formatAmount(
                    buffaloMilk
                  )}{" "}
                  L
                </p>

                <p>
                  <strong>
                    Buffalo Amount:
                  </strong>{" "}
                  ₹
                  {formatAmount(
                    buffaloAmount
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bill-final-summary">
            <h2>Preview Summary</h2>

            <table className="bill-summary-table">
              <tbody>
                <tr>
                  <td>Total Milk</td>

                  <td>
                    {formatAmount(
                      totalMilk
                    )}{" "}
                    L
                  </td>
                </tr>

                <tr>
                  <td>Milk Amount</td>

                  <td>
                    ₹
                    {formatAmount(
                      totalAmount
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            <button
              type="button"
              className="generate-bill-btn"
              onClick={
                handleGenerateBill
              }
              disabled={loading}
            >
              {loading
                ? "Generating..."
                : "Generate / Update This Bill"}
            </button>
          </div>
        </div>
      )}

      {generatedBill && (
        <div className="bill-final-summary">
          <h2>
            Generated Bill Summary
          </h2>

          <table className="bill-summary-table">
            <tbody>
              <tr>
                <td>Member</td>

                <td>
                  {
                    generatedBill.memberId
                  }{" "}
                  -{" "}
                  {
                    generatedBill.memberName
                  }
                </td>
              </tr>

              <tr>
                <td>Total Milk</td>

                <td>
                  {formatAmount(
                    generatedBill.totalMilk
                  )}{" "}
                  L
                </td>
              </tr>

              <tr>
                <td>Milk Amount</td>

                <td>
                  ₹
                  {formatAmount(
                    generatedBill.milkAmount
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  Reserve Amount 10%
                </td>

                <td>
                  ₹
                  {formatAmount(
                    generatedBill.reserveAmount
                  )}
                </td>
              </tr>

              <tr>
                <td>Feed Due</td>

                <td>
                  ₹
                  {formatAmount(
                    generatedBill.feedDue
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  Feed Deducted
                </td>

                <td>
                  ₹
                  {formatAmount(
                    generatedBill.feedDeducted
                  )}
                </td>
              </tr>

              <tr>
                <td>Advance Due</td>

                <td>
                  ₹
                  {formatAmount(
                    generatedBill.advanceDue
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  Advance Deducted
                </td>

                <td>
                  ₹
                  {formatAmount(
                    generatedBill.advanceDeducted
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  Total Deduction
                </td>

                <td>
                  ₹
                  {formatAmount(
                    generatedBill.totalDeduction
                  )}
                </td>
              </tr>

              <tr>
                <td>Remaining Due</td>

                <td>
                  ₹
                  {formatAmount(
                    generatedBill.remainingDue
                  )}
                </td>
              </tr>

              <tr className="net-payable-row">
                <td>Net Payable</td>

                <td>
                  ₹
                  {formatAmount(
                    generatedBill.netPayable
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </MainLayout>
  );
}

export default MemberBill;