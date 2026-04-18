import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import {
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  ArrowRight,
  Home,
} from "lucide-react";
import { useUserTransfers, useTransfer } from "../hooks/useTransfer";
import { TRANSFER_STATUS_LABELS } from "../utils/constants";

function TransferCard({ transferId, statusFilter }) {
  const { transfer, isLoading } = useTransfer(transferId);

  if (isLoading) {
    return (
      <div className="glass-panel p-6 h-64 skeleton flex flex-col justify-between">
        <div>
          <div className="h-6 bg-slate-200/50 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200/50 rounded w-1/4 mb-6"></div>
          <div className="h-12 bg-slate-200/50 rounded w-full mb-3"></div>
        </div>
        <div className="h-4 bg-slate-200/50 rounded w-1/3 mt-auto"></div>
      </div>
    );
  }

  if (!transfer) return null;

  if (statusFilter !== "all" && transfer.status !== statusFilter) {
    return null;
  }

  const statusIcons = {
    initiated: Clock,
    escrow_funded: Clock,
    approved_by_seller: Clock,
    approved_by_registrar: Clock,
    completed: CheckCircle,
    cancelled: XCircle,
    disputed: XCircle,
  };

  const statusColors = {
    initiated: "badge-pending text-amber-700 bg-amber-50 border-amber-200",
    escrow_funded: "bg-blue-50 text-blue-700 border-blue-200",
    approved_by_seller: "bg-indigo-50 text-indigo-700 border-indigo-200",
    approved_by_registrar: "bg-purple-50 text-purple-700 border-purple-200",
    completed:
      "badge-verified text-emerald-700 bg-emerald-50 border-emerald-200",
    cancelled: "badge-disputed text-red-700 bg-red-50 border-red-200",
    disputed: "badge-disputed text-red-700 bg-red-50 border-red-200",
  };

  const StatusIcon = statusIcons[transfer.status] || Clock;

  return (
    <Link
      to={`/transfers/${transferId}`}
      className="glass-panel p-6 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden flex flex-col h-full bg-white/70 hover:bg-white/90 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(84,129,255,0.15)] border-t-4 border-t-emerald-400"
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-100 rounded-full blur-xl group-hover:bg-emerald-200 transition-colors pointer-events-none"></div>

      <div className="flex justify-between items-start mb-6 relative z-10 w-full">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-5 h-5 text-emerald-500" />
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Transfer #{transferId}
            </h3>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-7 flex items-center gap-1">
            Property #{transfer.propertyId}
          </p>
        </div>
        <span
          className={`badge ${statusColors[transfer.status]} ml-4 shrink-0 mt-1 flex items-center shadow-sm`}
        >
          <StatusIcon size={14} className="mr-1.5" />
          {TRANSFER_STATUS_LABELS[transfer.status]}
        </span>
      </div>

      <div className="space-y-3 text-sm flex-1 relative z-10">
        <div className="flex items-center justify-between p-3 bg-white/60 border border-slate-100 rounded-xl hover:bg-white hover:border-slate-200 transition-colors">
          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">
            Agreed Value
          </span>
          <span className="font-extrabold text-slate-800 text-base">
            ₹ {parseFloat(transfer.agreedPrice).toLocaleString()}{" "}
            <span className="text-xs font-semibold text-slate-400 ml-0.5">
              INR
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl hover:bg-emerald-50 transition-colors">
          <span className="text-emerald-700 font-bold uppercase tracking-wider text-xs">
            Escrow Secured
          </span>
          <span className="font-extrabold text-emerald-700 text-base flex items-center gap-1">
            <CheckCircle size={14} className="text-emerald-500" />₹{" "}
            {parseFloat(transfer.escrowAmount).toLocaleString()}{" "}
            <span className="text-xs font-semibold text-emerald-500 ml-0.5">
              INR
            </span>
          </span>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10 w-full">
        <p className="text-xs font-semibold text-slate-400">
          Init: {transfer.initiatedAt.toLocaleDateString()}
        </p>
        <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold group-hover:translate-x-1 transition-transform">
          Protocol Detail <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

export default function Transfers() {
  const { address, isConnected } = useAccount();
  const { transferIds, isLoading } = useUserTransfers(address);
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div className="space-y-8 animate-fade-in relative z-10 w-full">
      {/* Header */}
      <div className="glass-panel p-8 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-emerald-500 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-40 -z-10 translate-x-1/3 -translate-y-1/3"></div>
        <div className="flex items-center gap-5 w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <Send className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Active Transfers
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              {isConnected
                ? "Manage and monitor your ongoing property exchange protocols."
                : "Connect your identity to view active property transfers."}
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Count Header */}
      {isConnected && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 glass-panel p-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-slate-100 shrink-0 rounded-xl hidden sm:flex items-center justify-center">
              <Filter size={20} className="text-slate-500" />
            </div>
            <select
              className="input py-3 w-full sm:w-auto bg-slate-50 border-slate-200 font-medium text-slate-700 cursor-pointer appearance-none pr-10"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundPosition: `right 1rem center`,
                backgroundRepeat: `no-repeat`,
                backgroundSize: `1.5em 1.5em`,
              }}
            >
              <option value="all">All Status</option>
              <option value="initiated">Initiated</option>
              <option value="escrow_funded">Escrow Funded</option>
              <option value="approved_by_seller">Seller Approved</option>
              <option value="approved_by_registrar">Registrar Approved</option>
              <option value="completed">Fully Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest shrink-0">
              {transferIds?.length || 0} Transfers
            </span>
          </div>
        </div>
      )}

      {/* Transfer Grid */}
      {!isConnected ? (
        <div className="glass-panel border-dashed border-2 border-slate-200 p-12 text-center max-w-2xl mx-auto flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Send size={32} className="text-slate-400" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
            Connect Identity Required
          </h3>
          <p className="text-slate-500 font-medium mb-8 max-w-sm">
            Please authenticate using your Web3 wallet to access your private
            exchange history.
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-panel p-6 h-64 skeleton flex flex-col justify-between"
            >
              <div>
                <div className="h-6 bg-slate-200/50 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-slate-200/50 rounded w-1/4 mb-6"></div>
                <div className="h-12 bg-slate-200/50 rounded w-full mb-3"></div>
              </div>
              <div className="h-4 bg-slate-200/50 rounded w-1/3 mt-auto"></div>
            </div>
          ))}
        </div>
      ) : transferIds?.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transferIds.map((id) => (
            <TransferCard
              key={id}
              transferId={id}
              statusFilter={statusFilter}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel border-dashed border-2 border-slate-200 p-12 text-center max-w-2xl mx-auto flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Send size={32} className="text-emerald-300" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
            No active protocols
          </h3>
          <p className="text-slate-500 font-medium mb-8 max-w-sm">
            You are not currently involved in any property exchange
            transactions.
          </p>
          <Link
            to="/properties"
            className="btn btn-primary px-8 shadow-lg shadow-emerald-500/20"
          >
            Explore Property Registry
          </Link>
        </div>
      )}
    </div>
  );
}
