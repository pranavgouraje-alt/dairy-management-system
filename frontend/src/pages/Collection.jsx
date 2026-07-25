import {
  useEffect,
  useMemo,
  useState,
} from "react";

import MainLayout from "../layouts/MainLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorCard from "../components/ErrorCard";

import {
  formatAmount,
} from "../utils/amountUtils";

import {
  getCollections,
  addCollection,
  updateCollection,
  deleteCollection as deleteCollectionApi,
} from "../services/collectionService";

import {
  getMembers,
} from "../services/memberService";

import {
  getRates,
} from "../services/rateService";

function getTodayDate() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

function Collection() {
  const emptyForm = {
    memberId: "",
    memberName: "",
    milkType: "Cow",
    session: "Morning",
    collectionDate:
      getTodayDate(),
    quantity: "",
    fat: "",
    snf: "8.5",
    rate: "",
    amount: 0,
  };

  const [
    collectionData,
    setCollectionData,
  ] = useState(emptyForm);

  const [
    collections,
    setCollections,
  ] = useState([]);

  const [members, setMembers] =
    useState([]);

  const [rates, setRates] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [editId, setEditId] =
    useState(null);

  const [
    showPendingModal,
    setShowPendingModal,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const [
        collectionResult,
        memberResult,
        rateResult,
      ] = await Promise.all([
        getCollections(),
        getMembers(),
        getRates(),
      ]);

      setCollections(
        collectionResult.data || []
      );

      setMembers(
        memberResult.data || []
      );

      setRates(
        rateResult.data || []
      );
    } catch (error) {
      console.error(
        "Collection page loading error:",
        error
      );

      setError(
        error.message ||
          "Unable to load collection page"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCollections() {
    try {
      const result =
        await getCollections();

      setCollections(
        result.data || []
      );
    } catch (error) {
      console.error(
        "Load collections error:",
        error
      );

      setError(
        error.message ||
          "Unable to load collections"
      );
    }
  }

  function calculateRate(
    milkType,
    fat,
    snf
  ) {
    const matchingRate =
      rates.find(
        (rate) =>
          rate.status === "Active" &&
          rate.milkType ===
            milkType &&
          Number(rate.fat) ===
            Number(fat) &&
          Number(rate.snf) ===
            Number(snf)
      );

    return matchingRate
      ? Number(
          matchingRate.rate
        )
      : 0;
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    const nextData = {
      ...collectionData,
      [name]: value,
    };

    if (
      name === "milkType"
    ) {
      nextData.snf =
        value === "Buffalo"
          ? "9.0"
          : "8.5";
    }

    const matchingRate =
      calculateRate(
        nextData.milkType,
        nextData.fat,
        nextData.snf
      );

    nextData.rate =
      matchingRate > 0
        ? String(matchingRate)
        : "";

    nextData.amount = Number(
      (
        Number(
          nextData.quantity || 0
        ) * matchingRate
      ).toFixed(2)
    );

    setCollectionData(nextData);
  }

  function handleMemberChange(
    event
  ) {
    const memberId =
      event.target.value;

    const selectedMember =
      members.find(
        (member) =>
          String(
            member.memberId
          ) === String(memberId)
      );

    setCollectionData(
      (previous) => ({
        ...previous,
        memberId,

        memberName:
          selectedMember?.name ||
          "",
      })
    );
  }

  function clearForm() {
    setCollectionData({
      ...emptyForm,
      collectionDate:
        collectionData.collectionDate,
      session:
        collectionData.session,
      milkType:
        collectionData.milkType,
      snf:
        collectionData.milkType ===
        "Buffalo"
          ? "9.0"
          : "8.5",
    });

    setEditId(null);
  }

  const filteredCollections =
    useMemo(() => {
      return collections.filter(
        (collection) => {
          const matchesDate =
            collection.collectionDate ===
            collectionData.collectionDate;

          const matchesSession =
            collection.session ===
            collectionData.session;

          const text =
            `${collection.memberId} ${collection.memberName}`
              .toLowerCase();

          const matchesSearch =
            text.includes(
              search.toLowerCase()
            );

          return (
            matchesDate &&
            matchesSession &&
            matchesSearch
          );
        }
      );
    }, [
      collections,
      collectionData.collectionDate,
      collectionData.session,
      search,
    ]);

  const sessionTotals =
    useMemo(() => {
      return filteredCollections.reduce(
        (result, collection) => {
          const quantity =
            Number(
              collection.quantity || 0
            );

          const amount =
            Number(
              collection.amount || 0
            );

          result.totalMilk +=
            quantity;

          result.totalAmount +=
            amount;

          if (
            collection.milkType ===
            "Cow"
          ) {
            result.cowMilk +=
              quantity;

            result.cowAmount +=
              amount;
          } else {
            result.buffaloMilk +=
              quantity;

            result.buffaloAmount +=
              amount;
          }

          return result;
        },
        {
          totalMilk: 0,
          totalAmount: 0,
          cowMilk: 0,
          cowAmount: 0,
          buffaloMilk: 0,
          buffaloAmount: 0,
        }
      );
    }, [filteredCollections]);

  const activeMembers =
    useMemo(
      () =>
        members.filter(
          (member) =>
            member.status !==
            "Inactive"
        ),
      [members]
    );

  const collectedMemberIds =
    useMemo(
      () =>
        new Set(
          filteredCollections.map(
            (collection) =>
              String(
                collection.memberId
              )
          )
        ),
      [filteredCollections]
    );

  const completedCount =
    collectedMemberIds.size;

  const pendingMembers =
    activeMembers.filter(
      (member) =>
        !collectedMemberIds.has(
          String(member.memberId)
        )
    );

  const pendingCount =
    pendingMembers.length;

  function validateForm() {
    if (
      !collectionData.memberId ||
      !collectionData.memberName ||
      !collectionData.collectionDate ||
      !collectionData.quantity ||
      !collectionData.fat ||
      !collectionData.snf
    ) {
      alert(
        "Please fill all required collection fields"
      );

      return false;
    }

    if (
      Number(
        collectionData.quantity
      ) <= 0
    ) {
      alert(
        "Quantity must be greater than zero"
      );

      return false;
    }

    if (
      Number(collectionData.fat) <=
      0
    ) {
      alert(
        "FAT must be greater than zero"
      );

      return false;
    }

    if (
      Number(collectionData.snf) <=
      0
    ) {
      alert(
        "SNF must be greater than zero"
      );

      return false;
    }

    if (
      Number(collectionData.rate) <=
      0
    ) {
      alert(
        "No active rate exists for this milk type, FAT and SNF. Add the rate in Rate Master first."
      );

      return false;
    }

    return true;
  }

  async function saveCollection() {
    if (!validateForm()) {
      return;
    }

    const payload = {
      memberId:
        String(
          collectionData.memberId
        ),

      memberName:
        collectionData.memberName,

      milkType:
        collectionData.milkType,

      session:
        collectionData.session,

      collectionDate:
        collectionData.collectionDate,

      quantity:
        Number(
          collectionData.quantity
        ),

      fat:
        Number(collectionData.fat),

      snf:
        Number(collectionData.snf),

      rate:
        Number(collectionData.rate),

      amount:
        Number(
          collectionData.amount
        ),
    };

    try {
      setSaving(true);

      const result =
        editId !== null
          ? await updateCollection(
              editId,
              payload
            )
          : await addCollection(
              payload
            );

      alert(
        result.message ||
          "Collection saved successfully"
      );

      clearForm();

      await loadCollections();
    } catch (error) {
      console.error(
        "Save collection error:",
        error
      );

      alert(
        error.message ||
          "Unable to save collection"
      );
    } finally {
      setSaving(false);
    }
  }

  function editCollection(
    collectionId
  ) {
    const selectedCollection =
      collections.find(
        (item) =>
          String(
            item.collectionId
          ) ===
          String(collectionId)
      );

    if (!selectedCollection) {
      alert(
        "Collection record not found"
      );

      return;
    }

    setCollectionData({
      memberId:
        selectedCollection.memberId,

      memberName:
        selectedCollection.memberName,

      milkType:
        selectedCollection.milkType,

      session:
        selectedCollection.session,

      collectionDate:
        selectedCollection.collectionDate,

      quantity:
        String(
          selectedCollection.quantity
        ),

      fat:
        String(
          selectedCollection.fat
        ),

      snf:
        String(
          selectedCollection.snf
        ),

      rate:
        String(
          selectedCollection.rate
        ),

      amount:
        Number(
          selectedCollection.amount
        ),
    });

    setEditId(
      selectedCollection.collectionId
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteCollection(
    collectionId
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this collection?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const result =
        await deleteCollectionApi(
          collectionId
        );

      alert(
        result.message ||
          "Collection deleted successfully"
      );

      if (
        String(editId) ===
        String(collectionId)
      ) {
        clearForm();
      }

      await loadCollections();
    } catch (error) {
      console.error(
        "Delete collection error:",
        error
      );

      alert(
        error.message ||
          "Unable to delete collection"
      );
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner
          message="Loading milk collections..."
        />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <ErrorCard
          title="Collection page could not be loaded"
          message={error}
          onRetry={loadInitialData}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="collection-page">
        <div className="page-heading">
          <div>
            <span className="page-eyebrow">
              Daily Operations
            </span>

            <h1>Milk Collection</h1>

            <p>
              Record and manage daily cow
              and buffalo milk entries.
            </p>
          </div>
        </div>

        <section className="collection-entry-panel">
          <div className="collection-form">
            <select
              name="memberId"
              value={
                collectionData.memberId
              }
              onChange={
                handleMemberChange
              }
            >
              <option value="">
                Select Member
              </option>

              {activeMembers.map(
                (member) => (
                  <option
                    key={
                      member.memberId
                    }
                    value={
                      member.memberId
                    }
                  >
                    {member.memberId} -{" "}
                    {member.name}
                  </option>
                )
              )}
            </select>

            <input
              name="memberName"
              placeholder="Member Name"
              value={
                collectionData.memberName
              }
              readOnly
            />

            <select
              name="milkType"
              value={
                collectionData.milkType
              }
              onChange={handleChange}
            >
              <option value="Cow">
                Cow
              </option>

              <option value="Buffalo">
                Buffalo
              </option>
            </select>

            <select
              name="session"
              value={
                collectionData.session
              }
              onChange={handleChange}
            >
              <option value="Morning">
                Morning
              </option>

              <option value="Evening">
                Evening
              </option>
            </select>

            <input
              type="date"
              name="collectionDate"
              value={
                collectionData.collectionDate
              }
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.01"
              min="0"
              name="quantity"
              placeholder="Quantity"
              value={
                collectionData.quantity
              }
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.1"
              min="0"
              name="fat"
              placeholder="FAT"
              value={
                collectionData.fat
              }
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.1"
              min="0"
              name="snf"
              placeholder="SNF"
              value={
                collectionData.snf
              }
              onChange={handleChange}
            />

            <input
              value={
                collectionData.rate
              }
              readOnly
              placeholder="Auto Rate"
            />

            <input
              value={formatAmount(
                collectionData.amount
              )}
              readOnly
              placeholder="Amount"
            />

            <button
              type="button"
              onClick={saveCollection}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editId !== null
                  ? "Update Collection"
                  : "Save Collection"}
            </button>

            {editId !== null && (
              <button
                type="button"
                className="cancel-btn"
                onClick={clearForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>

          {collectionData.fat &&
            collectionData.snf &&
            !collectionData.rate && (
              <p className="rate-warning">
                No matching active rate
                found. Add it in Rate
                Master.
              </p>
            )}
        </section>

        <div className="session-summary-grid">
          <div className="session-summary-card">
            <h3>🐃 Buffalo Milk</h3>

            <h2>
              {formatAmount(
                sessionTotals.buffaloMilk
              )}{" "}
              L
            </h2>

            <p>
              ₹
              {formatAmount(
                sessionTotals.buffaloAmount
              )}
            </p>
          </div>

          <div className="session-summary-card">
            <h3>🐄 Cow Milk</h3>

            <h2>
              {formatAmount(
                sessionTotals.cowMilk
              )}{" "}
              L
            </h2>

            <p>
              ₹
              {formatAmount(
                sessionTotals.cowAmount
              )}
            </p>
          </div>

          <div className="session-summary-card">
            <h3>🥛 Total Milk</h3>

            <h2>
              {formatAmount(
                sessionTotals.totalMilk
              )}{" "}
              L
            </h2>

            <p>
              ₹
              {formatAmount(
                sessionTotals.totalAmount
              )}
            </p>
          </div>
        </div>

        <div className="collection-summary-row">
          <div className="collection-mini-card">
            <h3>पूर्ण संकलन</h3>
            <h2>{completedCount}</h2>
          </div>

          <button
            type="button"
            className="collection-mini-card pending-card"
            onClick={() =>
              setShowPendingModal(true)
            }
          >
            <h3>पेंडिंग संकलन</h3>
            <h2>{pendingCount}</h2>
          </button>
        </div>

        {showPendingModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                <h2>
                  Pending Members
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setShowPendingModal(
                      false
                    )
                  }
                >
                  ×
                </button>
              </div>

              {pendingMembers.length ===
              0 ? (
                <p>
                  All active members have
                  completed collection.
                </p>
              ) : (
                <ul className="pending-list">
                  {pendingMembers.map(
                    (member) => (
                      <li
                        key={
                          member.memberId
                        }
                      >
                        <strong>
                          {
                            member.memberId
                          }
                        </strong>{" "}
                        - {member.name}

                        {member.village
                          ? ` (${member.village})`
                          : ""}
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="collection-register-heading">
          <div>
            <span>
              Current Session
            </span>

            <h2>
              Collection Entries
            </h2>
          </div>

          <input
            className="search-box"
            placeholder="Search member..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        <div className="collection-card-grid compact-card-grid">
          {filteredCollections.length ===
          0 ? (
            <div className="empty-collection-box">
              No collection entries for
              selected date and session.
            </div>
          ) : (
            filteredCollections.map(
              (collection) => (
                <div
                  className="compact-entry-card"
                  key={
                    collection.collectionId
                  }
                >
                  <div className="compact-member">
                    <div className="member-info">
                      <span className="member-animal-face">
                        {collection.milkType ===
                        "Cow"
                          ? "🐮"
                          : "🐃"}
                      </span>

                      <div>
                        <strong>
                          {
                            collection.memberId
                          }{" "}
                          -{" "}
                          {
                            collection.memberName
                          }
                        </strong>

                        <span>
                          {
                            collection.collectionTime
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={
                      collection.milkType ===
                      "Cow"
                        ? "milk-type-badge cow-badge"
                        : "milk-type-badge buffalo-badge"
                    }
                  >
                    {collection.milkType}
                  </span>

                  <div className="compact-data">
                    <span>Lit</span>

                    <strong>
                      {formatAmount(
                        collection.quantity
                      )}
                    </strong>
                  </div>

                  <div className="compact-data">
                    <span>FAT</span>
                    <strong>
                      {collection.fat}
                    </strong>
                  </div>

                  <div className="compact-data">
                    <span>SNF</span>
                    <strong>
                      {collection.snf}
                    </strong>
                  </div>

                  <div className="compact-data">
                    <span>Rate</span>

                    <strong>
                      ₹
                      {formatAmount(
                        collection.rate
                      )}
                    </strong>
                  </div>

                  <h2 className="compact-amount">
                    ₹
                    {formatAmount(
                      collection.amount
                    )}
                  </h2>

                  <div className="compact-actions">
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() =>
                        editCollection(
                          collection.collectionId
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() =>
                        deleteCollection(
                          collection.collectionId
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default Collection;