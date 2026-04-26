import { useState, useEffect } from "react";
import { CheckCircle2, ShieldAlert, Loader2, Search, User, Shield, Building2 } from "lucide-react";
import { adminAPI } from "../../utils/api";
import toast from "react-hot-toast";

export default function SuperAdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== "all") params.role = filter;
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

  const handleRoleChange = async (walletAddress, role) => {
    try {
      await adminAPI.updateUserRole(walletAddress, role);
      toast.success(`Role updated to ${role}`);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10 w-full">
      {/* Header */}
      <div className="glass-panel p-8 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden border-t-4 border-red-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-40 -z-10 translate-x-1/3 -translate-y-1/3"></div>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <ShieldAlert className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Super Admin Dashboard</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Top-level entity and organization management.
            </p>
          </div>
        </div>
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
        {["all", "user", "admin", "verifier", "registrar", "bank", "super_admin"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              filter === f
                ? "bg-red-500 text-white shadow-lg"
                : "bg-white/80 text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1).replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.walletAddress} className="card p-5 hover:shadow-lg transition-shadow border-l-4 hover:border-red-500 border-transparent">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg">
                    {user.fullName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                       {user.fullName || "—"} 
                       {user.role === 'super_admin' && <ShieldAlert size={14} className="text-red-500" />}
                       {user.role === 'bank' && <Building2 size={14} className="text-indigo-500" />}
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
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.walletAddress, e.target.value)}
                    className="text-xs font-bold border-2 border-red-200 rounded-lg px-3 py-2 bg-red-50 text-red-800 outline-none focus:border-red-400 cursor-pointer"
                  >
                    <option value="user">User</option>
                    <option value="verifier">Verifier</option>
                    <option value="registrar">Registrar</option>
                    <option value="admin">Admin</option>
                    <option value="bank">Bank</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
