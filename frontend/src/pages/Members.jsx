import { useState } from "react";
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

  function handleChange(e) {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  }

  function addMember() {

    if (
      !formData.memberId ||
      !formData.name ||
      !formData.mobile
    ) {
      alert("Please fill required fields");
      return;
    }

    setMembers([
      ...members,
      formData
    ]);

    setFormData({
      memberId: "",
      name: "",
      mobile: "",
      village: "",
      status: "Active"
    });
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
        .includes(search.toLowerCase())
    );

  return (
    <MainLayout>

      <h1>Members Management</h1>

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

        <button onClick={addMember}>
          Add Member
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

            <tr key={index}>

              <td>{member.memberId}</td>

              <td>{member.name}</td>

              <td>{member.mobile}</td>

              <td>{member.village}</td>

              <td>{member.status}</td>

              <td>

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