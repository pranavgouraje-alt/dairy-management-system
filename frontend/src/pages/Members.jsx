import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";

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

  useEffect(() => {
    const savedMembers = localStorage.getItem("members");

    if (savedMembers) {
      setMembers(JSON.parse(savedMembers));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "members",
      JSON.stringify(members)
    );
  }, [members]);

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

  function saveMember() {
    if (
      !formData.memberId ||
      !formData.name ||
      !formData.mobile
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (formData.mobile.length !== 10) {
      alert("Mobile number must be 10 digits");
      return;
    }

    const duplicateMember = members.find(
      (member) =>
        member.memberId === formData.memberId &&
        member.memberId !== editId
    );

    if (duplicateMember) {
      alert("Member ID already exists");
      return;
    }

    if (editId) {
      const updatedMembers = members.map((member) =>
        member.memberId === editId
          ? {
              ...formData,
              memberId: editId,
            }
          : member
      );

      setMembers(updatedMembers);
    } else {
      setMembers([...members, formData]);
    }

    clearForm();
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

  function deleteMember(memberId) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this member?"
    );

    if (!confirmDelete) {
      return;
    }

    const updatedMembers = members.filter(
      (member) => member.memberId !== memberId
    );

    setMembers(updatedMembers);

    if (editId === memberId) {
      clearForm();
    }
  }

  const columns = [
    {
      key: "memberId",
      label: "Member ID",
    },
    {
      key: "name",
      label: "Member Name",
    },
    {
      key: "mobile",
      label: "Mobile",
    },
    {
      key: "village",
      label: "Village",
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
            onClick={() => editMember(row)}
          >
            Edit
          </button>

          <button
            className="table-delete-btn"
            onClick={() =>
              deleteMember(row.memberId)
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

        {editId && (
          <button onClick={clearForm}>
            Cancel
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={members}
        searchPlaceholder="Search members..."
      />
    </MainLayout>
  );
}

export default Members;