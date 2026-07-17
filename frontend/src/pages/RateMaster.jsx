import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { formatAmount } from "../utils/amountUtils";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorCard from "../components/ErrorCard";
import {
  getRates,
  addRate,
  updateRate as updateRateApi,
  deleteRate as deleteRateApi,
} from "../services/rateService";

function RateMaster() {
  const emptyForm = {
    milkType: "Cow",
    fat: "",
    snf: "",
    rate: "",
  };

  const [rateForm, setRateForm] = useState(emptyForm);
  const [rates, setRates] = useState([]);
  const [rateHistory, setRateHistory] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

  const [historyMonth, setHistoryMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [historyCycle, setHistoryCycle] = useState("1");

  useEffect(() => {
    loadRates();

    const savedHistory = localStorage.getItem("rateHistory");

    if (savedHistory) {
      setRateHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "rateHistory",
      JSON.stringify(rateHistory)
    );
  }, [rateHistory]);

 async function loadRates() {
  try {
    setLoading(true);
    setError("");

    const result = await getRates();

    if (result.success) {
      setRates(result.data || []);
    }
  } catch (error) {
    console.error(
      "Rate loading error:",
      error
    );

    setError(
      error.message ||
        "Unable to load milk rates"
    );
  } finally {
    setLoading(false);
  }
}

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

  const historyDates = getBillingDates(
    historyMonth,
    historyCycle
  );

  const fromDate = historyDates.fromDate;
  const toDate = historyDates.toDate;

  const filteredHistory = rateHistory.filter(
    (item) =>
      item.changedDate >= fromDate &&
      item.changedDate <= toDate
  );

  function handleChange(e) {
    setRateForm({
      ...rateForm,
      [e.target.name]: e.target.value,
    });
  }

  function clearForm() {
    setRateForm(emptyForm);
    setEditId(null);
  }

  async function saveRate() {
    if (!rateForm.fat || !rateForm.snf || !rateForm.rate) {
      alert("Fill all fields");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    try {
      const result = await addRate({
        milkType: rateForm.milkType,
        fat: rateForm.fat,
        snf: rateForm.snf,
        rate: rateForm.rate,
      });

      if (!result.success) {
        alert(result.message || "Rate save failed");
        return;
      }

      const historyRecord = {
        historyId: Date.now(),
        action: "Created",
        milkType: rateForm.milkType,
        fat: rateForm.fat,
        snf: rateForm.snf,
        oldRate: "-",
        newRate: Number(rateForm.rate).toFixed(2),
        changedDate: today,
        changedTime: new Date().toLocaleTimeString(),
      };

      setRateHistory([...rateHistory, historyRecord]);

      alert(result.message);

      clearForm();

      await loadRates();
    } catch (error) {
      console.log(error);
      alert("Backend server is not running for rates");
    }
  }

  function editRate(rate) {
    setEditId(rate.id);

    setRateForm({
      milkType: rate.milkType,
      fat: rate.fat,
      snf: rate.snf,
      rate: rate.rate,
    });
  }

  async function updateRate() {
    if (!rateForm.fat || !rateForm.snf || !rateForm.rate) {
      alert("Fill all fields");
      return;
    }

    const oldRate = rates.find((item) => item.id === editId);

    if (!oldRate) {
      alert("Rate not found");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    try {
      const result = await updateRateApi(editId, {
        milkType: rateForm.milkType,
        fat: rateForm.fat,
        snf: rateForm.snf,
        rate: rateForm.rate,
      });

      if (!result.success) {
        alert(result.message || "Rate update failed");
        return;
      }

      const historyRecord = {
        historyId: Date.now(),
        action: "Updated",
        milkType: oldRate.milkType,
        fat: oldRate.fat,
        snf: oldRate.snf,
        oldRate: oldRate.rate,
        newRate: Number(rateForm.rate).toFixed(2),
        changedDate: today,
        changedTime: new Date().toLocaleTimeString(),
      };

      setRateHistory([...rateHistory, historyRecord]);

      alert(result.message);

      clearForm();

      await loadRates();
    } catch (error) {
      console.log(error);
      alert("Backend server is not running for rates");
    }
  }

  async function deleteRate(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this rate?"
    );

    if (!confirmDelete) {
      return;
    }

    const deletedRate = rates.find((item) => item.id === id);

    if (!deletedRate) {
      alert("Rate not found");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    try {
      const result = await deleteRateApi(id);

      if (!result.success) {
        alert(result.message || "Rate delete failed");
        return;
      }

      const historyRecord = {
        historyId: Date.now(),
        action: "Deleted",
        milkType: deletedRate.milkType,
        fat: deletedRate.fat,
        snf: deletedRate.snf,
        oldRate: deletedRate.rate,
        newRate: "-",
        changedDate: today,
        changedTime: new Date().toLocaleTimeString(),
      };

      setRateHistory([...rateHistory, historyRecord]);

      alert(result.message);

      await loadRates();
    } catch (error) {
      console.log(error);
      alert("Backend server is not running for rates");
    }
  }

  return (
    <MainLayout>
      <h1>Rate Master</h1>

      <div className="collection-form">
        <select
          name="milkType"
          value={rateForm.milkType}
          onChange={handleChange}
        >
          <option>Cow</option>
          <option>Buffalo</option>
        </select>

        <input
          type="number"
          step="0.1"
          name="fat"
          placeholder="Fat"
          value={rateForm.fat}
          onChange={handleChange}
        />

        <input
          type="number"
          step="0.1"
          name="snf"
          placeholder="SNF"
          value={rateForm.snf}
          onChange={handleChange}
        />

        <input
          type="number"
          step="0.01"
          name="rate"
          placeholder="Rate"
          value={rateForm.rate}
          onChange={handleChange}
        />

        <button onClick={editId ? updateRate : saveRate}>
          {editId ? "Update Rate" : "Save Rate"}
        </button>

        {editId && (
          <button onClick={clearForm}>
            Cancel
          </button>
        )}
      </div>

      <h2>Current Active Rate Chart</h2>

<h2>Current Active Rate Chart</h2>

{loading ? (
  <LoadingSpinner
    message="Loading active milk rates..."
  />
) : error ? (
  <ErrorCard
    title="Rate Master could not be loaded"
    message={error}
    onRetry={loadRates}
  />
) : (
  <table className="member-table">
    <thead>
      <tr>
        <th>Milk Type</th>
        <th>Fat</th>
        <th>SNF</th>
        <th>Current Rate</th>
        <th>Created Date</th>
        <th>Updated Date</th>
        <th>Action</th>
      </tr>
    </thead>

    <tbody>
      {rates.length === 0 ? (
        <tr>
          <td colSpan="7">
            No current rates found
          </td>
        </tr>
      ) : (
        rates.map((rate) => (
          <tr key={rate.id}>
            <td>{rate.milkType}</td>
            <td>{rate.fat}</td>
            <td>{rate.snf}</td>

            <td>
              ₹{formatAmount(rate.rate)}
            </td>

            <td>
              {rate.createdAt
                ? rate.createdAt.split("T")[0]
                : "-"}
            </td>

            <td>
              {rate.updatedAt
                ? rate.updatedAt.split("T")[0]
                : "-"}
            </td>

            <td>
              <div className="table-actions">
                <button
                  type="button"
                  className="table-edit-btn"
                  onClick={() =>
                    editRate(rate)
                  }
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="table-delete-btn"
                  onClick={() =>
                    deleteRate(rate.id)
                  }
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
)}
      <hr />

      <h2>Rate History Register</h2>

      <div className="collection-form">
        <input
          type="month"
          value={historyMonth}
          onChange={(e) =>
            setHistoryMonth(e.target.value)
          }
        />

        <select
          value={historyCycle}
          onChange={(e) =>
            setHistoryCycle(e.target.value)
          }
        >
          <option value="1">Cycle 1: 1 - 10</option>
          <option value="2">Cycle 2: 11 - 20</option>
          <option value="3">Cycle 3: 21 - End Month</option>
        </select>
      </div>

      <p>
        <strong>History Period:</strong> {fromDate} to {toDate}
      </p>

      <table className="member-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Milk Type</th>
            <th>Fat</th>
            <th>SNF</th>
            <th>Old Rate</th>
            <th>New Rate</th>
            <th>Changed Date</th>
            <th>Changed Time</th>
          </tr>
        </thead>

        <tbody>
          {filteredHistory.length === 0 ? (
            <tr>
              <td colSpan="8">
                No rate history found for selected cycle
              </td>
            </tr>
          ) : (
            filteredHistory.map((item) => (
              <tr key={item.historyId}>
                <td>{item.action}</td>
                <td>{item.milkType}</td>
                <td>{item.fat}</td>
                <td>{item.snf}</td>
                <td>
                  {item.oldRate === "-"
                    ? "-"
                    : `₹${formatAmount(item.oldRate)}`}
                </td>
                <td>
                  {item.newRate === "-"
                    ? "-"
                    : `₹${formatAmount(item.newRate)}`}
                </td>
                <td>{item.changedDate}</td>
                <td>{item.changedTime}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </MainLayout>
  );
}

export default RateMaster;