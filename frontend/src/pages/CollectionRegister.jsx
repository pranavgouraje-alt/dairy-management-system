import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";

function CollectionRegister() {

  const [collections, setCollections] =
    useState([]);

  const [reportDate, setReportDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

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

  const filteredCollections =
    collections.filter(
      (collection) =>
        collection.collectionDate ===
        reportDate
    );

  return (

    <MainLayout>

      <h1>
        Collection Register
      </h1>

      <input
        type="date"
        value={reportDate}
        onChange={(e) =>
          setReportDate(
            e.target.value
          )
        }
      />

      <table className="member-table">

        <thead>

          <tr>

            <th>ID</th>
            <th>Name</th>
            <th>Milk Type</th>
            <th>Session</th>
            <th>Qty</th>
            <th>Fat</th>
            <th>SNF</th>
            <th>Rate</th>
            <th>Amount</th>

          </tr>

        </thead>

        <tbody>

          {filteredCollections.map(
            (collection, index) => (

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
                  ₹{collection.amount}
                </td>

              </tr>

            )
          )}

        </tbody>

      </table>

    </MainLayout>

  );

}

export default CollectionRegister;