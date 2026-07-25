import {
  useEffect,
  useMemo,
  useState,
} from "react";

import MainLayout from "../layouts/MainLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorCard from "../components/ErrorCard";

import {
  getRates,
  addRate,
  updateRate as updateRateApi,
  deleteRate as deleteRateApi,
  getRateHistory,
} from "../services/rateService";

import {
  formatAmount,
} from "../utils/amountUtils";

/*
  Returns the current month in:

  YYYY-MM
*/
function getCurrentMonth() {
  return new Date()
    .toISOString()
    .slice(0, 7);
}

/*
  Creates the start and end date
  for one 10-day billing cycle.
*/
function getCycleDates(
  month,
  cycle
) {
  const [
    year,
    monthNumber,
  ] = month
    .split("-")
    .map(Number);

  if (!year || !monthNumber) {
    return {
      fromDate: "",
      toDate: "",
    };
  }

  const lastDay = new Date(
    year,
    monthNumber,
    0
  ).getDate();

  if (cycle === "1") {
    return {
      fromDate: `${month}-01`,
      toDate: `${month}-10`,
    };
  }

  if (cycle === "2") {
    return {
      fromDate: `${month}-11`,
      toDate: `${month}-20`,
    };
  }

  return {
    fromDate: `${month}-21`,

    toDate:
      `${month}-${String(
        lastDay
      ).padStart(2, "0")}`,
  };
}

/*
  Normalizes dates received from MySQL.
*/
function formatDate(value) {
  if (!value) {
    return "-";
  }

  return String(value)
    .split("T")[0];
}

