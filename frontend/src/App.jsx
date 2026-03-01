import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import RegisterProperty from "./pages/RegisterProperty";
import Transfers from "./pages/Transfers";
import TransferDetails from "./pages/TransferDetails";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:propertyId" element={<PropertyDetails />} />
        <Route path="/register" element={<RegisterProperty />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/transfers/:transferId" element={<TransferDetails />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
