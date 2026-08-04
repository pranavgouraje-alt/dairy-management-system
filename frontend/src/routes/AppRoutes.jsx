import {
  Navigate,
  Route,
  Routes,
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
import ActivityLogs from "../pages/ActivityLogs";
//import PaymentRegister from "../pages/PaymentRegister";
//import BillHistory from "../pages/BillHistory";

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
      {/* Public login route */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* Default route */}
      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <PrivatePage>
            <Dashboard />
          </PrivatePage>
        }
      />

      {/* Members */}
      <Route
        path="/members"
        element={
          <PrivatePage>
            <Members />
          </PrivatePage>
        }
      />

      {/* Milk collection */}
      <Route
        path="/collection"
        element={
          <PrivatePage>
            <Collection />
          </PrivatePage>
        }
      />

      {/* Reports hub */}
      <Route
        path="/reports"
        element={
          <PrivatePage>
            <Reports />
          </PrivatePage>
        }
      />

      {/* Individual report pages */}
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

      {/* Management modules */}
      <Route
        path="/feed-management"
        element={
          <PrivatePage>
            <FeedManagement />
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

      {/* Admin-only Rate Master */}
      <Route
        path="/rate-master"
        element={
          <PrivatePage
            allowedRoles={["Admin"]}
          >
            <RateMaster />
          </PrivatePage>
        }
      />

      {/* Analytics */}
      <Route
        path="/analytics"
        element={
          <PrivatePage>
            <Analytics />
          </PrivatePage>
        }
      />

      {/* Admin-only backup */}
      <Route
        path="/backup"
        element={
          <PrivatePage
            allowedRoles={["Admin"]}
          >
            <BackupRestore />
          </PrivatePage>
        }
      />

      {/* Admin-only activity logs */}
      <Route
        path="/activity-logs"
        element={
          <PrivatePage
            allowedRoles={["Admin"]}
          >
            <ActivityLogs />
          </PrivatePage>
        }
      />

      {/* Unknown route */}
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