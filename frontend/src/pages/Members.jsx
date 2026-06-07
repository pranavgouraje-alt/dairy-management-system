import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";

function Members() {

  const [formData, setFormData] = useState({
    memberId: "",
    name: "",
    mobile: "",
    village: "",
    status: "Active"
  });

  const [members, setMembers] = useState([]);

  const [search, setSearch] = useState("");

  const [editIndex, setEditIndex] = useState(null);

  // Load members from Local Storage when page loads
  useEffect(() => {

    const savedMembers =
      localStorage.getItem("members");

    if (savedMembers) {

      setMembers(
        JSON.parse(savedMembers)
      );

    }

  }, []);

  // Save members whenever members array changes
  useEffect(() => {

    localStorage.setItem(
      "members",
      JSON.stringify(members)
    );

  }, [members]);

  function handleChange(e) {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  }

  function saveMember() {

    // Required Field Validation
    if (
      !formData.memberId ||
      !formData.name ||
      !formData.mobile
    ) {

      alert("Please fill all required fields");

      return;
    }

    // Mobile Validation
    if (formData.mobile.length !== 10) {

      alert(
        "Mobile number must be 10 digits"
      );

      return;
    }

    // Duplicate Check (only while adding)
    if (editIndex === null) {

      const duplicateMember =
        members.find(
          (member) =>
            member.memberId ===
            formData.memberId
        );

      if (duplicateMember) {

        alert(
          "Member ID already exists"
        );

        return;
      }

    }

    // Edit Existing Member
    if (editIndex !== null) {

      const updatedMembers =
        [...members];

      updatedMembers[editIndex] =
        formData;

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

  function editMember(index) {

    setFormData(
      members[index]
    );

    setEditIndex(index);

  }

  function deleteMember(index) {

    const updatedMembers =
      members.filter(
        (_, i) => i !== index
      );

    setMembers(updatedMembers);

  }

  const filteredMembers =
    members.filter((member) =>
      member.name
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  return (
    <MainLayout>

      <h1>
        Members Management
      </h1>

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

      <input
        className="search-box"
        placeholder="Search Member"
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

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

              <tr
                key={
                  member.memberId
                }
              >

                <td>
                  {member.memberId}
                </td>

                <td>
                  {member.name}
                </td>

                <td>
                  {member.mobile}
                </td>

                <td>
                  {member.village}
                </td>

                <td>

                  <span
                    className={
                      member.status ===
                      "Active"
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

            )
          )}

        </tbody>

      </table>

    </MainLayout>
  );
}

export default Members;