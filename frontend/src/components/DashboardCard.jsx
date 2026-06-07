function DashboardCard({ title, value, unit = "", icon = "", accent = "#1976d2", highlight = false }) {
  return (
    <div
      style={{
        background: highlight ? `linear-gradient(135deg, #ffffff 60%, ${accent}15)` : "#ffffff",
        borderRadius: "16px",
        padding: "22px 24px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.05)",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        cursor: "default",
        borderTop: `4px solid ${accent}`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.13)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "14px",
          background: `${accent}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "26px",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: "0 0 6px 0",
            color: "#78909c",
            fontSize: "11.5px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.9px",
          }}
        >
          {title}
        </p>
        <h2
          style={{
            margin: 0,
            color: "#0d1b2a",
            fontSize: "30px",
            fontWeight: "800",
            lineHeight: 1.1,
          }}
        >
          {value}
          {unit && (
            <span style={{ fontSize: "16px", fontWeight: "600", color: "#90a4ae", marginLeft: "4px" }}>
              {unit}
            </span>
          )}
        </h2>
      </div>
    </div>
  );
}

export default DashboardCard;
