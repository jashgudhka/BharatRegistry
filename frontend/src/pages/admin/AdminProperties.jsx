import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, Building2 } from "lucide-react";
import { adminAPI } from "../../utils/api";
import toast from "react-hot-toast";

export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPendingProperties();
      setProperties(res.data.data.properties);
    } catch (err) {
      console.error("Fetch properties error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleVerify = async (propertyId, approved) => {
    setActionLoading(propertyId);
    try {
      const reason = approved ? undefined : prompt("Reason for rejection:");
      if (!approved && !reason) { setActionLoading(null); return; }

      await adminAPI.verifyProperty(propertyId, approved, reason);
      toast.success(approved ? "Property verified!" : "Property rejected");
      fetchProperties();
    } catch (err) {
      toast.error("Failed to update property status");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Property Verification</h1>
        <p className="text-slate-500 mt-1">Review and approve pending property registrations</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : properties.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No pending properties</p>
          <p className="text-slate-400 text-sm mt-1">All properties have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((prop) => (
            <div key={prop.propertyId} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-extrabold text-slate-800">#{prop.propertyId}</span>
                    <span className="badge badge-pending">Pending</span>
                    <span className="text-xs font-bold text-slate-400 uppercase">{prop.propertyType}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Survey No.</p>
                      <p className="font-semibold text-slate-700">{prop.surveyNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Location</p>
                      <p className="font-semibold text-slate-700">
                        {prop.location?.city || prop.location?.address || "—"}, {prop.location?.state || ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Area</p>
                      <p className="font-semibold text-slate-700">{prop.area} sq.m</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Owner</p>
                      <p className="font-semibold text-slate-700 font-mono text-xs">
                        {prop.currentOwner?.slice(0, 8)}...{prop.currentOwner?.slice(-4)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerify(prop.propertyId, true)}
                    disabled={actionLoading === prop.propertyId}
                    className="btn btn-success text-sm py-2 px-4"
                  >
                    {actionLoading === prop.propertyId ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleVerify(prop.propertyId, false)}
                    disabled={actionLoading === prop.propertyId}
                    className="btn btn-danger text-sm py-2 px-4"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
