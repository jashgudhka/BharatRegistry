import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, Search, User, Shield } from "lucide-react";
import { adminAPI } from "../../utils/api";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";

export default function AdminUsers() {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === "pending") params.verified = "false";
      if (filter === "verified") params.verified = "true";
      if (search) params.search = search;

      const res = await adminAPI.getUsers(params);
      setUsers(res.data.data.users);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filter, search]);

  const handleVerify = async (userId, approved) => {
    setActionLoading(userId);
    try {
      const reason = approved ? undefined : prompt("Reason for rejection:");
      if (!approved && !reason) { setActionLoading(null); return; }

      await adminAPI.verifyUser(userId, approved, reason);
      toast.success(approved ? "User KYC approved!" : "User KYC rejected");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update user status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await adminAPI.updateUserRole(userId, role);
      toast.success(`Role updated to ${role}`);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">User Management</h1>
        <p className="text-slate-500 mt-1">Review and verify user registrations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, wallet, or PAN..."
            className="input pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {["all", "pending", "verified"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              filter === f
                ? "bg-primary-500 text-white shadow-lg"
                : "bg-white/80 text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.walletAddress} className="card p-5 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                    {user.fullName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                      {user.fullName || "—"} 
                      {user.username && <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">@{user.username}</span>}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">{user.walletAddress}</p>
                    <div className="flex gap-3 mt-1 text-xs text-slate-500">
                      {user.panNumber && <span>PAN: <span className="font-mono font-bold">{user.panNumber}</span></span>}
                      {user.email && <span>{user.email}</span>}
                      {user.phone && <span>{user.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`badge ${user.isVerified ? "badge-verified" : "badge-pending"}`}>
                    {user.isVerified ? "Verified" : "Pending KYC"}
                  </span>

                  {isSuperAdmin ? (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className="text-xs font-bold border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                    >
                      <option value="user">User</option>
                      <option value="verifier">Verifier</option>
                      <option value="registrar">Registrar</option>
                      <option value="admin">Admin</option>
                      <option value="bank">Bank</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  ) : (
                    <span className="text-xs font-bold bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200 uppercase tracking-widest text-slate-600">
                      {user.role}
                    </span>
                  )}

                  {!user.isVerified && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerify(user._id, true)}
                        disabled={actionLoading === user._id}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors flex items-center gap-1"
                      >
                        {actionLoading === user._id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleVerify(user._id, false)}
                        disabled={actionLoading === user._id}
                        className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-200 transition-colors flex items-center gap-1"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
