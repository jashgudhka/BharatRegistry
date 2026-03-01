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

        {/* Authenticated / Protected */}
        <Route path="/properties" element={<AuthRoute><Properties /></AuthRoute>} />
        <Route path="/properties/:id" element={<AuthRoute><PropertyDetails /></AuthRoute>} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/transfers/:id" element={<TransferDetails />} />
        <Route path="/verify" element={<AuthRoute><DocumentVerify /></AuthRoute>} />
        
        <Route path="/dashboard" element={<AuthRoute><Dashboard /></AuthRoute>} />
        <Route path="/register-property" element={<AuthRoute><RegisterProperty /></AuthRoute>} />

        {/* Admin Panel */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/properties" element={<AdminProperties />} />
        <Route path="/admin/documents" element={<AdminDocuments />} />

        {/* Bank Panel */}
        <Route path="/bank" element={<BankDashboard />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
