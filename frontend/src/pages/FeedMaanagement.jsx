import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import StatusBadge from "../components/StatusBadge";
import DataTable from "../components/DataTable";
import { formatAmount } from "../utils/amountUtils";

import { getMembers } from "../services/memberService";

import {
  getFeedRecords,
  addFeedRecord,
  updateFeedRecord,
  deleteFeedRecord as deleteFeedRecordApi,
} from "../services/feedService";

function FeedManagement() {
  const createEmptyForm = () => ({
    memberId: "",
    memberName: "",
    feedType: "",
    quantity: "",
    rate: "",
    amount: 0,

    date: new Date()
      .toISOString()
      .split("T")[0],

    status: "Unpaid",
  });

  const [members, setMembers] = useState([]);

  const [feedData, setFeedData] = useState(
    createEmptyForm()
  );

  const [feedRecords, setFeedRecords] = useState([]);

  const [editId, setEditId] = useState(null);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMembers();
    loadFeedRecords();
  }, []);

  async function loadMembers() {
    try {
      const result = await getMembers();

      if (result.success) {
        setMembers(result.data || []);
      }
    } catch (error) {
      console.error(
        "Error loading members:",
        error
      );

      alert(
        "Unable to load members. Check whether the backend is running."
      );
    }
  }

  async function loadFeedRecords() {
    try {
      setLoading(true);

      const result = await getFeedRecords();

      if (result.success) {
        setFeedRecords(result.data || []);
      }
    } catch (error) {
      console.error(
        "Error loading feed records:",
        error
      );

      alert(
        error.message ||
          "Unable to load feed records"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setFeedData((previousData) => {
      const updatedData = {
        ...previousData,
        [name]: value,
      };

      if (
        name === "quantity" ||
        name === "rate"
      ) {
        updatedData.amount = Number(
          (
            Number(updatedData.quantity || 0) *
            Number(updatedData.rate || 0)
          ).toFixed(2)
        );
      }

      return updatedData;
    });
  }

  function handleMemberChange(e) {
    const memberId = e.target.value;

    const selectedMember = members.find(
      (member) =>
        String(member.memberId) ===
        String(memberId)
    );

    setFeedData((previousData) => ({
      ...previousData,

      memberId,

      memberName: selectedMember
        ? selectedMember.name
        : "",
    }));
  }

  function clearForm() {
    setFeedData(createEmptyForm());
    setEditId(null);
  }

  function validateForm() {
    if (!feedData.memberId) {
      alert("Please select a member");
      return false;
    }

    if (!feedData.memberName) {
      alert("Member name was not found");
      return false;
    }

    if (!feedData.feedType.trim()) {
      alert("Please enter feed type");
      return false;
    }

    if (Number(feedData.quantity) <= 0) {
      alert(
        "Quantity must be greater than zero"
      );
      return false;
    }

    if (Number(feedData.rate) <= 0) {
      alert("Rate must be greater than zero");
      return false;
    }

    if (!feedData.date) {
      alert("Please select a date");
      return false;
    }

    return true;
  }

  async function saveFeedRecord() {
    if (!validateForm()) {
      return;
    }

    const record = {
      memberId: feedData.memberId,
      memberName: feedData.memberName,
      feedType: feedData.feedType.trim(),

      quantity: Number(feedData.quantity),
      rate: Number(feedData.rate),
      amount: Number(feedData.amount),

      date: feedData.date,
      status: feedData.status,
    };

    try {
      setSaving(true);

      let result;

      if (editId !== null) {
        result = await updateFeedRecord(
          editId,
          record
        );
      } else {
        result = await addFeedRecord(record);
      }

      if (!result.success) {
        alert(
          result.message ||
            "Feed operation failed"
        );
        return;
      }

      alert(result.message);

      clearForm();

      await loadFeedRecords();
    } catch (error) {
      console.error(
        "Error saving feed record:",
        error
      );

      alert(
        error.message ||
          "Unable to save feed record"
      );
    } finally {
      setSaving(false);
    }
  }

  function editFeedRecord(record) {
    setEditId(record.feedId);

    setFeedData({
      memberId: record.memberId || "",
      memberName: record.memberName || "",
      feedType: record.feedType || "",

      quantity:
        record.quantity !== undefined
          ? String(record.quantity)
          : "",

      rate:
        record.rate !== undefined
          ? String(record.rate)
          : "",

      amount: Number(record.amount || 0),

      date:
        record.date ||
        new Date()
          .toISOString()
          .split("T")[0],

      status: record.status || "Unpaid",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteFeedRecordHandler(feedId) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this feed record?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const result =
        await deleteFeedRecordApi(feedId);

      if (!result.success) {
        alert(
          result.message ||
            "Feed record delete failed"
        );
        return;
      }

      alert(result.message);

      if (editId === feedId) {
        clearForm();
      }

      await loadFeedRecords();
    } catch (error) {
      console.error(
        "Error deleting feed record:",
        error
      );

      alert(
        error.message ||
          "Unable to delete feed record"
      );
    }
  }

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
      key: "feedType",
      label: "Feed Type",
    },
    {
      key: "quantity",
      label: "Quantity",
    },
    {
      key: "rate",
      label: "Rate",

      render: (row) => (
        <span>
          ₹{formatAmount(row.rate)}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",

      render: (row) => (
        <strong>
          ₹{formatAmount(row.amount)}
        </strong>
      ),
    },
    {
      key: "date",
      label: "Date",
    },
    {
      key: "status",
      label: "Status",

      render: (row) => (
        <StatusBadge status={row.status} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,

      render: (row) => (
        <div className="table-actions">
          <button
            type="button"
            className="table-edit-btn"
            onClick={() =>
              editFeedRecord(row)
            }
          >
            Edit
          </button>

          <button
            type="button"
            className="table-delete-btn"
            onClick={() =>
              deleteFeedRecordHandler(
                row.feedId
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
      <h1>Feed Management</h1>

      <div className="collection-form">
        <select
          name="memberId"
          value={feedData.memberId}
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
          value={feedData.memberName}
          readOnly
        />

        <input
          name="feedType"
          placeholder="Feed Type"
          value={feedData.feedType}
          onChange={handleChange}
        />

        <input
          type="number"
          min="0"
          step="0.01"
          name="quantity"
          placeholder="Quantity"
          value={feedData.quantity}
          onChange={handleChange}
        />

        <input
          type="number"
          min="0"
          step="0.01"
          name="rate"
          placeholder="Rate"
          value={feedData.rate}
          onChange={handleChange}
        />

        <input
          value={formatAmount(feedData.amount)}
          readOnly
          placeholder="Amount"
        />

        <input
          type="date"
          name="date"
          value={feedData.date}
          onChange={handleChange}
        />

        <select
          name="status"
          value={feedData.status}
          onChange={handleChange}
        >
          <option value="Unpaid">
            Unpaid
          </option>

          <option value="Paid">
            Paid
          </option>

          <option value="Deducted">
            Deducted
          </option>
        </select>

        <button
          type="button"
          onClick={saveFeedRecord}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : editId !== null
              ? "Update Feed"
              : "Save Feed"}
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
        <p>Loading feed records...</p>
      ) : (
        <DataTable
          columns={columns}
          data={feedRecords}
          searchPlaceholder="Search feed records..."
        />
      )}
    </MainLayout>
  );
}

export default FeedManagement;