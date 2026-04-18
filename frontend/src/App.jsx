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
import NotFound from "./pages/NotFound";
import AuthRoute from "./components/layout/AuthRoute";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
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

        {/* Authenticated / Protected */}
        <Route
          path="/properties"
          element={
            <AuthRoute>
              <Properties />
            </AuthRoute>
          }
        />
        <Route
          path="/properties/:id"
          element={
            <AuthRoute>
              <PropertyDetails />
            </AuthRoute>
          }
        />
        <Route
          path="/transfers"
          element={
            <AuthRoute>
              <Transfers />
            </AuthRoute>
          }
        />
        <Route
          path="/transfers/:transferId"
          element={
            <AuthRoute>
              <TransferDetails />
            </AuthRoute>
          }
        />
        <Route
          path="/verify"
          element={
            <AuthRoute>
              <DocumentVerify />
            </AuthRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <AuthRoute>
              <Dashboard />
            </AuthRoute>
          }
        />
        <Route
          path="/register-property"
          element={
            <AuthRoute>
              <RegisterProperty />
            </AuthRoute>
          }
        />

        {/* Admin Panel */}
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
            <AuthRoute allowedRoles={["bank", "admin"]}>
              <BankDashboard />
            </AuthRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
