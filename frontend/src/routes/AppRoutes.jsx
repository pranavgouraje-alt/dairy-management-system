import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";

import Login from "../pages/Login";
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

function PrivatePage({
  children,
  allowedRoles = [],
}) {
  return (
    <ProtectedRoute
      allowedRoles={allowedRoles}
    >
      {children}
    </ProtectedRoute>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

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
        element={
          <PrivatePage>
            <Dashboard />
          </PrivatePage>
        }
      />

      <Route
        path="/members"
        element={
          <PrivatePage>
            <Members />
          </PrivatePage>
        }
      />

      <Route
        path="/collection"
        element={
          <PrivatePage>
            <Collection />
          </PrivatePage>
        }
      />

      <Route
        path="/reports"
        element={
          <PrivatePage>
            <Reports />
          </PrivatePage>
        }
      />

      <Route
        path="/daily-report"
        element={
          <PrivatePage>
            <DailyReport />
          </PrivatePage>
        }
      />

      <Route
        path="/collection-register"
        element={
          <PrivatePage>
            <CollectionRegister />
          </PrivatePage>
        }
      />

      <Route
        path="/fat-snf-report"
        element={
          <PrivatePage>
            <FatSNFReport />
          </PrivatePage>
        }
      />

      <Route
        path="/feed-advance-report"
        element={
          <PrivatePage>
            <FeedAdvanceReport />
          </PrivatePage>
        }
      />

      <Route
        path="/member-bill"
        element={
          <PrivatePage>
            <MemberBill />
          </PrivatePage>
        }
      />

      <Route
        path="/milk-summary"
        element={
          <PrivatePage>
            <MilkSummary />
          </PrivatePage>
        }
      />

      <Route
        path="/payment-register"
        element={
          <PrivatePage>
            <PaymentRegister />
          </PrivatePage>
        }
      />

      <Route
        path="/print-all-bills"
        element={
          <PrivatePage>
            <PrintAllBills />
          </PrivatePage>
        }
      />

      <Route
        path="/bill-history"
        element={
          <PrivatePage>
            <BillHistory />
          </PrivatePage>
        }
      />

      <Route
        path="/reserve-report"
        element={
          <PrivatePage>
            <ReserveReport />
          </PrivatePage>
        }
      />

      <Route
        path="/rate-master"
        element={
          <PrivatePage
            allowedRoles={[
              "Admin",
            ]}
          >
            <RateMaster />
          </PrivatePage>
        }
      />

      <Route
        path="/advance-management"
        element={
          <PrivatePage>
            <AdvanceManagement />
          </PrivatePage>
        }
      />

      <Route
        path="/feed-management"
        element={
          <PrivatePage>
            <FeedManagement />
          </PrivatePage>
        }
      />

      <Route
        path="/analytics"
        element={
          <PrivatePage>
            <Analytics />
          </PrivatePage>
        }
      />

      <Route
        path="/backup"
        element={
          <PrivatePage
            allowedRoles={[
              "Admin",
            ]}
          >
            <BackupRestore />
          </PrivatePage>
        }
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