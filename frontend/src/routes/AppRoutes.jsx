import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Members from "../pages/Members";
import Collection from "../pages/Collection";
import Reports from "../pages/Reports";
import RateMaster from "../pages/RateMaster";
import DailyReport from "../pages/DailyReport";
import CollectionRegister from "../pages/CollectionRegister";
import MilkSummary from "../pages/MilkSummary";
import FatSNFReport from "../pages/FatSNFReport";
import PaymentRegister from "../pages/PaymentRegister";
import MemberBill from "../pages/MemberBill";
import FeedManagement from "../pages/FeedMaanagement";
import AdvanceManagement from "../pages/AdvanceManagement";
import FeedAdvanceReport from "../pages/FeedAdvancerRport";
import BillHistory from "../pages/BillHistory";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/members" element={<Members />} />
      <Route path="/collection" element={<Collection />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/advance-management" element={<AdvanceManagement />} />
      <Route path="/feed-management" element={<FeedManagement/>}/>
      <Route path="/ratemaster" element={<RateMaster />} />
      <Route path="/daily-report" element={<DailyReport />} />
      <Route path="/collection-register" element={<CollectionRegister />} />
      <Route path="/milk-summary" element={<MilkSummary />} />
      <Route path="/fat-snf-report" element={<FatSNFReport />} />
      <Route path="/payment-register" element={<PaymentRegister />} />
      <Route path="/member-bill" element={<MemberBill />} />
      <Route path="/feed-advance-report" element={<FeedAdvanceReport />} />
      <Route path="/bill-history" element={<BillHistory />} />
       


    </Routes>
  );
}

export default AppRoutes;
