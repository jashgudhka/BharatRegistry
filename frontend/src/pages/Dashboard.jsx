import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  FileText,
  Send,
  Plus,
  TrendingUp,
  LayoutDashboard,
  ArrowRight,
  ShieldAlert,
  Wallet,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useOwnerProperties, useTotalProperties } from "../hooks/useContract";
import { useUserTransfers } from "../hooks/useTransfer";

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { user, hasWallet, linkWallet, isLoading: authLoading, error: authError } = useAuth();
  
  // Use either the currently connected wallet (from Wagmi) or the linked walletAddress from DB
  // This ensures that if a user just connected a new wallet, they see its properties immediately.
  const searchAddress = address || user?.walletAddress;
  
  const { propertyIds, isLoading: propertiesLoading } = useOwnerProperties(searchAddress);
  const { transferIds, isLoading: transfersLoading } = useUserTransfers(searchAddress);
  const { total: totalProperties } = useTotalProperties();

  const handleLinkWallet = async () => {
    await linkWallet();
  };

  const stats = [
    {
      label: "My Properties",
      value: propertyIds?.length || 0,
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-100/50",
      borderColor: "border-blue-200",
      glow: "group-hover:bg-blue-500/10",
    },
    {
      label: "My Transfers",
      value: transferIds?.length || 0,
      icon: Send,
      color: "text-emerald-500",
      bgColor: "bg-emerald-100/50",
      borderColor: "border-emerald-200",
      glow: "group-hover:bg-emerald-500/10",
    },
    {
      label: "Total on Platform",
      value: totalProperties || 0,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-100/50",
      borderColor: "border-purple-200",
      glow: "group-hover:bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in relative z-10 w-full">
      {/* Header */}
      <div className="glass-panel p-8 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-40 -z-10 translate-x-1/3 -translate-y-1/3"></div>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <LayoutDashboard className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Welcome back, {user?.fullName}! Overview of your registered properties.
            </p>
          </div>
        </div>
        <Link
          to={hasWallet ? "/register-property" : "#"}
          className={`btn btn-primary shadow-lg shrink-0 w-full md:w-auto ${!hasWallet ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}`}
          onClick={(e) => !hasWallet && e.preventDefault()}
        >
          <Plus size={20} className="stroke-[2.5]" />
          New Property
        </Link>
      </div>

      {/* Wallet Connection Banner */}
      {!hasWallet && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <ShieldAlert size={200} className="-mt-10 -mr-10" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/30">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
                <p className="text-amber-50 max-w-xl">
                  To register properties or transfer ownership, you must link a Web3 wallet (like MetaMask) to your account. This acts as your digital signature on the blockchain.
                </p>
                {authError && (
                  <p className="text-white bg-red-500/50 p-2 rounded mt-3 text-sm border border-red-500/50">
                    {authError}
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto items-center">
              {!isConnected ? (
                <ConnectButton showBalance={false} />
              ) : (
                <button 
                  onClick={handleLinkWallet}
                  className="bg-white text-orange-600 hover:bg-amber-50 font-bold py-3 px-8 rounded-xl shadow-lg transition-colors flex items-center gap-2 w-full justify-center"
                  disabled={authLoading}
                >
                  {authLoading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                  Link Connected Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`glass-panel p-6 flex items-center gap-5 group hover:-translate-y-1 transition-all duration-300 border-t-4 ${stat.borderColor} relative overflow-hidden ${!hasWallet ? 'opacity-50 grayscale' : ''}`}
          >
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors ${stat.glow} opacity-50 pointer-events-none`}></div>
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${stat.bgColor} ${stat.color} group-hover:scale-110 transition-transform duration-300 shrink-0`}
            >
              <stat.icon size={28} className="stroke-[2]" />
            </div>
            <div>
              <div className="text-4xl font-black text-slate-800 tracking-tight">
                {stat.value}
              </div>
              <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mt-1">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasWallet && (
        <>
          {/* Quick Actions */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* My Properties */}
            <div className="glass-panel p-6 sm:p-8 flex flex-col h-full relative overflow-hidden border border-white/60 shadow-sm">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="text-primary-500" /> My Properties
                </h2>
                <Link
                  to="/properties"
                  className="text-primary-600 text-sm font-bold hover:text-primary-700 transition-colors flex items-center gap-1 group"
                >
                  View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {propertiesLoading ? (
                <div className="space-y-4 flex-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-slate-100/50 rounded-xl skeleton w-full"></div>
                  ))}
                </div>
              ) : propertyIds?.length > 0 ? (
                <div className="space-y-3 flex-1">
                  {propertyIds.slice(0, 5).map((id) => (
                    <Link
                      key={id}
                      to={`/properties/${id}`}
                      className="flex items-center justify-between p-4 bg-white/50 border border-slate-100 rounded-xl hover:bg-white hover:shadow-md hover:border-primary-100 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                          <FileText size={20} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                        </div>
                        <span className="font-bold text-slate-700">Property #{id}</span>
                      </div>
                      <ArrowRight size={18} className="text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 flex-1 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <FileText size={32} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium mb-6">No properties registered yet</p>
                  <Link to="/register-property" className="btn btn-outline text-sm w-full sm:w-auto">
                    <Plus size={16} /> Register First Property
                  </Link>
                </div>
              )}
            </div>

            {/* My Transfers */}
            <div className="glass-panel p-6 sm:p-8 flex flex-col h-full relative overflow-hidden border border-white/60 shadow-sm">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Send className="text-emerald-500" /> My Transfers
                </h2>
                <Link
                  to="/transfers"
                  className="text-primary-600 text-sm font-bold hover:text-primary-700 transition-colors flex items-center gap-1 group"
                >
                  View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {transfersLoading ? (
                <div className="space-y-4 flex-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-slate-100/50 rounded-xl skeleton w-full"></div>
                  ))}
                </div>
              ) : transferIds?.length > 0 ? (
                <div className="space-y-3 flex-1">
                  {transferIds.slice(0, 5).map((id) => (
                    <Link
                      key={id}
                      to={`/transfers/${id}`}
                      className="flex items-center justify-between p-4 bg-white/50 border border-slate-100 rounded-xl hover:bg-white hover:shadow-md hover:border-emerald-100 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                          <Send size={20} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <span className="font-bold text-slate-700">Transfer #{id}</span>
                      </div>
                      <ArrowRight size={18} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 flex-1 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Send size={32} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium mb-6">No active transfers</p>
                  <Link to="/properties" className="btn btn-outline text-sm w-full sm:w-auto">
                    <FileText size={16} /> Browse Properties
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Info */}
          <div className="glass-panel p-6 sm:p-8 flex items-center justify-between border-l-4 border-l-emerald-500 bg-emerald-50/30">
            <div className="w-full flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-800 mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Linked Identity
                </h2>
                <div className="flex items-center gap-4 mt-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-emerald-100 shrink-0">
                    <CheckCircle2 className="text-emerald-500 w-6 h-6" />
                  </div>
                  <div>
                      <p className="font-mono text-sm sm:text-base font-medium text-slate-700 break-all select-all">
                        {user.walletAddress}
                      </p>
                      <p className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-wider">
                        Network Active
                      </p>
                  </div>
                </div>
              </div>
              <ConnectButton showBalance={false} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
