import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  Building2,
  ArrowUpRight,
  Shield,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { adminAPI } from "../../utils/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentProperties, setRecentProperties] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getDashboard();
      setStats(res.data.data.stats);
      setRecentUsers(res.data.data.recentUsers || []);
      setRecentProperties(res.data.data.recentProperties || []);
    } catch (err) {
      console.error("Admin dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "primary", link: "/admin/users" },
    { label: "Pending KYC", value: stats?.pendingUsers || 0, icon: Clock, color: "amber", link: "/admin/users?filter=pending" },
    { label: "Verified Users", value: stats?.verifiedUsers || 0, icon: CheckCircle2, color: "emerald" },
    { label: "Total Properties", value: stats?.totalProperties || 0, icon: Building2, color: "indigo", link: "/admin/properties" },
    { label: "Pending Properties", value: stats?.pendingProperties || 0, icon: AlertTriangle, color: "orange", link: "/admin/properties?filter=pending" },
    { label: "Pending Documents", value: stats?.pendingDocuments || 0, icon: FileText, color: "rose", link: "/admin/documents" },
    { label: "Total Transfers", value: stats?.totalTransfers || 0, icon: ArrowUpRight, color: "blue" },
    { label: "Completed", value: stats?.completedTransfers || 0, icon: Shield, color: "teal" },
  ];

  const colorMap = {
    primary: "from-primary-500 to-indigo-500 shadow-primary-500/25",
    amber: "from-amber-500 to-orange-500 shadow-amber-500/25",
    emerald: "from-emerald-500 to-teal-500 shadow-emerald-500/25",
    indigo: "from-indigo-500 to-purple-500 shadow-indigo-500/25",
    orange: "from-orange-500 to-red-400 shadow-orange-500/25",
    rose: "from-rose-500 to-pink-500 shadow-rose-500/25",
    blue: "from-blue-500 to-cyan-500 shadow-blue-500/25",
    teal: "from-teal-500 to-emerald-500 shadow-teal-500/25",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Government Official Control Panel</p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary text-sm">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card card-hover p-5 group cursor-pointer"
            onClick={() => card.link && window.location.assign(card.link)}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[card.color]} flex items-center justify-center shadow-lg mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{card.value}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/users" className="card card-hover p-6 flex items-center gap-4 group">
          <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
            <Users className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Manage Users</h3>
            <p className="text-sm text-slate-500">View & verify user accounts</p>
          </div>
          <ArrowUpRight className="ml-auto text-slate-400 group-hover:text-primary-500 transition-colors" size={18} />
        </Link>

        <Link to="/admin/properties" className="card card-hover p-6 flex items-center gap-4 group">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
            <Building2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Verify Properties</h3>
            <p className="text-sm text-slate-500">Approve pending registrations</p>
          </div>
          <ArrowUpRight className="ml-auto text-slate-400 group-hover:text-indigo-500 transition-colors" size={18} />
        </Link>

        <Link to="/admin/documents" className="card card-hover p-6 flex items-center gap-4 group">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center group-hover:bg-rose-200 transition-colors">
            <FileText className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Review Documents</h3>
            <p className="text-sm text-slate-500">Verify uploaded documents</p>
          </div>
          <ArrowUpRight className="ml-auto text-slate-400 group-hover:text-rose-500 transition-colors" size={18} />
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-slate-800 mb-4">Recent Users</h3>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-slate-500 text-sm">No registered users yet</p>
            ) : (
              recentUsers.map((user) => (
                <div key={user.walletAddress} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{user.fullName || "—"}</p>
                    <p className="text-xs text-slate-500 font-mono">{user.walletAddress?.slice(0, 8)}...{user.walletAddress?.slice(-4)}</p>
                  </div>
                  <span className={`badge ${user.isVerified ? "badge-verified" : "badge-pending"}`}>
                    {user.isVerified ? "Verified" : "Pending"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-slate-800 mb-4">Recent Properties</h3>
          <div className="space-y-3">
            {recentProperties.length === 0 ? (
              <p className="text-slate-500 text-sm">No properties registered yet</p>
            ) : (
              recentProperties.map((prop) => (
                <div key={prop.propertyId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">#{prop.propertyId} — {prop.surveyNumber}</p>
                    <p className="text-xs text-slate-500">{new Date(prop.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`badge badge-${prop.status}`}>{prop.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
