import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { formatAmount }
from "../utils/amountUtils";
import {
  getCollections,
  addCollection,
  updateCollection,
  deleteCollection as deleteCollectionApi,
} from "../services/collectionService";

import { getMembers } from "../services/memberService";

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
    collectionDate: new Date().toISOString().split("T")[0],
  };

  const [rateMaster, setRateMaster] = useState([]);
  const [collectionData, setCollectionData] = useState(emptyForm);
  const [collections, setCollections] = useState([]);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [showPendingModal, setShowPendingModal] = useState(false);

    useEffect(() => {
    loadRateMaster();
    loadMembers();
    loadCollections();
  }, []);

  function loadRateMaster() {
    const savedRates = localStorage.getItem("rateMaster");

    if (savedRates) {
      setRateMaster(JSON.parse(savedRates));
    }
  }

  async function loadMembers() {
    try {
      const result = await getMembers();

      if (result.success) {
        setMembers(result.data);
      }
    } catch (error) {
      console.log(error);
      alert("Backend server is not running for members");
    }
  }

  async function loadCollections() {
    try {
      const result = await getCollections();

      if (result.success) {
        setCollections(result.data);
      }
    } catch (error) {
      console.log(error);
      alert("Backend server is not running for collections");
    }
  }

   const filteredCollections = collections.filter(
    (collection) =>
      collection.collectionDate === collectionData.collectionDate &&
      collection.session === collectionData.session &&
      collection.memberName.toLowerCase().includes(search.toLowerCase())
  );

  const sessionTotalMilk = filteredCollections.reduce(
    (total, collection) => total + Number(collection.quantity),
    0
  );

  const sessionTotalAmount = filteredCollections.reduce(
    (total, collection) => total + Number(collection.amount),
    0
  );

  const sessionCowMilk = filteredCollections
    .filter((collection) => collection.milkType === "Cow")
    .reduce((total, collection) => total + Number(collection.quantity), 0);

  const sessionCowAmount = filteredCollections
    .filter((collection) => collection.milkType === "Cow")
    .reduce((total, collection) => total + Number(collection.amount), 0);

  const sessionBuffaloMilk = filteredCollections
    .filter((collection) => collection.milkType === "Buffalo")
    .reduce((total, collection) => total + Number(collection.quantity), 0);

  const sessionBuffaloAmount = filteredCollections
    .filter((collection) => collection.milkType === "Buffalo")
    .reduce((total, collection) => total + Number(collection.amount), 0);

  const activeMembers = members.filter((member) => member.status !== "Inactive");

  const collectedMemberIds = filteredCollections.map(
    (collection) => collection.memberId
  );

  const uniqueCollectedMemberIds = [...new Set(collectedMemberIds)];

  const completedCount = uniqueCollectedMemberIds.length;

  const pendingMembers = activeMembers.filter(
    (member) => !uniqueCollectedMemberIds.includes(member.memberId)
  );

  const pendingCount = pendingMembers.length;

  function getRate(milkType, fat, snf) {
    const rateRecord = rateMaster.find(
      (rate) =>
        rate.milkType === milkType &&
        rate.fat === fat &&
        rate.snf === snf
    );

    return rateRecord ? Number(rateRecord.rate) : 0;
  }

  function handleChange(e) {
    const updatedData = {
      ...collectionData,
      [e.target.name]: e.target.value,
    };

    const rate = getRate(
      updatedData.milkType,
      updatedData.fat,
      updatedData.snf
    );

    updatedData.rate = rate;
    updatedData.amount = Number(formatAmount( Number(updatedData.quantity || 0) *Number(rate)));
    setCollectionData(updatedData);
  }

  function findMember(memberId) {
    const member = members.find((m) => m.memberId === memberId);

    if (member) {
      setCollectionData((prev) => ({
        ...prev,
        memberId,
        memberName: member.name,
      }));
    }
  }

  function isDuplicateEntry() {
    return collections.some((collection) => {
      if (editId !== null && collection.collectionId === editId) {
        return false;
      }

      return (
        collection.memberId === collectionData.memberId &&
        collection.collectionDate === collectionData.collectionDate &&
        collection.session === collectionData.session &&
        collection.milkType === collectionData.milkType
      );
    });
  }
  async function saveCollection() {
    if (
      !collectionData.memberId ||
      !collectionData.memberName ||
      !collectionData.quantity ||
      !collectionData.fat ||
      !collectionData.snf
    ) {
      alert("Please fill required fields");
      return;
    }

    if (Number(collectionData.quantity) <= 0) {
      alert("Quantity must be greater than zero");
      return;
    }

    if (Number(collectionData.fat) <= 0) {
      alert("Invalid fat value");
      return;
    }

    if (Number(collectionData.snf) <= 0) {
      alert("Invalid SNF value");
      return;
    }

    if (Number(collectionData.rate) === 0) {
      alert("Rate not found");
      return;
    }

    if (isDuplicateEntry()) {
      alert(
        "Collection already exists for this member, date, shift and milk type. Please use Edit."
      );
      return;
    }

    const record = {
      ...collectionData,

      collectionId:
        editId !== null
          ? editId
          : Date.now().toString(),

      collectionTime:
        editId !== null
          ? collectionData.collectionTime ||
            new Date().toLocaleTimeString()
          : new Date().toLocaleTimeString(),

      updatedTime:
        editId !== null
          ? new Date().toLocaleTimeString()
          : "",
    };

    try {
      let result;

      if (editId !== null) {
        result = await updateCollection(editId, record);
      } else {
        result = await addCollection(record);
      }

      if (!result.success) {
        alert(result.message || "Operation failed");
        return;
      }

      alert(result.message);

      await loadCollections();

      setEditId(null);

      setCollectionData({
        ...emptyForm,
        collectionDate: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.log(error);
      alert("Backend server is not running for collections");
    }
  }
   function editCollection(collectionId) {
    const selectedCollection = collections.find(
      (collection) => collection.collectionId === collectionId
    );

    if (selectedCollection) {
      setCollectionData(selectedCollection);
      setEditId(collectionId);
    }
  }

  async function deleteCollection(collectionId) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this collection?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const result = await deleteCollectionApi(collectionId);

      if (!result.success) {
        alert(result.message || "Delete failed");
        return;
      }

      alert(result.message);

      await loadCollections();

      if (editId === collectionId) {
        setEditId(null);

        setCollectionData({
          ...emptyForm,
          collectionDate: new Date().toISOString().split("T")[0],
        });
      }
    } catch (error) {
      console.log(error);
      alert("Backend server is not running for collections");
    }
  }
  return (
    <MainLayout>
      <h1>Milk Collection</h1>

      <div className="collection-form">
        <input
          name="memberId"
          placeholder="Member ID"
          value={collectionData.memberId}
          onChange={(e) => {
            handleChange(e);
            findMember(e.target.value);
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

        <input value={collectionData.rate} readOnly placeholder="Auto Rate" />

        <input value={collectionData.amount} readOnly placeholder="Amount" />

        <button onClick={saveCollection}>
          {editId !== null ? "Update Collection" : "Save Collection"}
        </button>
      </div>

      <div className="session-summary-grid">
        <div className="session-summary-card">
          <h3>🐃 Buffalo Milk</h3>
          <h2>{sessionBuffaloMilk} L</h2>
          <p>₹{sessionBuffaloAmount}</p>
        </div>

        <div className="session-summary-card">
          <h3>🐄 Cow Milk</h3>
          <h2>{sessionCowMilk} L</h2>
          <p>₹{sessionCowAmount}</p>
        </div>

        <div className="session-summary-card">
          <h3>🥛 Total Milk</h3>
          <h2>{sessionTotalMilk} L</h2>
          <p>₹{sessionTotalAmount}</p>
        </div>
      </div>

      <div className="collection-summary-row">
        <div className="collection-mini-card">
          <h3>पूर्ण संकलन</h3>
          <h2>{completedCount}</h2>
        </div>

        <div
          className="collection-mini-card pending-card"
          onClick={() => setShowPendingModal(true)}
        >
          <h3>पेंडिंग संकलन</h3>
          <h2>{pendingCount}</h2>
        </div>
      </div>

      {showPendingModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>Pending Members</h2>

              <button onClick={() => setShowPendingModal(false)}>X</button>
            </div>

            {pendingMembers.length === 0 ? (
              <p>All members completed collection.</p>
            ) : (
              <ul className="pending-list">
                {pendingMembers.map((member) => (
                  <li key={member.memberId}>
                    <strong>{member.memberId}</strong> - {member.name}
                    {member.village ? ` (${member.village})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <hr />

      <input
        className="search-box"
        placeholder="Search Member"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="collection-card-grid compact-card-grid">
        {filteredCollections.length === 0 ? (
          <div className="empty-collection-box">
            No collection entries for selected date and session.
          </div>
        ) : (
          filteredCollections.map((collection) => (
            <div
              className="compact-entry-card"
              key={collection.collectionId}
            >
              <div className="compact-member">
                <div className="member-info">
                  <span className="member-animal-face">
                    {collection.milkType === "Cow" ? "🐮" : "🐃"}
                  </span>

                  <div>
                    <strong>
                      {collection.memberId} - {collection.memberName}
                    </strong>

                    <span>{collection.collectionTime}</span>
                  </div>
                </div>
              </div>

              <span
                className={
                  collection.milkType === "Cow"
                    ? "milk-type-badge cow-badge"
                    : "milk-type-badge buffalo-badge"
                }
              >
                {collection.milkType}
              </span>

              <div className="compact-data">
                <span>Lit</span>
                <strong>{collection.quantity}</strong>
              </div>

              <div className="compact-data">
                <span>Fat</span>
                <strong>{collection.fat}</strong>
              </div>

              <div className="compact-data">
                <span>SNF</span>
                <strong>{collection.snf}</strong>
              </div>

              <div className="compact-data">
                <span>Rate</span>
                <strong>₹{collection.rate}</strong>
              </div>

              <h2 className="compact-amount">₹{collection.amount}</h2>

              <div className="compact-actions">
                <button
                  className="edit-btn"
                  onClick={() => editCollection(collection.collectionId)}
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => deleteCollection(collection.collectionId)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

     
    </MainLayout>
  );
}

export default Collection;