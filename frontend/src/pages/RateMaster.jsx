import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { formatAmount } from "../utils/amountUtils";

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

  const [historyMonth, setHistoryMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [historyCycle, setHistoryCycle] = useState("1");

  useEffect(() => {
    const savedRates = localStorage.getItem("rateMaster");
    const savedHistory = localStorage.getItem("rateHistory");

    if (savedRates) {
      setRates(JSON.parse(savedRates));
    }

    if (savedHistory) {
      setRateHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("rateMaster", JSON.stringify(rates));
  }, [rates]);

  useEffect(() => {
    localStorage.setItem("rateHistory", JSON.stringify(rateHistory));
  }, [rateHistory]);

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

  function isDuplicateRate() {
    return rates.some(
      (item) =>
        item.milkType === rateForm.milkType &&
        item.fat === rateForm.fat &&
        item.snf === rateForm.snf &&
        item.id !== editId
    );
  }

  function saveRate() {
    if (!rateForm.fat || !rateForm.snf || !rateForm.rate) {
      alert("Fill all fields");
      return;
    }

    if (isDuplicateRate()) {
      alert("Rate already exists for this Milk Type, FAT and SNF");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const newRate = {
      id: Date.now(),
      ...rateForm,
      rate: Number(rateForm.rate).toFixed(2),
      createdDate: today,
      createdTime: new Date().toLocaleTimeString(),
    };

    const historyRecord = {
      historyId: Date.now() + 1,
      action: "Created",
      milkType: rateForm.milkType,
      fat: rateForm.fat,
      snf: rateForm.snf,
      oldRate: "-",
      newRate: Number(rateForm.rate).toFixed(2),
      changedDate: today,
      changedTime: new Date().toLocaleTimeString(),
    };

    setRates([...rates, newRate]);
    setRateHistory([...rateHistory, historyRecord]);

    clearForm();
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

  function updateRate() {
    if (!rateForm.fat || !rateForm.snf || !rateForm.rate) {
      alert("Fill all fields");
      return;
    }

    if (isDuplicateRate()) {
      alert("Rate already exists for this Milk Type, FAT and SNF");
      return;
    }

    const oldRate = rates.find((item) => item.id === editId);

    if (!oldRate) {
      alert("Rate not found");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

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

    const updatedRates = rates.map((item) =>
      item.id === editId
        ? {
            ...item,
            milkType: rateForm.milkType,
            fat: rateForm.fat,
            snf: rateForm.snf,
            rate: Number(rateForm.rate).toFixed(2),
            updatedDate: today,
            updatedTime: new Date().toLocaleTimeString(),
          }
        : item
    );

    setRates(updatedRates);
    setRateHistory([...rateHistory, historyRecord]);

    clearForm();
  }

  function deleteRate(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this rate?"
    );

    if (!confirmDelete) {
      return;
    }

    const deletedRate = rates.find((item) => item.id === id);

    if (!deletedRate) {
      return;
    }

    const today = new Date().toISOString().split("T")[0];

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

    setRates(rates.filter((item) => item.id !== id));
    setRateHistory([...rateHistory, historyRecord]);
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
              <td colSpan="7">No current rates found</td>
            </tr>
          ) : (
            rates.map((rate) => (
              <tr key={rate.id}>
                <td>{rate.milkType}</td>
                <td>{rate.fat}</td>
                <td>{rate.snf}</td>
                <td>₹{formatAmount(rate.rate)}</td>
                <td>{rate.createdDate || "-"}</td>
                <td>{rate.updatedDate || "-"}</td>
                <td>
                  <button onClick={() => editRate(rate)}>
                    Edit
                  </button>

                  <button onClick={() => deleteRate(rate.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <hr />

      <h2>Rate History Register</h2>

      <div className="collection-form">
        <input
          type="month"
          value={historyMonth}
          onChange={(e) => setHistoryMonth(e.target.value)}
        />

        <select
          value={historyCycle}
          onChange={(e) => setHistoryCycle(e.target.value)}
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