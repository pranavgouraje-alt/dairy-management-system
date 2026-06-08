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
  const [rateMaster, setRateMaster] =
    useState([]);

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

 /* const [selectedDate, setSelectedDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [selectedSession, setSelectedSession] =
    useState("Morning");*/

  const filteredCollections =
    collections.filter(
      (collection) =>

        collection.collectionDate ===
        collectionData.collectionDate &&

        collection.session ===
        collectionData.session &&

        collection.memberName
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  useEffect(() => {

    const savedRates =
      localStorage.getItem(
        "rateMaster"
      );

    if (savedRates) {

      setRateMaster(
        JSON.parse(savedRates)
      );

    }

  }, []);

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

      [e.target.name]:
        e.target.value

    };

    const rate =
      getRate(

        updatedData.milkType,

        updatedData.fat,

        updatedData.snf

      );

    updatedData.rate =
      rate;

    updatedData.amount =

      Number(
        updatedData.quantity || 0
      ) * rate;

    setCollectionData(
      updatedData
    );

  }

  function getRate(
    milkType,
    fat,
    snf
  ) {

    const rateRecord =
      rateMaster.find(

        (rate) =>

          rate.milkType === milkType &&

          rate.fat === fat &&

          rate.snf === snf

      );

    return rateRecord
      ? Number(rateRecord.rate)
      : 0;

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
      !collectionData.quantity
    ) {

      alert(
        "Please fill required fields"
      );

      return;

    }

    if (
      collectionData.rate === 0
    ) {

      alert(
        "Rate not found"
      );

      return;

    }
    if (isDuplicateEntry()) {

      alert(
        "Collection already exists for this member, date, shift and milk type."
      );
      if (
        Number(
          collectionData.quantity
        ) <= 0
      ) {

        alert(
          "Quantity must be greater than zero"
        );

        return;

      }

      if (
        Number(
          collectionData.fat
        ) <= 0
      ) {

        alert(
          "Invalid fat value"
        );

        return;

      }

      if (
        Number(
          collectionData.snf
        ) <= 0
      ) {

        alert(
          "Invalid SNF value"
        );

        return;

      }
      return;



    }

    const record = {

      collectionId:
        Date.now(),

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



  // VALIDATIONS 
  function isDuplicateEntry() {

    return collections.some(

      (collection, index) => {

        if (
          editIndex !== null &&
          index === editIndex
        ) {
          return false;
        }

        return (

          collection.memberId ===
          collectionData.memberId &&

          collection.collectionDate ===
          collectionData.collectionDate &&

          collection.session ===
          collectionData.session &&

          collection.milkType ===
          collectionData.milkType

        );
      }

    );

  }




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
          value={collectionData.rate}
          readOnly
          placeholder="Auto Rate"
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