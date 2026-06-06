import { useState } from "react";
import MainLayout from "../layouts/MainLayout";

function Members() {

  // Form State
  const [formData, setFormData] = useState({
    memberId: "",
    name: "",
    mobile: "",
    village: "",
    status: "Active"
  });

  // Members List
  const [members, setMembers] = useState([]);

  // Search Box State
  const [search, setSearch] = useState("");

  // Track Editing Record
  const [editIndex, setEditIndex] = useState(null);

  // Handle Input Changes
  function handleChange(e) {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  }

  // Add or Update Member
  function saveMember() {

    // Validation
    if (
      !formData.memberId ||
      !formData.name ||
      !formData.mobile
    ) {
      alert("Please fill required fields");
      return;
    }

    // Update Existing Member
    if (editIndex !== null) {

      const updatedMembers = [...members];

      updatedMembers[editIndex] = formData;

      setMembers(updatedMembers);

      setEditIndex(null);

    }
    // Add New Member
    else {

      setMembers([
        ...members,
        formData
      ]);

    }

    // Reset Form
    setFormData({
      memberId: "",
      name: "",
      mobile: "",
      village: "",
      status: "Active"
    });

  }

  // Edit Member
  function editMember(index) {

    setFormData(members[index]);

    setEditIndex(index);

  }

  // Delete Member
  function deleteMember(index) {

    const updatedMembers =
      members.filter(
        (_, i) => i !== index
      );

    setMembers(updatedMembers);

  }

  // Search Filter
  const filteredMembers =
    members.filter((member) =>
      member.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <MainLayout>

      <h1>Members Management</h1>

      {/* Form Section */}
      <div className="member-form">

        <input
          name="memberId"
          placeholder="Member ID"
          value={formData.memberId}
          onChange={handleChange}
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
          {
            editIndex !== null
              ? "Update Member"
              : "Add Member"
          }
        </button>

      </div>

      <hr />

      {/* Search Box */}
      <input
        className="search-box"
        placeholder="Search Member"
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

      {/* Members Table */}
      <table className="member-table">

        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Mobile</th>
            <th>Village</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {filteredMembers.map(
            (member, index) => (

            <tr key={index}>

              <td>{member.memberId}</td>

              <td>{member.name}</td>

              <td>{member.mobile}</td>

              <td>{member.village}</td>

              <td>

                <span
                  className={
                    member.status === "Active"
                      ? "active-badge"
                      : "inactive-badge"
                  }
                >
                  {member.status}
                </span>

              </td>

              <td>

                <button
                  onClick={() =>
                    editMember(index)
                  }
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    deleteMember(index)
                  }
                >
                  Delete
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </MainLayout>
  );
}

export default Members;