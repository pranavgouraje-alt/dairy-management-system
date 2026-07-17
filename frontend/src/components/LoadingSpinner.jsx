function LoadingSpinner({
  message = "Loading data...",
  fullPage = false,
}) {
  return (
    <div
      className={
        fullPage
          ? "api-loading-state api-loading-full-page"
          : "api-loading-state"
      }
    >
      <div
        className="api-loading-spinner"
        aria-hidden="true"
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="api-loading-content">
        <h3>Please wait</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;