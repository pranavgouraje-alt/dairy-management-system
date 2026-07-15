import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Members from "../pages/Members";
import Collection from "../pages/Collection";
import Reports from "../pages/Reports";

import DailyReport from "../pages/DailyReport";
import CollectionRegister from "../pages/CollectionRegister";
import FatSNFReport from "../pages/FatSNFReport";
import FeedAdvanceReport from "../pages/FeedAdvanceReport";
import MemberBill from "../pages/MemberBill";
import MilkSummary from "../pages/MilkSummary";
import PaymentRegister from "../pages/PaymentRegister";
import PrintAllBills from "../pages/PrintAllBills";
import BillHistory from "../pages/BillHistory";
import ReserveReport from "../pages/ReserveReport";

import RateMaster from "../pages/RateMaster";
import AdvanceManagement from "../pages/AdvanceManagement";
import FeedManagement from "../pages/FeedManagement";
import Analytics from "../pages/Analytics";
import BackupRestore from "../pages/BackupRestore";

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      <Route
        path="/members"
        element={<Members />}
      />

      <Route
        path="/collection"
        element={<Collection />}
      />

      <Route
        path="/reports"
        element={<Reports />}
      />

      <Route
        path="/daily-report"
        element={<DailyReport />}
      />

      <Route
        path="/collection-register"
        element={<CollectionRegister />}
      />

      <Route
        path="/fat-snf-report"
        element={<FatSNFReport />}
      />

      <Route
        path="/feed-advance-report"
        element={<FeedAdvanceReport />}
      />

      <Route
        path="/member-bill"
        element={<MemberBill />}
      />

      <Route
        path="/milk-summary"
        element={<MilkSummary />}
      />

      <Route
        path="/payment-register"
        element={<PaymentRegister />}
      />

      <Route
        path="/print-all-bills"
        element={<PrintAllBills />}
      />

      <Route
        path="/bill-history"
        element={<BillHistory />}
      />

      <Route
        path="/reserve-report"
        element={<ReserveReport />}
      />

      <Route
        path="/rate-master"
        element={<RateMaster />}
      />

      <Route
        path="/advance-management"
        element={<AdvanceManagement />}
      />

      <Route
        path="/feed-management"
        element={<FeedManagement />}
      />

      <Route
        path="/analytics"
        element={<Analytics />}
      />

      <Route
        path="/backup"
        element={<BackupRestore />}
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}

export default AppRoutes;