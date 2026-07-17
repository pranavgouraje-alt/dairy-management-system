import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import { formatAmount } from "../utils/amountUtils";

import { getMembers } from "../services/memberService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorCard from "../components/ErrorCard";

import {
  getAdvanceRecords,
  addAdvanceRecord,
  updateAdvanceRecord,
  deleteAdvanceRecord as deleteAdvanceRecordApi,
} from "../services/advanceService";

function AdvanceManagement() {
  const createEmptyForm = () => ({
    memberId: "",
    memberName: "",
    amount: "",
    date: new Date()
      .toISOString()
      .split("T")[0],
    reason: "",
    status: "Pending",
  });

  const [error, setError] = useState("");

  const [members, setMembers] =
    useState([]);

  const [advanceForm, setAdvanceForm] =
    useState(createEmptyForm());

  const [
    advanceRecords,
    setAdvanceRecords,
  ] = useState([]);

  const [editId, setEditId] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    loadMembers();
    loadAdvanceRecords();
  }, []);

  async function loadMembers() {
    try {
      const result = await getMembers();

      if (result.success) {
        setMembers(result.data || []);
      }
    } catch (error) {
      console.error(
        "Member loading error:",
        error
      );

      alert(
        "Unable to load members from backend"
      );
    }
  }

  async function loadAdvanceRecords() {
  try {
    setLoading(true);
    setError("");

    const result =
      await getAdvanceRecords();

    if (result.success) {
      setAdvanceRecords(
        result.data || []
      );
    }
  } catch (error) {
    console.error(
      "Advance loading error:",
      error
    );

    setError(
      error.message ||
        "Unable to load advance records"
    );
  } finally {
    setLoading(false);
  }
}

  function handleChange(e) {
    const { name, value } = e.target;

    setAdvanceForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleMemberChange(e) {
    const memberId = e.target.value;

    const selectedMember = members.find(
      (member) =>
        String(member.memberId) ===
        String(memberId)
    );

    setAdvanceForm((previous) => ({
      ...previous,

      memberId,

      memberName: selectedMember
        ? selectedMember.name
        : "",
    }));
  }

  function clearForm() {
    setAdvanceForm(createEmptyForm());
    setEditId(null);
  }

  function validateForm() {
    if (!advanceForm.memberId) {
      alert("Please select a member");
      return false;
    }

    if (!advanceForm.memberName) {
      alert("Member name not found");
      return false;
    }

    if (
      Number(advanceForm.amount) <= 0
    ) {
      alert(
        "Advance amount must be greater than zero"
      );
      return false;
    }

    if (!advanceForm.date) {
      alert("Please select date");
      return false;
    }

    return true;
  }

  async function saveAdvance() {
    if (!validateForm()) {
      return;
    }

    const record = {
      memberId: advanceForm.memberId,

      memberName:
        advanceForm.memberName,

      amount: Number(
        advanceForm.amount
      ),

      date: advanceForm.date,

      reason:
        advanceForm.reason.trim(),

      status: advanceForm.status,
    };

    try {
      setSaving(true);

      let result;

      if (editId !== null) {
        result =
          await updateAdvanceRecord(
            editId,
            record
          );
      } else {
        result =
          await addAdvanceRecord(
            record
          );
      }

      if (!result.success) {
        alert(
          result.message ||
            "Advance operation failed"
        );
        return;
      }

      alert(result.message);

      clearForm();

      await loadAdvanceRecords();
    } catch (error) {
      console.error(
        "Advance saving error:",
        error
      );

      alert(
        error.message ||
          "Unable to save advance"
      );
    } finally {
      setSaving(false);
    }
  }

  function editAdvance(record) {
    setEditId(record.advanceId);

    setAdvanceForm({
      memberId: record.memberId || "",

      memberName:
        record.memberName || "",

      amount:
        record.amount !== undefined
          ? String(record.amount)
          : "",

      date:
        record.date ||
        new Date()
          .toISOString()
          .split("T")[0],

      reason: record.reason || "",

      status:
        record.status || "Pending",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteAdvanceHandler(
    advanceId
  ) {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this advance record?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      const result =
        await deleteAdvanceRecordApi(
          advanceId
        );

      if (!result.success) {
        alert(
          result.message ||
            "Advance delete failed"
        );
        return;
      }

      alert(result.message);

      if (editId === advanceId) {
        clearForm();
      }

      await loadAdvanceRecords();
    } catch (error) {
      console.error(
        "Advance delete error:",
        error
      );

      alert(
        error.message ||
          "Unable to delete advance"
      );
    }
  }

  const totalAdvance =
    advanceRecords.reduce(
      (total, record) =>
        total +
        Number(record.amount || 0),
      0
    );

  const totalRemaining =
    advanceRecords.reduce(
      (total, record) =>
        total +
        Number(
          record.remainingAmount || 0
        ),
      0
    );

  const pendingCount =
    advanceRecords.filter(
      (record) =>
        record.status !== "Cleared"
    ).length;

  const columns = [
    {
      key: "memberId",
      label: "Member ID",
    },
    {
      key: "memberName",
      label: "Member",
    },
    {
      key: "amount",
      label: "Advance Amount",

      render: (row) => (
        <strong>
          ₹{formatAmount(row.amount)}
        </strong>
      ),
    },
    {
      key: "remainingAmount",
      label: "Remaining",

      render: (row) => (
        <strong>
          ₹
          {formatAmount(
            row.remainingAmount
          )}
        </strong>
      ),
    },
    {
      key: "date",
      label: "Date",
    },
    {
      key: "reason",
      label: "Reason",
    },
    {
      key: "status",
      label: "Status",

      render: (row) => (
        <StatusBadge
          status={row.status}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,

      render: (row) => (
        <div className="table-actions">
          <button
            className="table-edit-btn"
            onClick={() =>
              editAdvance(row)
            }
          >
            Edit
          </button>

          <button
            className="table-delete-btn"
            onClick={() =>
              deleteAdvanceHandler(
                row.advanceId
              )
            }
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <h1>Advance Management</h1>

      <div className="session-summary-grid">
        <div className="session-summary-card">
          <h3>Total Advance</h3>

          <h2>
            ₹{formatAmount(totalAdvance)}
          </h2>
        </div>

        <div className="session-summary-card">
          <h3>Remaining Advance</h3>

          <h2>
            ₹
            {formatAmount(
              totalRemaining
            )}
          </h2>
        </div>

        <div className="session-summary-card">
          <h3>Pending Records</h3>

          <h2>{pendingCount}</h2>
        </div>
      </div>

      <div className="collection-form">
        <select
          name="memberId"
          value={advanceForm.memberId}
          onChange={handleMemberChange}
        >
          <option value="">
            Select Member
          </option>

          {members
            .filter(
              (member) =>
                member.status !== "Inactive"
            )
            .map((member) => (
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
          name="memberName"
          placeholder="Member Name"
          value={
            advanceForm.memberName
          }
          readOnly
        />

        <input
          type="number"
          min="0"
          step="0.01"
          name="amount"
          placeholder="Advance Amount"
          value={advanceForm.amount}
          onChange={handleChange}
        />

        <input
          type="date"
          name="date"
          value={advanceForm.date}
          onChange={handleChange}
        />

        <input
          name="reason"
          placeholder="Reason"
          value={advanceForm.reason}
          onChange={handleChange}
        />

        <select
          name="status"
          value={advanceForm.status}
          onChange={handleChange}
        >
          <option value="Pending">
            Pending
          </option>

          <option value="Partially Paid">
            Partially Paid
          </option>

          <option value="Cleared">
            Cleared
          </option>
        </select>

        <button
          type="button"
          onClick={saveAdvance}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : editId !== null
              ? "Update Advance"
              : "Save Advance"}
        </button>

        {editId !== null && (
          <button
            type="button"
            onClick={clearForm}
            disabled={saving}
          >
            Cancel
          </button>
        )}
      </div>

      {loading ? (
  <LoadingSpinner
    message="Loading advance records..."
  />
) : error ? (
  <ErrorCard
    title="Advance records could not be loaded"
    message={error}
    onRetry={loadAdvanceRecords}
  />
) : (
  <DataTable
    columns={columns}
    data={advanceRecords}
    searchPlaceholder="Search advance records..."
  />
)}
    </MainLayout>
  );
}

export default AdvanceManagement;