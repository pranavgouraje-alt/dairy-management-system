function DashboardCard({
  title,
  value,
  unit = "",
  icon = "",
  variant = "blue",
  subtitle = "",
}) {
  return (
    <div className={`pro-card ${variant}`}>
      <div className="pro-card-icon">
        {icon}
      </div>

      <div className="pro-card-content">
        <p>{title}</p>

        <h2>
          {value}
          {unit && (
            <span className="pro-card-unit">
              {unit}
            </span>
          )}
        </h2>

        {subtitle && <span>{subtitle}</span>}
      </div>
    </div>
  );
}

export default DashboardCard;