/*
  Converts action names into
  lowercase CSS-safe class names.
*/
function getHistoryActionClass(
  action
) {
  return String(action || "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function RateMaster() {
  const emptyForm = {
    milkType: "Cow",
    fat: "",
    snf: "8.5",
    rate: "",
    status: "Active",
  };

  const [
    rateForm,
    setRateForm,
  ] = useState(emptyForm);

  const [rates, setRates] =
    useState([]);

  const [history, setHistory] =
    useState([]);

  const [editId, setEditId] =
    useState(null);

  const [
    historyMonth,
    setHistoryMonth,
  ] = useState(
    getCurrentMonth()
  );

  const [
    historyCycle,
    setHistoryCycle,
  ] = useState("1");

  const [
    historyMilkType,
    setHistoryMilkType,
  ] = useState("All");

  const [
    activeRateTab,
    setActiveRateTab,
  ] = useState("All");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const {
    fromDate,
    toDate,
  } = useMemo(
    () =>
      getCycleDates(
        historyMonth,
        historyCycle
      ),
    [
      historyMonth,
      historyCycle,
    ]
  );

  /*
    Separate Cow and Buffalo rates.
  */
  const cowRates = useMemo(
    () =>
      rates
        .filter(
          (rate) =>
            rate.milkType ===
            "Cow"
        )
        .sort(
          (first, second) =>
            Number(first.fat) -
              Number(second.fat) ||
            Number(first.snf) -
              Number(second.snf)
        ),
    [rates]
  );

  const buffaloRates = useMemo(
    () =>
      rates
        .filter(
          (rate) =>
            rate.milkType ===
            "Buffalo"
        )
        .sort(
          (first, second) =>
            Number(first.fat) -
              Number(second.fat) ||
            Number(first.snf) -
              Number(second.snf)
        ),
    [rates]
  );

  const displayedRates =
    useMemo(() => {
      if (
        activeRateTab === "Cow"
      ) {
        return cowRates;
      }

      if (
        activeRateTab ===
        "Buffalo"
      ) {
        return buffaloRates;
      }

      return rates;
    }, [
      activeRateTab,
      cowRates,
      buffaloRates,
      rates,
    ]);

  const filteredHistory =
    useMemo(() => {
      if (
        historyMilkType === "All"
      ) {
        return history;
      }

      return history.filter(
        (item) =>
          item.milkType ===
          historyMilkType
      );
    }, [
      history,
      historyMilkType,
    ]);

  /*
    Summary values.
  */
  const activeRatesCount =
    rates.filter(
      (rate) =>
        rate.status === "Active"
    ).length;

  const inactiveRatesCount =
    rates.filter(
      (rate) =>
        rate.status ===
        "Inactive"
    ).length;

  const historyCreatedCount =
    history.filter(
      (item) =>
        item.action === "Created"
    ).length;

  const historyUpdatedCount =
    history.filter(
      (item) =>
        item.action === "Updated"
    ).length;

  const historyDeletedCount =
    history.filter(
      (item) =>
        item.action === "Deleted"
    ).length;

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [
    fromDate,
    toDate,
  ]);

  async function loadPageData() {
    try {
      setLoading(true);
      setError("");

      const [
        rateResult,
        historyResult,
      ] = await Promise.all([
        getRates(),

        getRateHistory({
          fromDate,
          toDate,
        }),
      ]);

      setRates(
        rateResult.data || []
      );

      setHistory(
        historyResult.data || []
      );
    } catch (error) {
      console.error(
        "Rate Master loading error:",
        error
      );

      setError(
        error.message ||
          "Unable to load Rate Master"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadRates() {
    try {
      const result =
        await getRates();

      setRates(
        result.data || []
      );
    } catch (error) {
      console.error(
        "Load rates error:",
        error
      );

      setError(
        error.message ||
          "Unable to load rates"
      );
    }
  }

  async function loadHistory() {
    if (!fromDate || !toDate) {
      return;
    }

    try {
      const result =
        await getRateHistory({
          fromDate,
          toDate,
        });

      setHistory(
        result.data || []
      );
    } catch (error) {
      console.error(
        "Load history error:",
        error
      );
    }
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setRateForm(
      (previous) => {
        const updatedForm = {
          ...previous,
          [name]: value,
        };

        /*
          Automatically set normal
          SNF values when milk type changes.
        */
        if (
          name === "milkType"
        ) {
          updatedForm.snf =
            value === "Buffalo"
              ? "9.0"
              : "8.5";
        }

        return updatedForm;
      }
    );
  }

  function clearForm() {
    setRateForm(emptyForm);
    setEditId(null);
  }

  function validateForm() {
    if (
      !rateForm.milkType ||
      !rateForm.fat ||
      !rateForm.snf ||
      !rateForm.rate
    ) {
      alert(
        "Please fill milk type, FAT, SNF and rate"
      );

      return false;
    }

    if (
      Number(rateForm.fat) <=
        0 ||
      Number(rateForm.snf) <=
        0 ||
      Number(rateForm.rate) <=
        0
    ) {
      alert(
        "FAT, SNF and rate must be greater than zero"
      );

      return false;
    }

    return true;
  }

  async function saveRate() {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        milkType:
          rateForm.milkType,

        fat:
          Number(rateForm.fat),

        snf:
          Number(rateForm.snf),

        rate:
          Number(rateForm.rate),

        status:
          rateForm.status,

        changedBy:
          "System Administrator",
      };

      const result =
        editId !== null
          ? await updateRateApi(
              editId,
              payload
            )
          : await addRate(
              payload
            );

      alert(
        result.message ||
          "Rate saved successfully"
      );

      clearForm();

      await Promise.all([
        loadRates(),
        loadHistory(),
      ]);
    } catch (error) {
      console.error(
        "Save rate error:",
        error
      );

      alert(
        error.message ||
          "Unable to save rate"
      );
    } finally {
      setSaving(false);
    }
  }

  function editRate(rate) {
    setRateForm({
      milkType:
        rate.milkType,

      fat:
        String(rate.fat),

      snf:
        String(rate.snf),

      rate:
        String(rate.rate),

      status:
        rate.status ||
        "Active",
    });

    setEditId(rate.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteRate(
    rateId
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this rate?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const result =
        await deleteRateApi(
          rateId
        );

      alert(
        result.message ||
          "Rate deleted successfully"
      );

      if (
        String(editId) ===
        String(rateId)
      ) {
        clearForm();
      }

      await Promise.all([
        loadRates(),
        loadHistory(),
      ]);
    } catch (error) {
      console.error(
        "Delete rate error:",
        error
      );

      alert(
        error.message ||
          "Unable to delete rate"
      );
    }
  }

  function renderRateTable(
    rateRecords,
    milkType
  ) {
    return (
      <div
        className={`rate-category-card ${
          milkType === "Cow"
            ? "cow-rate-card"
            : "buffalo-rate-card"
        }`}
      >
        <div className="rate-category-header">
          <div className="rate-category-title">
            <span className="rate-category-icon">
              {milkType === "Cow"
                ? "🐄"
                : "🐃"}
            </span>

            <div>
              <span>
                {milkType} pricing
              </span>

              <h2>
                {milkType} Milk Rates
              </h2>
            </div>
          </div>

          <div className="rate-category-count">
            <strong>
              {rateRecords.length}
            </strong>

            <span>
              configured rates
            </span>
          </div>
        </div>

        <div className="rate-table-wrapper">
          <table className="professional-rate-table">
            <thead>
              <tr>
                <th>FAT</th>
                <th>SNF</th>
                <th>Rate / Litre</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Updated Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rateRecords.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="rate-empty-cell"
                  >
                    <div className="rate-empty-state">
                      <span>
                        {milkType ===
                        "Cow"
                          ? "🐄"
                          : "🐃"}
                      </span>

                      <strong>
                        No {milkType} rates
                        found
                      </strong>

                      <p>
                        Add a new rate using
                        the form above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rateRecords.map(
                  (rate) => (
                    <tr key={rate.id}>
                      <td>
                        <span className="rate-value-pill">
                          {rate.fat}
                        </span>
                      </td>

                      <td>
                        <span className="rate-value-pill">
                          {rate.snf}
                        </span>
                      </td>

                      <td>
                        <strong className="rate-price-value">
                          ₹
                          {formatAmount(
                            rate.rate
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={
                            rate.status ===
                            "Active"
                              ? "rate-status-badge rate-status-active"
                              : "rate-status-badge rate-status-inactive"
                          }
                        >
                          <span />

                          {rate.status}
                        </span>
                      </td>

                      <td>
                        <div className="rate-date-cell">
                          <span>📅</span>

                          {formatDate(
                            rate.createdAt
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="rate-date-cell">
                          <span>🕒</span>

                          {formatDate(
                            rate.updatedAt
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="rate-table-actions">
                          <button
                            type="button"
                            className="rate-edit-button"
                            onClick={() =>
                              editRate(
                                rate
                              )
                            }
                          >
                            <span>✏️</span>
                            Edit
                          </button>

                          <button
                            type="button"
                            className="rate-delete-button"
                            onClick={() =>
                              deleteRate(
                                rate.id
                              )
                            }
                          >
                            <span>🗑️</span>
                            Delete
                          </button>
                        </div>
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

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner
          message="Loading Rate Master..."
        />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <ErrorCard
          title="Rate Master could not be loaded"
          message={error}
          onRetry={loadPageData}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="professional-rate-page">
        {/* Page heading */}

        <header className="rate-page-header">
          <div>
            <span className="rate-page-eyebrow">
              Pricing and Rate Management
            </span>

            <h1>Rate Master</h1>

            <p>
              Configure, monitor and audit
              Cow and Buffalo milk rates
              based on FAT and SNF.
            </p>
          </div>

          <div className="rate-page-header-badge">
            <span>📊</span>

            <div>
              <small>
                Total configured
              </small>

              <strong>
                {rates.length} Rates
              </strong>
            </div>
          </div>
        </header>

        {/* Summary cards */}

        <section className="rate-summary-grid">
          <article className="rate-summary-card rate-summary-total">
            <div className="rate-summary-icon">
              📋
            </div>

            <div>
              <span>Total Rates</span>

              <strong>
                {rates.length}
              </strong>

              <small>
                All configured records
              </small>
            </div>
          </article>

          <article className="rate-summary-card rate-summary-cow">
            <div className="rate-summary-icon">
              🐄
            </div>

            <div>
              <span>Cow Rates</span>

              <strong>
                {cowRates.length}
              </strong>

              <small>
                Cow FAT and SNF rates
              </small>
            </div>
          </article>

          <article className="rate-summary-card rate-summary-buffalo">
            <div className="rate-summary-icon">
              🐃
            </div>

            <div>
              <span>Buffalo Rates</span>

              <strong>
                {buffaloRates.length}
              </strong>

              <small>
                Buffalo FAT and SNF rates
              </small>
            </div>
          </article>

          <article className="rate-summary-card rate-summary-active">
            <div className="rate-summary-icon">
              ✓
            </div>

            <div>
              <span>Active Rates</span>

              <strong>
                {activeRatesCount}
              </strong>

              <small>
                {inactiveRatesCount} inactive
              </small>
            </div>
          </article>
        </section>

        {/* Rate form */}

        <section className="professional-rate-form-card">
          <div className="rate-section-heading">
            <div className="rate-section-heading-icon">
              {editId
                ? "✏️"
                : "➕"}
            </div>

            <div>
              <span>
                {editId
                  ? "Update pricing"
                  : "Create pricing"}
              </span>

              <h2>
                {editId
                  ? "Edit Rate Record"
                  : "Add New Milk Rate"}
              </h2>

              <p>
                Define a rate for a specific
                milk type, FAT and SNF
                combination.
              </p>
            </div>
          </div>

          <div className="professional-rate-form-grid">
            <label className="rate-form-field">
              <span>Milk Type</span>

              <select
                name="milkType"
                value={
                  rateForm.milkType
                }
                onChange={handleChange}
              >
                <option value="Cow">
                  Cow Milk
                </option>

                <option value="Buffalo">
                  Buffalo Milk
                </option>
              </select>
            </label>

            <label className="rate-form-field">
              <span>FAT Percentage</span>

              <div className="rate-input-with-icon">
                <span>%</span>

                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="fat"
                  placeholder="Enter FAT"
                  value={rateForm.fat}
                  onChange={handleChange}
                />
              </div>
            </label>

            <label className="rate-form-field">
              <span>SNF Percentage</span>

              <div className="rate-input-with-icon">
                <span>%</span>

                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="snf"
                  placeholder="Enter SNF"
                  value={rateForm.snf}
                  onChange={handleChange}
                />
              </div>
            </label>

            <label className="rate-form-field">
              <span>Rate Per Litre</span>

              <div className="rate-input-with-icon">
                <span>₹</span>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="rate"
                  placeholder="Enter rate"
                  value={rateForm.rate}
                  onChange={handleChange}
                />
              </div>
            </label>

            <label className="rate-form-field">
              <span>Rate Status</span>

              <select
                name="status"
                value={
                  rateForm.status
                }
                onChange={handleChange}
              >
                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </label>

            <div className="rate-form-actions">
              <button
                type="button"
                className="rate-save-button"
                onClick={saveRate}
                disabled={saving}
              >
                <span>
                  {editId
                    ? "✓"
                    : "+"}
                </span>

                {saving
                  ? "Saving..."
                  : editId
                    ? "Update Rate"
                    : "Save Rate"}
              </button>

              {editId && (
                <button
                  type="button"
                  className="rate-cancel-button"
                  onClick={clearForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Current rate chart */}

        <section className="rate-chart-section">
          <div className="rate-chart-topbar">
            <div>
              <span className="rate-section-label">
                Current Pricing
              </span>

              <h2>
                Milk Rate Charts
              </h2>

              <p>
                Cow and Buffalo rates are
                shown separately for easier
                management.
              </p>
            </div>

            <div className="rate-chart-tabs">
              <button
                type="button"
                className={
                  activeRateTab ===
                  "All"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveRateTab(
                    "All"
                  )
                }
              >
                All
                <span>
                  {rates.length}
                </span>
              </button>

              <button
                type="button"
                className={
                  activeRateTab ===
                  "Cow"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveRateTab(
                    "Cow"
                  )
                }
              >
                🐄 Cow
                <span>
                  {cowRates.length}
                </span>
              </button>

              <button
                type="button"
                className={
                  activeRateTab ===
                  "Buffalo"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveRateTab(
                    "Buffalo"
                  )
                }
              >
                🐃 Buffalo
                <span>
                  {
                    buffaloRates.length
                  }
                </span>
              </button>
            </div>
          </div>

          <div className="rate-category-grid">
            {activeRateTab ===
              "All" && (
              <>
                {renderRateTable(
                  cowRates,
                  "Cow"
                )}

                {renderRateTable(
                  buffaloRates,
                  "Buffalo"
                )}
              </>
            )}

            {activeRateTab ===
              "Cow" &&
              renderRateTable(
                displayedRates,
                "Cow"
              )}

            {activeRateTab ===
              "Buffalo" &&
              renderRateTable(
                displayedRates,
                "Buffalo"
              )}
          </div>
        </section>

        {/* History section */}

        <section className="professional-rate-history">
          <div className="rate-history-header">
            <div>
              <span className="rate-section-label">
                Audit and Change Tracking
              </span>

              <h2>
                Rate History Register
              </h2>

              <p>
                Review created, updated and
                deleted rate records for
                each billing cycle.
              </p>
            </div>

            <div className="history-summary">
              <div>
                <span className="history-created-dot" />

                <small>Created</small>

                <strong>
                  {
                    historyCreatedCount
                  }
                </strong>
              </div>

              <div>
                <span className="history-updated-dot" />

                <small>Updated</small>

                <strong>
                  {
                    historyUpdatedCount
                  }
                </strong>
              </div>

              <div>
                <span className="history-deleted-dot" />

                <small>Deleted</small>

                <strong>
                  {
                    historyDeletedCount
                  }
                </strong>
              </div>
            </div>
          </div>

          <div className="rate-history-filters">
            <label>
              <span>History Month</span>

              <input
                type="month"
                value={
                  historyMonth
                }
                onChange={(event) =>
                  setHistoryMonth(
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              <span>Billing Cycle</span>

              <select
                value={
                  historyCycle
                }
                onChange={(event) =>
                  setHistoryCycle(
                    event.target.value
                  )
                }
              >
                <option value="1">
                  Cycle 1: 1–10
                </option>

                <option value="2">
                  Cycle 2: 11–20
                </option>

                <option value="3">
                  Cycle 3: 21–End
                </option>
              </select>
            </label>

            <label>
              <span>Milk Type</span>

              <select
                value={
                  historyMilkType
                }
                onChange={(event) =>
                  setHistoryMilkType(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All Milk Types
                </option>

                <option value="Cow">
                  Cow
                </option>

                <option value="Buffalo">
                  Buffalo
                </option>
              </select>
            </label>

            <div className="history-period-card">
              <span>Selected Period</span>

              <strong>
                {fromDate}
              </strong>

              <small>to</small>

              <strong>
                {toDate}
              </strong>
            </div>
          </div>

          <div className="professional-history-table-wrapper">
            <table className="professional-history-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Milk Type</th>
                  <th>FAT</th>
                  <th>SNF</th>
                  <th>Previous Rate</th>
                  <th>New Rate</th>
                  <th>Changed Date</th>
                  <th>Changed Time</th>
                  <th>Changed By</th>
                </tr>
              </thead>

              <tbody>
                {filteredHistory.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="history-empty-cell"
                    >
                      <div className="history-empty-state">
                        <span>🕘</span>

                        <strong>
                          No rate history
                          found
                        </strong>

                        <p>
                          No changes were
                          recorded during the
                          selected period.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(
                    (item) => (
                      <tr
                        key={
                          item.historyId
                        }
                      >
                        <td>
                          <span
                            className={`history-action-badge history-action-${getHistoryActionClass(
                              item.action
                            )}`}
                          >
                            {item.action ===
                            "Created"
                              ? "＋"
                              : item.action ===
                                  "Updated"
                                ? "✎"
                                : "−"}

                            {
                              item.action
                            }
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              item.milkType ===
                              "Cow"
                                ? "history-milk-badge history-cow-badge"
                                : "history-milk-badge history-buffalo-badge"
                            }
                          >
                            {item.milkType ===
                            "Cow"
                              ? "🐄"
                              : "🐃"}

                            {
                              item.milkType
                            }
                          </span>
                        </td>

                        <td>
                          <span className="history-number-value">
                            {item.fat}
                          </span>
                        </td>

                        <td>
                          <span className="history-number-value">
                            {item.snf}
                          </span>
                        </td>

                        <td>
                          {item.oldRate ===
                          "-" ? (
                            <span className="history-empty-value">
                              —
                            </span>
                          ) : (
                            <strong className="history-old-rate">
                              ₹
                              {formatAmount(
                                item.oldRate
                              )}
                            </strong>
                          )}
                        </td>

                        <td>
                          {item.newRate ===
                          "-" ? (
                            <span className="history-empty-value">
                              —
                            </span>
                          ) : (
                            <strong className="history-new-rate">
                              ₹
                              {formatAmount(
                                item.newRate
                              )}
                            </strong>
                          )}
                        </td>

                        <td>
                          <div className="history-date-time">
                            <span>📅</span>

                            <strong>
                              {
                                item.changedDate
                              }
                            </strong>
                          </div>
                        </td>

                        <td>
                          <div className="history-date-time">
                            <span>🕒</span>

                            <strong>
                              {
                                item.changedTime
                              }
                            </strong>
                          </div>
                        </td>

                        <td>
                          <div className="history-user">
                            <span>
                              {String(
                                item.changedBy ||
                                  "S"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </span>

                            <strong>
                              {item.changedBy ||
                                "System"}
                            </strong>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="history-table-footer">
            <span>
              Showing{" "}
              <strong>
                {
                  filteredHistory.length
                }
              </strong>{" "}
              history records
            </span>

            <span>
              Period: {fromDate} to{" "}
              {toDate}
            </span>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

export default RateMaster;