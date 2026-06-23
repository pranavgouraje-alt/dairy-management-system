import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="sidebar">
      <h3>Menu</h3>

      <ul>
        <li>
          <Link to="/">Dashboard</Link>
        </li>

        <li>
          <Link to="/members">Members</Link>
        </li>

        <li>
          <Link to="/collection">Collection</Link>
        </li>

        <li>
          <Link to="/reports">Reports</Link>
        </li>
        <li>
          <Link to="/ratemaster">RateMaster</Link>
        </li>

        <li>
          <Link to="/advance-management">AdvanceManagement</Link>
        </li>
        <li>
          <Link to="/feed-Management">FeedManagement</Link>
        </li>
        <li>
          <Link to="/backup">
            Backup
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;