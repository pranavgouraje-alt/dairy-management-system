import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Members from "../pages/Members";
import Collection from "../pages/Collection";
import Reports from "../pages/Reports";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/members" element={<Members />} />
      <Route path="/collection" element={<Collection />} />
      <Route path="/reports" element={<Reports />} />
    </Routes>
  );
}

export default AppRoutes;
