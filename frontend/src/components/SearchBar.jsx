function SearchBar({
  searchText,
  setSearchText,
  placeholder = "Search records...",
}) {
  return (
    <div className="search-wrapper">
      <span className="search-icon">🔍</span>

      <input
        type="text"
        value={searchText}
        placeholder={placeholder}
        onChange={(e) =>
          setSearchText(e.target.value)
        }
        className="advanced-search"
      />
    </div>
  );
}

export default SearchBar;