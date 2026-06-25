import { useState } from "react";
import MainLayout from "../layouts/MainLayout";

function BackupRestore() {
  const storageKeys = [
    "members",
    "collections",
    "rateMaster",
    "rateHistory",
    "feedRecords",
    "advanceRecords",
    "billRecords",
  ];

  function getDataCount(key) {
    const data = localStorage.getItem(key);

    if (!data) return 0;

    try {
      return JSON.parse(data).length || 0;
    } catch {
      return 0;
    }
  }

  const [summary, setSummary] = useState(
    storageKeys.map((key) => ({
      name: key,
      count: getDataCount(key),
    }))
  );

  function refreshSummary() {
    setSummary(
      storageKeys.map((key) => ({
        name: key,
        count: getDataCount(key),
      }))
    );
  }

  function downloadBackup() {
    const backupData = {};

    storageKeys.forEach((key) => {
      backupData[key] =
        JSON.parse(localStorage.getItem(key)) || [];
    });

    const fileData = JSON.stringify(
      {
        appName: "Dairy Management System",
        backupDate: new Date().toISOString(),
        data: backupData,
      },
      null,
      2
    );

    const blob = new Blob([fileData], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `DairyBackup_${new Date()
      .toISOString()
      .split("T")[0]}.json`;

    a.click();

    URL.revokeObjectURL(url);
  }

  function restoreBackup(e) {
    const file = e.target.files[0];

    if (!file) return;

    const confirmRestore = window.confirm(
      "Restoring backup will replace current data. Continue?"
    );

    if (!confirmRestore) return;

    const reader = new FileReader();

    reader.onload = function (event) {
      try {
        const backup = JSON.parse(event.target.result);
        const data = backup.data || backup;

        storageKeys.forEach((key) => {
          localStorage.setItem(
            key,
            JSON.stringify(data[key] || [])
          );
        });

        alert("Backup restored successfully");
        refreshSummary();
        window.location.reload();
      } catch {
        alert("Invalid backup file");
      }
    };

    reader.readAsText(file);
  }

  function resetAllData() {
    const confirmReset = window.confirm(
      "Are you sure? This will delete all dairy data."
    );

    if (!confirmReset) return;

    storageKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    alert("All data deleted");
    refreshSummary();
    window.location.reload();
  }

  return (
    <MainLayout>
      <div className="backup-page">
        <div className="backup-hero">
          <div>
            <h1>Backup & Restore</h1>
            <p>
              Export, restore, and protect your complete dairy data.
            </p>
          </div>

          <div className="backup-badge">
            💾 Data Safety
          </div>
        </div>

        <div className="backup-action-grid">
          <div className="backup-card">
            <div className="backup-icon green">⬇️</div>
            <h3>Download Backup</h3>
            <p>Export full dairy data as a JSON backup file.</p>

            <button
              className="backup-btn green-btn"
              onClick={downloadBackup}
            >
              Download Backup
            </button>
          </div>

          <div className="backup-card">
            <div className="backup-icon blue">⬆️</div>
            <h3>Restore Backup</h3>
            <p>Import a previously downloaded backup file.</p>

            <label className="backup-file-btn">
              Choose Backup File
              <input
                type="file"
                accept=".json"
                onChange={restoreBackup}
              />
            </label>
          </div>

          <div className="backup-card danger-card">
            <div className="backup-icon red">🗑️</div>
            <h3>Reset Data</h3>
            <p>Delete all local dairy records permanently.</p>

            <button
              className="backup-btn red-btn"
              onClick={resetAllData}
            >
              Delete All Data
            </button>
          </div>
        </div>

        <div className="backup-summary-box">
          <h2>Backup Summary</h2>

          <table className="member-table">
            <thead>
              <tr>
                <th>Data Section</th>
                <th>Total Records</th>
              </tr>
            </thead>

            <tbody>
              {summary.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}

export default BackupRestore;