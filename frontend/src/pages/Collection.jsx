import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";

function Collection() {

  const emptyForm = {
    memberId: "",
    memberName: "",
    milkType: "Cow",
    session: "Morning",
    quantity: "",
    fat: "",
    snf: "",
    rate: "",
    amount: 0,
    collectionDate: new Date()
      .toISOString()
      .split("T")[0]
  };

  const [collectionData, setCollectionData] =
    useState(emptyForm);

  const [collections, setCollections] =
    useState([]);

  const [members, setMembers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [editIndex, setEditIndex] =
    useState(null);

  // Load Members
  useEffect(() => {

    const savedMembers =
      localStorage.getItem("members");

    if (savedMembers) {

      setMembers(
        JSON.parse(savedMembers)
      );

    }

  }, []);

  // Load Collections
  useEffect(() => {

    const savedCollections =
      localStorage.getItem(
        "collections"
      );

    if (savedCollections) {

      setCollections(
        JSON.parse(savedCollections)
      );

    }

  }, []);

  // Save Collections
  useEffect(() => {

    localStorage.setItem(
      "collections",
      JSON.stringify(collections)
    );

  }, [collections]);

  function handleChange(e) {

    const updatedData = {

      ...collectionData,

      [e.target.name]: e.target.value

    };

    if (
      e.target.name === "quantity" ||
      e.target.name === "rate"
    ) {

      const quantity =
        Number(updatedData.quantity);

      const rate =
        Number(updatedData.rate);

      updatedData.amount =
        quantity * rate;
    }

    setCollectionData(updatedData);
  }

  function findMember(memberId) {

    const member = members.find(
      (m) => m.memberId === memberId
    );

    if (member) {

      setCollectionData((prev) => ({
        ...prev,
        memberId,
        memberName: member.name
      }));

    }

  }

  function saveCollection() {

    if (
      !collectionData.memberId ||
      !collectionData.memberName ||
      !collectionData.quantity ||
      !collectionData.rate
    ) {

      alert(
        "Please fill required fields"
      );

      return;
    }

    const record = {

      ...collectionData,

      collectionTime:
        new Date()
          .toLocaleTimeString()

    };

    if (editIndex !== null) {

      const updatedCollections =
        [...collections];

      updatedCollections[
        editIndex
      ] = record;

      setCollections(
        updatedCollections
      );

      setEditIndex(null);

    } else {

      setCollections([
        ...collections,
        record
      ]);

    }

    setCollectionData({
      ...emptyForm,
      collectionDate:
        new Date()
          .toISOString()
          .split("T")[0]
    });

  }

  function editCollection(index) {

    setCollectionData(
      collections[index]
    );

    setEditIndex(index);

  }

  function deleteCollection(index) {

    const updatedCollections =
      collections.filter(
        (_, i) => i !== index
      );

    setCollections(
      updatedCollections
    );

  }

  const filteredCollections =
    collections.filter(
      (collection) =>
        collection.memberName
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  return (

    <MainLayout>

      <h1>
        Milk Collection
      </h1>

      <div className="collection-form">

        <input
          name="memberId"
          placeholder="Member ID"
          value={collectionData.memberId}
          onChange={(e) => {

            handleChange(e);

            findMember(
              e.target.value
            );

          }}
        />

        <input
          name="memberName"
          placeholder="Member Name"
          value={collectionData.memberName}
          onChange={handleChange}
        />

        <select
          name="milkType"
          value={collectionData.milkType}
          onChange={handleChange}
        >
          <option>Cow</option>
          <option>Buffalo</option>
        </select>

        <select
          name="session"
          value={collectionData.session}
          onChange={handleChange}
        >
          <option>Morning</option>
          <option>Evening</option>
        </select>

        <input
          type="date"
          name="collectionDate"
          value={collectionData.collectionDate}
          onChange={handleChange}
        />

        <input
          name="quantity"
          placeholder="Quantity"
          value={collectionData.quantity}
          onChange={handleChange}
        />

        <input
          name="fat"
          placeholder="Fat"
          value={collectionData.fat}
          onChange={handleChange}
        />

        <input
          name="snf"
          placeholder="SNF"
          value={collectionData.snf}
          onChange={handleChange}
        />

        <input
          name="rate"
          placeholder="Rate"
          value={collectionData.rate}
          onChange={handleChange}
        />

        <input
          value={collectionData.amount}
          readOnly
          placeholder="Amount"
        />

        <button
          onClick={saveCollection}
        >
          {editIndex !== null
            ? "Update Collection"
            : "Save Collection"}
        </button>

      </div>

      <hr />

      <input
        className="search-box"
        placeholder="Search Member"
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
      />

      <table className="member-table">

        <thead>

          <tr>

            <th>ID</th>
            <th>Name</th>
            <th>Date</th>
            <th>Time</th>
            <th>Type</th>
            <th>Session</th>
            <th>Qty</th>
            <th>Fat</th>
            <th>SNF</th>
            <th>Rate</th>
            <th>Amount</th>
            <th>Action</th>

          </tr>

        </thead>

        <tbody>

          {filteredCollections.map(
            (
              collection,
              index
            ) => (

              <tr key={index}>

                <td>
                  {collection.memberId}
                </td>

                <td>
                  {collection.memberName}
                </td>

                <td>
                  {collection.collectionDate}
                </td>

                <td>
                  {collection.collectionTime}
                </td>

                <td>
                  {collection.milkType}
                </td>

                <td>
                  {collection.session}
                </td>

                <td>
                  {collection.quantity}
                </td>

                <td>
                  {collection.fat}
                </td>

                <td>
                  {collection.snf}
                </td>

                <td>
                  {collection.rate}
                </td>

                <td>
                  ₹{collection.amount}
                </td>

                <td>

                  <button
                    onClick={() =>
                      editCollection(index)
                    }
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      deleteCollection(index)
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

export default Collection;