import { useState } from "react";
import MainLayout from "../layouts/MainLayout";

function Collection() {

  const [collectionData, setCollectionData] =
    useState({

      memberId: "",

      memberName: "",

      milkType: "Cow",

      session: "Morning",

      quantity: "",

      fat: "",

      snf: "",

      rate: "",

      amount: 0

    });

  const [collections, setCollections] =
    useState([]);

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
        Number(
          updatedData.quantity
        );

      const rate =
        Number(
          updatedData.rate
        );

      updatedData.amount =
        quantity * rate;
    }

    setCollectionData(
      updatedData
    );
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

    setCollections([
      ...collections,
      collectionData
    ]);

    setCollectionData({

      memberId: "",

      memberName: "",

      milkType: "Cow",

      session: "Morning",

      quantity: "",

      fat: "",

      snf: "",

      rate: "",

      amount: 0

    });

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
          onChange={handleChange}
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
          Save Collection
        </button>

      </div>

      <hr />

      <table
        className="member-table"
      >

        <thead>

          <tr>

            <th>Member</th>

            <th>Name</th>

            <th>Type</th>

            <th>Session</th>

            <th>Qty</th>

            <th>Fat</th>

            <th>SNF</th>

            <th>Rate</th>

            <th>Amount</th>

          </tr>

        </thead>

        <tbody>

          {collections.map(
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
                  ₹
                  {collection.amount}
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