import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Members from "../pages/Members";
import Collection from "../pages/Collection";
import Reports from "../pages/Reports";
import RateMaster from "../pages/RateMaster";
import DailyReport from "../pages/DailyReport";
import CollectionRegister from "../pages/CollectionRegister";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/members" element={<Members />} />
      <Route path="/collection" element={<Collection />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/ratemaster" element={<RateMaster />} />
      <Route path="/daily-report" element={<DailyReport />} />
      <Route path="/collection-register" element={<CollectionRegister />}/>

     
    </Routes>
  );
}

export default AppRoutes;
