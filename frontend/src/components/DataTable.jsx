import { useState } from "react";
import SearchBar from "./SearchBar";
import EmptyState from "./EmptyState";

function DataTable({
  columns,
  data,
  searchPlaceholder = "Search...",
  rowsPerPage = 10,
}) {
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = data.filter((row) =>
    Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0;

    const valueA = String(a[sortKey] ?? "").toLowerCase();
    const valueB = String(b[sortKey] ?? "").toLowerCase();

    if (valueA < valueB) {
      return sortOrder === "asc" ? -1 : 1;
    }

    if (valueA > valueB) {
      return sortOrder === "asc" ? 1 : -1;
    }

    return 0;
  });

  const totalPages = Math.ceil(
    sortedData.length / rowsPerPage
  );

  const startIndex =
    (currentPage - 1) * rowsPerPage;

  const paginatedData = sortedData.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  function handleSort(key) {
    if (sortKey === key) {
      setSortOrder(
        sortOrder === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  }

  return (
    <div className="advanced-table-card">
      <div className="table-toolbar">
        <SearchBar
          searchText={searchText}
          setSearchText={setSearchText}
          placeholder={searchPlaceholder}
        />

        <div className="table-count">
          Total: {filteredData.length}
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="advanced-table-wrapper">
          <table className="advanced-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    onClick={() =>
                      column.sortable !== false &&
                      handleSort(column.key)
                    }
                  >
                    {column.label}

                    {sortKey === column.key && (
                      <span>
                        {sortOrder === "asc"
                          ? " ▲"
                          : " ▼"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render
                        ? column.render(row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination-row">
        <button
          disabled={currentPage === 1}
          onClick={() =>
            setCurrentPage(currentPage - 1)
          }
        >
          Previous
        </button>

        <span>
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() =>
            setCurrentPage(currentPage + 1)
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default DataTable;