function DashboardChart({ data }) {
  const maxMilk = Math.max(...data.map((item) => item.milk), 1);

  return (
    <div className="chart-card">
      <h3>Milk Collection Trend</h3>

      <div className="simple-chart">
        {data.map((item) => (
          <div className="simple-chart-item" key={item.day}>
            <div className="simple-chart-bar-wrap">
              <div
                className="simple-chart-bar"
                style={{
                  height: `${(item.milk / maxMilk) * 180}px`,
                }}
              ></div>
            </div>

            <strong>{item.milk} L</strong>
            <span>{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardChart;