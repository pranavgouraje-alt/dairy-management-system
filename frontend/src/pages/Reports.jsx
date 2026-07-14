import { useEffect, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import DataTable from "../components/DataTable";
import { formatAmount } from "../utils/amountUtils";

import { getMembers } from "../services/memberService";

import {
  getDashboardReport,
  getDailyReport,
  getMemberReport,
  getFeedReport,
  getAdvanceReport,
  getBillReport,
} from "../services/reportService";

function Reports() {
  const today = new Date()
    .toISOString()
    .split("T")[0];

  const currentMonth = new Date()
    .toISOString()
    .slice(0, 7);

  const [members, setMembers] = useState([]);

  const [reportType, setReportType] =
    useState("daily");

  const [reportDate, setReportDate] =
    useState(today);

  const [
    selectedMemberId,
    setSelectedMemberId,
  ] = useState("");

  const [milkType, setMilkType] =
    useState("");

  const [session, setSession] =
    useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [billMonth, setBillMonth] =
    useState(currentMonth);

  const [billCycle, setBillCycle] =
    useState("1");

  const [dashboard, setDashboard] =
    useState(null);

  const [summary, setSummary] =
    useState({});

  const [records, setRecords] =
    useState([]);

  const [memberReport, setMemberReport] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    loadMembers();
    loadDashboard();
    generateReport("daily");
  }, []);

  async function loadMembers() {
    try {
      const result = await getMembers();

      if (result.success) {
        setMembers(result.data || []);
      }
    } catch (error) {
      console.error(
        "Member loading error:",
        error
      );
    }
  }

  async function loadDashboard() {
    try {
      const result =
        await getDashboardReport(
          reportDate
        );

      if (result.success) {
        setDashboard(result.data);
      }
    } catch (error) {
      console.error(
        "Dashboard report error:",
        error
      );
    }
  }

  function resetReportResult() {
    setSummary({});
    setRecords([]);
    setMemberReport(null);
  }

  function selectReportType(type) {
    setReportType(type);
    resetReportResult();

    if (type === "daily") {
      setSelectedMemberId("");
      setFromDate("");
      setToDate("");
    }
  }

  async function generateReport(
    selectedType = reportType
  ) {
    try {
      setLoading(true);

      resetReportResult();

      let result;

      if (selectedType === "daily") {
        result = await getDailyReport({
          date: reportDate,
          milkType,
          session,
        });

        setSummary(
          result.data.summary || {}
        );

        setRecords(
          result.data.records || []
        );
      }

      if (selectedType === "member") {
        if (!selectedMemberId) {
          alert(
            "Please select a member"
          );
          return;
        }

        result = await getMemberReport(
          selectedMemberId,
          {
            fromDate,
            toDate,
          }
        );

        setMemberReport(result.data);

        setSummary(
          result.data.summary || {}
        );

        setRecords(
          result.data.collections || []
        );
      }

      if (selectedType === "feed") {
        result = await getFeedReport({
          memberId: selectedMemberId,
          fromDate,
          toDate,
        });

        setSummary(
          result.data.summary || {}
        );

        setRecords(
          result.data.records || []
        );
      }

      if (selectedType === "advance") {
        result =
          await getAdvanceReport({
            memberId:
              selectedMemberId,

            fromDate,
            toDate,
          });

        setSummary(
          result.data.summary || {}
        );

        setRecords(
          result.data.records || []
        );
      }

      if (selectedType === "bills") {
        result = await getBillReport({
          memberId:
            selectedMemberId,

          billMonth,
          billCycle,
        });

        setSummary(
          result.data.summary || {}
        );

        setRecords(
          result.data.records || []
        );
      }

      await loadDashboard();
    } catch (error) {
      console.error(
        "Report generation error:",
        error
      );

      alert(
        error.message ||
          "Unable to generate report"
      );
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (records.length === 0) {
      alert(
        "No report records available"
      );
      return;
    }

    const keys = Object.keys(
      records[0]
    ).filter(
      (key) =>
        typeof records[0][key] !==
        "object"
    );

    const header = keys.join(",");

    const rows = records.map((record) =>
      keys
        .map((key) => {
          const value =
            record[key] ?? "";

          return `"${String(value).replace(
            /"/g,
            '""'
          )}"`;
        })
        .join(",")
    );

    const csvContent = [
      header,
      ...rows,
    ].join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `${reportType}-report-${today}.csv`;

    link.click();

    URL.revokeObjectURL(url);
  }

  function formatSummaryLabel(key) {
    return key
      .replace(
        /([A-Z])/g,
        " $1"
      )
      .replace(/^./, (text) =>
        text.toUpperCase()
      );
  }

  function formatSummaryValue(
    key,
    value
  ) {
    const lowerKey =
      key.toLowerCase();

    if (
      typeof value === "number" &&
      (
        lowerKey.includes("amount") ||
        lowerKey.includes("payable") ||
        lowerKey.includes("advance") ||
        lowerKey.includes("reserve") ||
        lowerKey.includes("deducted") ||
        lowerKey.includes("due")
      )
    ) {
      return `₹${formatAmount(value)}`;
    }

    if (
      typeof value === "number" &&
      (
        lowerKey.includes("milk") ||
        lowerKey.includes("litre")
      ) &&
      !lowerKey.includes("amount")
    ) {
      return `${formatAmount(value)} L`;
    }

    return value;
  }

  const dailyColumns = [
    {
      key: "collectionDate",
      label: "Date",
    },
    {
      key: "memberId",
      label: "Member ID",
    },
    {
      key: "memberName",
      label: "Member",
    },
    {
      key: "milkType",
      label: "Milk Type",
    },
    {
      key: "session",
      label: "Session",
    },
    {
      key: "quantity",
      label: "Litres",
    },
    {
      key: "fat",
      label: "FAT",
    },
    {
      key: "snf",
      label: "SNF",
    },
    {
      key: "rate",
      label: "Rate",

      render: (row) =>
        `₹${formatAmount(
          row.rate
        )}`,
    },
    {
      key: "amount",
      label: "Amount",

      render: (row) =>
        `₹${formatAmount(
          row.amount
        )}`,
    },
  ];

  const feedColumns = [
    {
      key: "date",
      label: "Date",
    },
    {
      key: "memberId",
      label: "Member ID",
    },
    {
      key: "memberName",
      label: "Member",
    },
    {
      key: "feedType",
      label: "Feed Type",
    },
    {
      key: "quantity",
      label: "Quantity",
    },
    {
      key: "rate",
      label: "Rate",

      render: (row) =>
        `₹${formatAmount(
          row.rate
        )}`,
    },
    {
      key: "amount",
      label: "Amount",

      render: (row) =>
        `₹${formatAmount(
          row.amount
        )}`,
    },
    {
      key: "status",
      label: "Status",
    },
  ];

  const advanceColumns = [
    {
      key: "date",
      label: "Date",
    },
    {
      key: "memberId",
      label: "Member ID",
    },
    {
      key: "memberName",
      label: "Member",
    },
    {
      key: "amount",
      label: "Advance",

      render: (row) =>
        `₹${formatAmount(
          row.amount
        )}`,
    },
    {
      key: "remainingAmount",
      label: "Remaining",

      render: (row) =>
        `₹${formatAmount(
          row.remainingAmount
        )}`,
    },
    {
      key: "reason",
      label: "Reason",
    },
    {
      key: "status",
      label: "Status",
    },
  ];

  const billColumns = [
    {
      key: "memberId",
      label: "Member ID",
    },
    {
      key: "memberName",
      label: "Member",
    },
    {
      key: "billMonth",
      label: "Month",
    },
    {
      key: "billCycle",
      label: "Cycle",
    },
    {
      key: "totalMilk",
      label: "Milk",

      render: (row) =>
        `${formatAmount(
          row.totalMilk
        )} L`,
    },
    {
      key: "milkAmount",
      label: "Milk Amount",

      render: (row) =>
        `₹${formatAmount(
          row.milkAmount
        )}`,
    },
    {
      key: "reserveAmount",
      label: "Reserve",

      render: (row) =>
        `₹${formatAmount(
          row.reserveAmount
        )}`,
    },
    {
      key: "netPayable",
      label: "Net Payable",

      render: (row) =>
        `₹${formatAmount(
          row.netPayable
        )}`,
    },
  ];

  function getColumns() {
    if (
      reportType === "daily" ||
      reportType === "member"
    ) {
      return dailyColumns;
    }

    if (reportType === "feed") {
      return feedColumns;
    }

    if (reportType === "advance") {
      return advanceColumns;
    }

    if (reportType === "bills") {
      return billColumns;
    }

    return [];
  }

  function getReportTitle() {
    if (reportType === "daily") {
      return "Daily Collection Report";
    }

    if (reportType === "member") {
      return "Member Report";
    }

    if (reportType === "feed") {
      return "Feed Report";
    }

    if (reportType === "advance") {
      return "Advance Report";
    }

    if (reportType === "bills") {
      return "Billing Report";
    }

    return "Report";
  }

  return (
    <MainLayout>
      <div className="reports-page">
        <div className="reports-header">
          <div>
            <span className="reports-eyebrow">
              Reports and Insights
            </span>

            <h1>
              Reports Dashboard
            </h1>

            <p>
              Monitor, filter, print and
              export dairy business reports
            </p>
          </div>

          <div className="report-actions">
            <button
              type="button"
              className="report-export-btn"
              onClick={exportCsv}
            >
              <span>⬇</span>
              Export CSV
            </button>

            <button
              type="button"
              className="report-print-btn"
              onClick={() =>
                window.print()
              }
            >
              <span>🖨️</span>
              Print
            </button>
          </div>
        </div>

        <div className="report-navigation-grid">
          <button
            type="button"
            className={`report-navigation-card blue ${
              reportType === "daily"
                ? "active"
                : ""
            }`}
            onClick={() =>
              selectReportType("daily")
            }
          >
            <span className="report-navigation-icon">
              🥛
            </span>

            <div>
              <h3>
                Daily Collection
              </h3>

              <p>
                Daily entries, milk totals
                and collection amount
              </p>
            </div>

            <span className="report-card-arrow">
              →
            </span>
          </button>

          <button
            type="button"
            className={`report-navigation-card purple ${
              reportType === "member"
                ? "active"
                : ""
            }`}
            onClick={() =>
              selectReportType("member")
            }
          >
            <span className="report-navigation-icon">
              👤
            </span>

            <div>
              <h3>
                Member Report
              </h3>

              <p>
                Complete member milk and
                transaction history
              </p>
            </div>

            <span className="report-card-arrow">
              →
            </span>
          </button>

          <button
            type="button"
            className={`report-navigation-card orange ${
              reportType === "feed"
                ? "active"
                : ""
            }`}
            onClick={() =>
              selectReportType("feed")
            }
          >
            <span className="report-navigation-icon">
              🌾
            </span>

            <div>
              <h3>
                Feed Report
              </h3>

              <p>
                Feed purchases, paid records
                and pending dues
              </p>
            </div>

            <span className="report-card-arrow">
              →
            </span>
          </button>

          <button
            type="button"
            className={`report-navigation-card red ${
              reportType === "advance"
                ? "active"
                : ""
            }`}
            onClick={() =>
              selectReportType(
                "advance"
              )
            }
          >
            <span className="report-navigation-icon">
              💰
            </span>

            <div>
              <h3>
                Advance Report
              </h3>

              <p>
                Advances issued, cleared
                amount and remaining balance
              </p>
            </div>

            <span className="report-card-arrow">
              →
            </span>
          </button>

          <button
            type="button"
            className={`report-navigation-card green ${
              reportType === "bills"
                ? "active"
                : ""
            }`}
            onClick={() =>
              selectReportType("bills")
            }
          >
            <span className="report-navigation-icon">
              🧾
            </span>

            <div>
              <h3>
                Billing Report
              </h3>

              <p>
                Generated bills, deductions
                and final payable amount
              </p>
            </div>

            <span className="report-card-arrow">
              →
            </span>
          </button>
        </div>

        <div className="reports-section-heading">
          <div>
            <span className="section-icon">
              📊
            </span>

            <div>
              <h2>
                Dashboard Overview
              </h2>

              <p>
                Current dairy statistics
                and pending amounts
              </p>
            </div>
          </div>

          <span className="section-date">
            {reportDate}
          </span>
        </div>

        {dashboard && (
          <div className="report-card-grid">
            <div className="report-stat-card">
              <div className="report-stat-top">
                <span className="report-stat-icon">
                  📋
                </span>

                <span className="report-stat-trend">
                  Today
                </span>
              </div>

              <p>Today Entries</p>

              <h2>
                {
                  dashboard.entriesToday
                }
              </h2>
            </div>

            <div className="report-stat-card">
              <div className="report-stat-top">
                <span className="report-stat-icon">
                  🥛
                </span>

                <span className="report-stat-trend">
                  Litres
                </span>
              </div>

              <p>Today Milk</p>

              <h2>
                {formatAmount(
                  dashboard.totalMilk
                )}{" "}
                L
              </h2>
            </div>

            <div className="report-stat-card">
              <div className="report-stat-top">
                <span className="report-stat-icon">
                  ₹
                </span>

                <span className="report-stat-trend">
                  Value
                </span>
              </div>

              <p>Today Amount</p>

              <h2>
                ₹
                {formatAmount(
                  dashboard.totalAmount
                )}
              </h2>
            </div>

            <div className="report-stat-card">
              <div className="report-stat-top">
                <span className="report-stat-icon">
                  🐄
                </span>

                <span className="report-stat-trend">
                  Cow
                </span>
              </div>

              <p>Cow Milk</p>

              <h2>
                {formatAmount(
                  dashboard.cowMilk
                )}{" "}
                L
              </h2>
            </div>

            <div className="report-stat-card">
              <div className="report-stat-top">
                <span className="report-stat-icon">
                  🐃
                </span>

                <span className="report-stat-trend">
                  Buffalo
                </span>
              </div>

              <p>Buffalo Milk</p>

              <h2>
                {formatAmount(
                  dashboard.buffaloMilk
                )}{" "}
                L
              </h2>
            </div>

            <div className="report-stat-card">
              <div className="report-stat-top">
                <span className="report-stat-icon">
                  🌾
                </span>

                <span className="report-stat-trend">
                  Due
                </span>
              </div>

              <p>Pending Feed</p>

              <h2>
                ₹
                {formatAmount(
                  dashboard.pendingFeedAmount
                )}
              </h2>
            </div>

            <div className="report-stat-card">
              <div className="report-stat-top">
                <span className="report-stat-icon">
                  💳
                </span>

                <span className="report-stat-trend">
                  Due
                </span>
              </div>

              <p>Pending Advance</p>

              <h2>
                ₹
                {formatAmount(
                  dashboard.pendingAdvanceAmount
                )}
              </h2>
            </div>

            <div className="report-stat-card">
              <div className="report-stat-top">
                <span className="report-stat-icon">
                  🧾
                </span>

                <span className="report-stat-trend">
                  Total
                </span>
              </div>

              <p>Generated Bills</p>

              <h2>
                {
                  dashboard.generatedBills
                }
              </h2>
            </div>
          </div>
        )}

        <div className="reports-section-heading">
          <div>
            <span className="section-icon">
              ⚙️
            </span>

            <div>
              <h2>
                Generate Report
              </h2>

              <p>
                Configure filters for the
                selected report
              </p>
            </div>
          </div>

          <span className="selected-report-badge">
            {getReportTitle()}
          </span>
        </div>

        <div className="report-filter-panel">
          {reportType === "daily" && (
            <>
              <div className="report-filter-field">
                <label>
                  Report Date
                </label>

                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) =>
                    setReportDate(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="report-filter-field">
                <label>
                  Milk Type
                </label>

                <select
                  value={milkType}
                  onChange={(e) =>
                    setMilkType(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    All Milk Types
                  </option>

                  <option value="Cow">
                    Cow
                  </option>

                  <option value="Buffalo">
                    Buffalo
                  </option>
                </select>
              </div>

              <div className="report-filter-field">
                <label>
                  Session
                </label>

                <select
                  value={session}
                  onChange={(e) =>
                    setSession(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    All Sessions
                  </option>

                  <option value="Morning">
                    Morning
                  </option>

                  <option value="Evening">
                    Evening
                  </option>
                </select>
              </div>
            </>
          )}

          {reportType !== "daily" &&
            reportType !== "bills" && (
              <>
                <div className="report-filter-field">
                  <label>
                    Member
                  </label>

                  <select
                    value={
                      selectedMemberId
                    }
                    onChange={(e) =>
                      setSelectedMemberId(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      {reportType === "member"
                        ? "Select Member"
                        : "All Members"}
                    </option>

                    {members.map(
                      (member) => (
                        <option
                          key={
                            member.memberId
                          }
                          value={
                            member.memberId
                          }
                        >
                          {
                            member.memberId
                          }{" "}
                          - {member.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="report-filter-field">
                  <label>
                    From Date
                  </label>

                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) =>
                      setFromDate(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="report-filter-field">
                  <label>
                    To Date
                  </label>

                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) =>
                      setToDate(
                        e.target.value
                      )
                    }
                  />
                </div>
              </>
            )}

          {reportType === "bills" && (
            <>
              <div className="report-filter-field">
                <label>
                  Member
                </label>

                <select
                  value={
                    selectedMemberId
                  }
                  onChange={(e) =>
                    setSelectedMemberId(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    All Members
                  </option>

                  {members.map(
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
              </div>

              <div className="report-filter-field">
                <label>
                  Billing Month
                </label>

                <input
                  type="month"
                  value={billMonth}
                  onChange={(e) =>
                    setBillMonth(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="report-filter-field">
                <label>
                  Billing Cycle
                </label>

                <select
                  value={billCycle}
                  onChange={(e) =>
                    setBillCycle(
                      e.target.value
                    )
                  }
                >
                  <option value="1">
                    Cycle 1: 1 - 10
                  </option>

                  <option value="2">
                    Cycle 2: 11 - 20
                  </option>

                  <option value="3">
                    Cycle 3: 21 - End
                  </option>
                </select>
              </div>
            </>
          )}

          <div className="report-filter-action">
            <label>
              &nbsp;
            </label>

            <button
              type="button"
              onClick={() =>
                generateReport()
              }
              disabled={loading}
            >
              <span>
                {loading
                  ? "⏳"
                  : "📊"}
              </span>

              {loading
                ? "Generating..."
                : "Generate Report"}
            </button>
          </div>
        </div>

        {memberReport && (
          <div className="member-report-title">
            <div className="member-report-avatar">
              👤
            </div>

            <div>
              <h2>
                {
                  memberReport.member
                    .memberId
                }{" "}
                -{" "}
                {
                  memberReport.member
                    .name
                }
              </h2>

              <p>
                Mobile:{" "}
                {
                  memberReport.member
                    .mobile
                }
              </p>
            </div>
          </div>
        )}

        {Object.keys(summary).length >
          0 && (
          <>
            <div className="reports-section-heading">
              <div>
                <span className="section-icon">
                  📌
                </span>

                <div>
                  <h2>
                    Report Summary
                  </h2>

                  <p>
                    Key values from the
                    generated report
                  </p>
                </div>
              </div>
            </div>

            <div className="report-summary-grid">
              {Object.entries(
                summary
              ).map(([key, value]) => (
                <div
                  className="report-summary-item"
                  key={key}
                >
                  <p>
                    {formatSummaryLabel(
                      key
                    )}
                  </p>

                  <h3>
                    {formatSummaryValue(
                      key,
                      value
                    )}
                  </h3>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="reports-section-heading report-results-heading">
          <div>
            <span className="section-icon">
              📑
            </span>

            <div>
              <h2>
                Report Results
              </h2>

              <p>
                Search and inspect generated
                report records
              </p>
            </div>
          </div>

          <span className="result-count-badge">
            {records.length} Records
          </span>
        </div>

        {loading ? (
          <div className="report-loading-box">
            <div className="report-loader">
            </div>

            <p>
              Generating report...
            </p>
          </div>
        ) : (
          <DataTable
            columns={getColumns()}
            data={records}
            searchPlaceholder="Search report records..."
          />
        )}
      </div>
    </MainLayout>
  );
}

export default Reports;