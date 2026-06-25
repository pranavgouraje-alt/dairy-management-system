import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import StatusBadge from "../components/StatusBadge";
import DataTable from "../components/DataTable";
import { formatAmount } from "../utils/amountUtils";

function FeedManagement() {
  const emptyForm = {
    memberId: "",
    memberName: "",
    feedType: "",
    quantity: "",
    rate: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    status: "Unpaid",
  };

  const [members, setMembers] = useState([]);
  const [feedData, setFeedData] = useState(emptyForm);
  const [feedRecords, setFeedRecords] = useState([]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const savedMembers = localStorage.getItem("members");
    const savedFeed = localStorage.getItem("feedRecords");

    if (savedMembers) {
      setMembers(JSON.parse(savedMembers));
    }

    if (savedFeed) {
      setFeedRecords(JSON.parse(savedFeed));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "feedRecords",
      JSON.stringify(feedRecords)
    );
  }, [feedRecords]);

  function handleChange(e) {
    const { name, value } = e.target;

    let updatedData = {
      ...feedData,
      [name]: value,
    };

    if (name === "memberId") {
      const member = members.find(
        (m) => m.memberId === value
      );

      updatedData.memberName = member ? member.name : "";
    }

    if (name === "quantity" || name === "rate") {
      updatedData.amount =
        Number(updatedData.quantity || 0) *
        Number(updatedData.rate || 0);
    }

    setFeedData(updatedData);
  }

  function clearForm() {
    setFeedData(emptyForm);
    setEditId(null);
  }

  function saveFeedRecord() {
    if (
      !feedData.memberId ||
      !feedData.memberName ||
      !feedData.feedType ||
      !feedData.quantity ||
      !feedData.rate
    ) {
      alert("Please fill all required fields");
      return;
    }

    const finalData = {
      ...feedData,
      amount: Number(feedData.amount).toFixed(2),
    };

    if (editId) {
      const updatedRecords = feedRecords.map((record) =>
        record.feedId === editId
          ? {
              ...finalData,
              feedId: editId,
            }
          : record
      );

      setFeedRecords(updatedRecords);
    } else {
      const newRecord = {
        feedId: Date.now(),
        ...finalData,
      };

      setFeedRecords([
        ...feedRecords,
        newRecord,
      ]);
    }

    clearForm();
  }

  function editFeedRecord(record) {
    setFeedData({
      memberId: record.memberId,
      memberName: record.memberName,
      feedType: record.feedType,
      quantity: record.quantity,
      rate: record.rate,
      amount: record.amount,
      date: record.date,
      status: record.status,
    });

    setEditId(record.feedId);
  }

  function deleteFeedRecord(feedId) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this feed record?"
    );

    if (!confirmDelete) {
      return;
    }

    const updatedRecords = feedRecords.filter(
      (record) => record.feedId !== feedId
    );

    setFeedRecords(updatedRecords);

    if (editId === feedId) {
      clearForm();
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
      render: (row) => `₹${formatAmount(row.rate)}`,
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => `₹${formatAmount(row.amount)}`,
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
            className="table-edit-btn"
            onClick={() => editFeedRecord(row)}
          >
            Edit
          </button>

          <button
            className="table-delete-btn"
            onClick={() =>
              deleteFeedRecord(row.feedId)
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
        <input
          name="memberId"
          placeholder="Member ID"
          value={feedData.memberId}
          onChange={handleChange}
        />

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
          name="quantity"
          placeholder="Quantity"
          value={feedData.quantity}
          onChange={handleChange}
        />

        <input
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
          <option>Unpaid</option>
          <option>Paid</option>
          <option>Deducted</option>
        </select>

        <button onClick={saveFeedRecord}>
          {editId ? "Update Feed" : "Save Feed"}
        </button>

        {editId && (
          <button onClick={clearForm}>
            Cancel
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={feedRecords}
        searchPlaceholder="Search feed records..."
      />
    </MainLayout>
  );
}

export default FeedManagement;