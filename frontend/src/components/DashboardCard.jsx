function DashboardCard(props) {

  return (

    <div className="dashboard-card">

      <h3>{props.title}</h3>

      <h2>{props.value}</h2>

    </div>

  );

}

export default DashboardCard;