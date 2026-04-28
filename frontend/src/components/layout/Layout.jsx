import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  FileText,
  Send,
  Plus,
  LayoutDashboard,
  Layers,
  Shield,
  Users,
  Building2,
  Landmark,
  Search,
  UserPlus,
  LogIn,
  LogOut,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import WalletConnect from "../common/WalletConnect";
import { useAuth } from "../../hooks/useAuth";

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected } = useAccount();
  const {
    user,
    isAuthenticated,
    isAdmin,
    isVerifier,
    isBank,
    isRegistrar,
    isSuperAdmin,
    isRegistered,
    isLoading,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (href) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  const publicNav = [
    { name: "Home", href: "/", icon: Home, exact: true },
    { name: "Chain Explorer", href: "/explorer", icon: Activity },
  ];

  const userNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Properties", href: "/properties", icon: Building2 },
    { name: "Transfers", href: "/transfers", icon: Send },
    { name: "Register Property", href: "/register-property", icon: Plus },
    { name: "Ecosystem", href: "/ecosystem", icon: Layers },
    { name: "KYC Center", href: "/kyc", icon: FileText },
  ];

  const adminNav = [
    { name: "Admin Dashboard", href: "/admin", icon: Shield },
    { name: "KYC Review", href: "/admin/users", icon: Users },
    { name: "Property Verify", href: "/admin/properties", icon: Building2 },
    { name: "Document Verify", href: "/admin/documents", icon: Search },
    { name: "Verify Uploads", href: "/verify", icon: FileText },
  ];

  const superAdminNav = [
    { name: "Super Admin", href: "/super-admin", icon: Shield },
  ];

  const bankNav = [{ name: "Bank Portal", href: "/bank", icon: Landmark }];

  const navLinkClass = (href, exact) =>
    `px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 text-sm ${
      (exact ? location.pathname === href : isActive(href))
        ? "bg-primary-100/80 text-primary-700 shadow-sm"
        : "text-slate-600 hover:text-primary-600 hover:bg-primary-50/80"
    }`;

  return (
    <div className="min-h-screen bg-mesh font-sans selection:bg-primary-500/30 selection:text-primary-900">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 px-4 py-3 transition-all duration-300">
        <nav className="mx-auto max-w-7xl glass-nav rounded-2xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative w-11 h-11 bg-gradient-to-br from-primary-600 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-[0_0_20px_rgba(84,129,255,0.4)] group-hover:scale-105 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 blur-md group-hover:opacity-100 opacity-0 transition-opacity"></div>
                  <Layers className="text-white w-6 h-6 z-10" />
                </div>
                <div className="hidden sm:block">
                  <span className="font-extrabold text-xl text-slate-800 tracking-tight">
                    Bharat<span className="text-primary-600">Registry</span>
                  </span>
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    भारत रजिस्ट्री
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2 flex-1 justify-center px-4 overflow-hidden">
              {publicNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={navLinkClass(item.href, item.exact)}
                >
                  <item.icon size={16} className="stroke-[2.5]" />
                  {item.name}
                </Link>
              ))}

              {isAuthenticated &&
                // Assuming isUserRole is added to useAuth
                user?.role === "user" &&
                userNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={navLinkClass(item.href)}
                  >
                    <item.icon size={16} className="stroke-[2.5]" />
                    {item.name}
                  </Link>
                ))}

              {isAuthenticated &&
                (isAdmin || isVerifier || isRegistrar) &&
                adminNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={navLinkClass(item.href)}
                  >
                    <item.icon size={16} className="stroke-[2.5]" />
                    {item.name}
                  </Link>
                ))}

              {isAuthenticated &&
                isBank &&
                bankNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={navLinkClass(item.href)}
                  >
                    <item.icon size={16} className="stroke-[2.5]" />
                    {item.name}
                  </Link>
                ))}

              {isAuthenticated &&
                isSuperAdmin &&
                superAdminNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={navLinkClass(item.href)}
                  >
                    <item.icon size={16} className="stroke-[2.5]" />
                    {item.name}
                  </Link>
                ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4 shrink-0 ml-auto">
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="btn btn-outline text-sm py-2 px-4 hidden md:flex border-slate-200"
                >
                  <UserPlus size={16} /> Register
                </Link>
              )}

              {isAuthenticated && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-emerald-700">
                    {user?.username || user?.fullName?.split(" ")[0] || "User"}
                  </span>
                  {user?.role && user?.role !== "user" && (
                    <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {user?.role}
                    </span>
                  )}
                </div>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transition-all shadow-md font-bold shrink-0"
                >
                  <LogOut size={16} /> Logout
                </button>
              )}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="btn btn-primary text-sm py-2 px-4 hidden md:flex"
                >
                  <LogIn size={16} /> Login
                </Link>
              )}

              <WalletConnect />

              {/* Mobile menu button */}
              <button
                className="lg:hidden p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X size={20} className="stroke-[2.5]" />
                ) : (
                  <Menu size={20} className="stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden absolute top-full left-4 right-4 mt-2 origin-top transition-all duration-300 ${
            mobileMenuOpen
              ? "opacity-100 scale-100 visible"
              : "opacity-0 scale-95 invisible"
          }`}
        >
          <div className="glass-panel p-3 space-y-1 shadow-2xl">
            {publicNav.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-primary-50 hover:text-primary-600 font-semibold transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon size={20} className="stroke-[2.5]" />
                {item.name}
              </Link>
            ))}
            {isAuthenticated && (
              <div className="pt-2 mt-2 border-t border-slate-200/50">
                {/* Dynamic Dashboard Link for Mobile */}
                <Link
                  to={
                    user?.role === "super_admin"
                      ? "/super-admin"
                      : user?.role === "bank"
                      ? "/bank"
                      : (user?.role === "admin" || user?.role === "verifier" || user?.role === "registrar")
                      ? "/admin"
                      : "/dashboard"
                  }
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary-700 bg-primary-50 font-bold mb-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={20} className="stroke-[2.5]" />
                  My Dashboard
                </Link>

                {user?.role === "user" &&
                  userNav.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-primary-50 hover:text-primary-600 font-semibold transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon size={20} className="stroke-[2.5]" />
                      {item.name}
                    </Link>
                  ))}
                {(isAdmin || isVerifier || isRegistrar) &&
                  adminNav.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-amber-700 hover:bg-amber-50 font-semibold transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon size={20} className="stroke-[2.5]" />
                      {item.name}
                    </Link>
                  ))}
                {isBank &&
                  bankNav.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-700 hover:bg-indigo-50 font-semibold transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon size={20} className="stroke-[2.5]" />
                      {item.name}
                    </Link>
                  ))}
                {isSuperAdmin &&
                  superAdminNav.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-700 hover:bg-red-50 font-semibold transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon size={20} className="stroke-[2.5]" />
                      {item.name}
                    </Link>
                  ))}
              </div>
            )}
            {!isAuthenticated && (
              <div className="pt-2 mt-2 border-t border-slate-200/50 flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigate("/login");
                    setMobileMenuOpen(false);
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-primary-600 hover:bg-primary-50 font-semibold transition-colors text-left"
                >
                  <LogIn size={20} className="stroke-[2.5]" />
                  {isLoading ? "Loading..." : "Login"}
                </button>
                <Link
                  to="/register"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserPlus size={20} className="stroke-[2.5]" />
                  Register Account
                </Link>
              </div>
            )}
            {isAuthenticated && (
              <div className="pt-2 mt-2 border-t border-slate-200/50">
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-semibold transition-colors text-left"
                >
                  <LogOut size={20} className="stroke-[2.5]" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-28 relative z-10 flex flex-col min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative mt-auto border-t border-slate-200/50 bg-white/40 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Layers className="text-white w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-800 font-extrabold text-base tracking-tight">
                  Bharat<span className="text-primary-600">Registry</span>
                </p>
                <p className="text-slate-500 text-sm font-medium mt-0.5">
                  Blockchain-Powered Land Registry for India
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-3 text-xs font-bold uppercase tracking-wider">
              <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Zero Gas Fees
              </span>
              <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Permissioned Network
              </span>
              <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Aadhaar Verified
              </span>
            </div>

            <div className="flex gap-6 text-sm font-semibold text-slate-500">
              <Link
                to="/verify"
                className="hover:text-primary-600 transition-colors"
              >
                Verify Document
              </Link>
              <a
                href="/api-docs"
                className="hover:text-primary-600 transition-colors"
                target="_blank"
              >
                API
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
