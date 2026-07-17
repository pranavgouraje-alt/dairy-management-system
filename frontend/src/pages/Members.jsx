import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorCard from "../components/ErrorCard";

import {
  getMembers,
  addMember,
  updateMember,
  deleteMember as deleteMemberApi,
} from "../services/memberService";

function Members() {
  const emptyForm = {
    memberId: "",
    name: "",
    mobile: "",
    village: "",
    status: "Active",
  };

  const [formData, setFormData] = useState(emptyForm);
  const [members, setMembers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
  try {
    setLoading(true);
    setError("");

    const result = await getMembers();

    if (result.success) {
      setMembers(result.data || []);
    }
  } catch (error) {
    console.error(error);

    setError(
      error.message ||
        "Unable to load members"
    );
  } finally {
    setLoading(false);
  }
}

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  function clearForm() {
    setFormData(emptyForm);
    setEditId(null);
  }

  async function saveMember() {
    if (!formData.memberId || !formData.name || !formData.mobile) {
      alert("Please fill all required fields");
      return;
    }

    if (formData.mobile.length !== 10) {
      alert("Mobile number must be 10 digits");
      return;
    }

    try {
      let result;

      if (editId) {
        result = await updateMember(editId, formData);
      } else {
        result = await addMember(formData);
      }

      if (!result.success) {
        alert(result.message || "Operation failed");
        return;
      }

      alert(result.message);
      clearForm();
      await loadMembers();
    } catch (error) {
      console.log(error);
      alert("Backend server is not running");
    }
  }

  function editMember(member) {
    setFormData({
      memberId: member.memberId,
      name: member.name,
      mobile: member.mobile,
      village: member.village,
      status: member.status,
    });

    setEditId(member.memberId);
  }

  async function deleteMemberHandler(memberId) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this member?"
    );

    if (!confirmDelete) return;

    try {
      const result = await deleteMemberApi(memberId);

      if (!result.success) {
        alert(result.message || "Delete failed");
        return;
      }

      alert(result.message);

      if (editId === memberId) {
        clearForm();
      }

      await loadMembers();
    } catch (error) {
      console.log(error);
      alert("Backend server is not running");
    }
  }

  const columns = [
    { key: "memberId", label: "Member ID" },
    { key: "name", label: "Member Name" },
    { key: "mobile", label: "Mobile" },
    { key: "village", label: "Village" },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="table-actions">
          <button
            className="table-edit-btn"
            onClick={() => editMember(row)}
          >
            Edit
          </button>

          <button
            className="table-delete-btn"
            onClick={() => deleteMemberHandler(row.memberId)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <h1>Members Management</h1>

      <div className="member-form">
        <input
          name="memberId"
          placeholder="Member ID"
          value={formData.memberId}
          onChange={handleChange}
          disabled={editId !== null}
        />

        <input
          name="name"
          placeholder="Member Name"
          value={formData.name}
          onChange={handleChange}
        />

        <input
          name="mobile"
          placeholder="Mobile Number"
          value={formData.mobile}
          onChange={handleChange}
        />

        <input
          name="village"
          placeholder="Village"
          value={formData.village}
          onChange={handleChange}
        />

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <button onClick={saveMember}>
          {editId ? "Update Member" : "Add Member"}
        </button>

        {editId && <button onClick={clearForm}>Cancel</button>}
      </div>

      {loading ? (
  <LoadingSpinner
    message="Loading members..."
  />
) : error ? (
  <ErrorCard
    title="Members could not be loaded"
    message={error}
    onRetry={loadMembers}
  />
) : (
  <DataTable
    columns={columns}
    data={members}
    searchPlaceholder="Search members..."
  />
)}
    </MainLayout>
  );
}

export default Members;