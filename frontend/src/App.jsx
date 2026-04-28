import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import RegisterProperty from "./pages/RegisterProperty";
import Transfers from "./pages/Transfers";
import TransferDetails from "./pages/TransferDetails";
import Register from "./pages/Register";
import Login from "./pages/Login";
import DocumentVerify from "./pages/DocumentVerify";
import EcosystemWorkbench from "./pages/EcosystemWorkbench";
import BlockchainExplorer from "./pages/BlockchainExplorer";
import NotFound from "./pages/NotFound";
import AuthRoute from "./components/layout/AuthRoute";
import Kyc from "./pages/Kyc";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminDocuments from "./pages/admin/AdminDocuments";

// Bank pages
import BankDashboard from "./pages/bank/BankDashboard";

function App() {
  return (
    <Layout>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Authenticated / Protected - User only */}
        <Route
          path="/properties/*"
          element={
            <AuthRoute allowedRoles={["user", "admin", "verifier", "registrar", "super_admin", "bank"]}>
              <Routes>
                <Route path="/" element={<Properties />} />
                <Route path=":id" element={<PropertyDetails />} />
              </Routes>
            </AuthRoute>
          }
        />
        <Route
          path="/transfers/*"
          element={
            <AuthRoute allowedRoles={["user", "admin", "verifier", "registrar", "super_admin", "bank"]}>
              <Routes>
                <Route path="/" element={<Transfers />} />
                <Route path=":transferId" element={<TransferDetails />} />
              </Routes>
            </AuthRoute>
          }
        />

        <Route
          path="/ecosystem"
          element={
            <AuthRoute allowedRoles={["user", "admin", "verifier", "registrar", "super_admin", "bank"]}>
              <EcosystemWorkbench />
            </AuthRoute>
          }
        />

        <Route path="/explorer" element={<BlockchainExplorer />} />

        <Route
          path="/kyc"
          element={
            <AuthRoute allowedRoles={["user", "admin", "verifier", "registrar", "super_admin", "bank"]}>
              <Kyc />
            </AuthRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <AuthRoute allowedRoles={["user"]}>
              <Dashboard />
            </AuthRoute>
          }
        />
        <Route
          path="/register-property"
          element={
            <AuthRoute allowedRoles={["user"]}>
              <RegisterProperty />
            </AuthRoute>
          }
        />

        {/* Admin/Verifier/Registrar */}
        <Route
          path="/verify"
          element={
            <AuthRoute allowedRoles={["admin", "verifier", "registrar"]}>
              <DocumentVerify />
            </AuthRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AuthRoute allowedRoles={["admin", "verifier", "registrar"]}>
              <AdminDashboard />
            </AuthRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AuthRoute allowedRoles={["admin", "verifier", "registrar"]}>
              <AdminUsers />
            </AuthRoute>
          }
        />
        <Route
          path="/admin/properties"
          element={
            <AuthRoute allowedRoles={["admin", "verifier", "registrar"]}>
              <AdminProperties />
            </AuthRoute>
          }
        />
        <Route
          path="/admin/documents"
          element={
            <AuthRoute allowedRoles={["admin", "verifier", "registrar"]}>
              <AdminDocuments />
            </AuthRoute>
          }
        />

        {/* Bank Panel */}
        <Route
          path="/bank"
          element={
            <AuthRoute allowedRoles={["bank"]}>
              <BankDashboard />
            </AuthRoute>
          }
        />

        {/* Super Admin */}
        <Route
          path="/super-admin"
          element={
            <AuthRoute allowedRoles={["super_admin"]}>
              <SuperAdminDashboard />
            </AuthRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
