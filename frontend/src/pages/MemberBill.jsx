import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";

function MemberBill() {
    const [members, setMembers] = useState([]);
    const [billCollections, setCollections] = useState([]);

    const [selectedMemberId, setSelectedMemberId] = useState("");

    const [fromDate, setFromDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [toDate, setToDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    useEffect(() => {
        const savedMembers = localStorage.getItem("members");
        const savedCollections = localStorage.getItem("collections");

        if (savedMembers) {
            setMembers(JSON.parse(savedMembers));
        }

        if (savedCollections) {
            setCollections(JSON.parse(savedCollections));
        }
    }, []);

    const selectedMember =
        members.find(
            (member) =>
                member.memberId === selectedMemberId
        );

    const morningCollections =
        billCollections.filter(
            (collection) =>
                collection.session === "Morning"
        );

    const eveningCollections =
        billCollections.filter(
            (collection) =>
                collection.session === "Evening"
        );

    const cowMilk =
        billCollections
            .filter(
                (collection) =>
                    collection.milkType === "Cow"
            )
            .reduce(
                (total, collection) =>
                    total + Number(collection.quantity),
                0
            );

    const buffaloMilk =
        billCollections
            .filter(
                (collection) =>
                    collection.milkType === "Buffalo"
            )
            .reduce(
                (total, collection) =>
                    total + Number(collection.quantity),
                0
            );

    const totalMilk =
        cowMilk + buffaloMilk;

    const totalAmount =
        billCollections.reduce(
            (total, collection) =>
                total + Number(collection.amount),
            0
        );

    return (
        <MainLayout>
            <h1>Member Bill Report</h1>

            <div className="collection-form">
                <select
                    value={selectedMemberId}
                    onChange={(e) =>
                        setSelectedMemberId(e.target.value)
                    }
                >
                    <option value="">
                        Select Member
                    </option>

                    {members.map((member) => (
                        <option
                            key={member.memberId}
                            value={member.memberId}
                        >
                            {member.memberId} - {member.name}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    value={fromDate}
                    onChange={(e) =>
                        setFromDate(e.target.value)
                    }
                />

                <input
                    type="date"
                    value={toDate}
                    onChange={(e) =>
                        setToDate(e.target.value)
                    }
                />
            </div>

            {selectedMemberId && (
                <div className="bill-box">
                    <div className="bill-header">
                        <h2>Milk Bill</h2>

                        <p>
                            <strong>Member:</strong>{" "}
                            {selectedMember?.memberId} - {selectedMember?.name}
                        </p>

                        <p>
                            <strong>Period:</strong>{" "}
                            {fromDate} to {toDate}
                        </p>
                    </div>

                    <div className="bill-session-container">

                        <div className="bill-session-box">

                            <h3>
                                🌅 Morning Session
                            </h3>

                            <table className="member-table">

                                <thead>

                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Lit</th>
                                        <th>Fat</th>
                                        <th>SNF</th>
                                        <th>Amount</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {morningCollections.map(
                                        (collection) => (

                                            <tr
                                                key={collection.collectionId}
                                            >
                                                <td>
                                                    {collection.collectionDate}
                                                </td>

                                                <td>
                                                    {collection.milkType}
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
                                                    ₹{collection.amount}
                                                </td>
                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                        <div className="bill-session-box">

                            <h3>
                                🌙 Evening Session
                            </h3>

                            <table className="member-table">

                                <thead>

                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Lit</th>
                                        <th>Fat</th>
                                        <th>SNF</th>
                                        <th>Amount</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {eveningCollections.map(
                                        (collection) => (

                                            <tr
                                                key={collection.collectionId}
                                            >
                                                <td>
                                                    {collection.collectionDate}
                                                </td>

                                                <td>
                                                    {collection.milkType}
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
                                                    ₹{collection.amount}
                                                </td>
                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                    <div className="bill-summary">
                        <p>
                            <strong>Cow Milk:</strong> {cowMilk} L
                        </p>

                        <p>
                            <strong>Buffalo Milk:</strong> {buffaloMilk} L
                        </p>

                        <p>
                            <strong>Total Milk:</strong> {totalMilk} L
                        </p>

                        <p>
                            <strong>Total Amount:</strong> ₹{totalAmount}
                        </p>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

export default MemberBill;