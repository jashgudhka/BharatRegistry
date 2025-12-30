import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { Filter, Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { useUserTransfers, useTransfer } from "../hooks/useTransfer";
import { TRANSFER_STATUS_LABELS } from "../utils/constants";

function TransferCard({ transferId }) {
  const { transfer, isLoading } = useTransfer(transferId);

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!transfer) return null;

  const statusIcons = {
    pending: Clock,
    deposited: Clock,
    seller_approved: Clock,
    government_approved: Clock,
    completed: CheckCircle,
    cancelled: XCircle,
    disputed: XCircle,
  };

  const statusColors = {
    pending: "badge-pending",
    deposited: "bg-blue-100 text-blue-800",
    seller_approved: "bg-indigo-100 text-indigo-800",
    government_approved: "bg-purple-100 text-purple-800",
    completed: "badge-verified",
    cancelled: "badge-disputed",
    disputed: "badge-disputed",
  };

  const StatusIcon = statusIcons[transfer.status] || Clock;

  return (
    <Link
      to={`/transfers/${transferId}`}
      className="card hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            Transfer #{transferId}
          </h3>
          <p className="text-sm text-gray-500">
            Property #{transfer.propertyId}
          </p>
        </div>
        <span className={`badge ${statusColors[transfer.status]}`}>
          <StatusIcon size={14} className="mr-1" />
          {TRANSFER_STATUS_LABELS[transfer.status]}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between text-gray-600">
          <span>Amount</span>
          <span className="font-medium">{transfer.agreedPrice} ETH</span>
        </div>
        <div className="flex items-center justify-between text-gray-600">
          <span>Escrow</span>
          <span className="font-medium">{transfer.escrowAmount} ETH</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Initiated: {transfer.initiatedAt.toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}

export default function Transfers() {
  const { address, isConnected } = useAccount();
  const { transferIds, isLoading } = useUserTransfers(address);
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
        <p className="text-gray-600 mt-1">
          {isConnected
            ? "View and manage your property transfers"
            : "Connect your wallet to view your transfers"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="deposited">Deposited</option>
            <option value="seller_approved">Seller Approved</option>
            <option value="government_approved">Government Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      {isConnected && (
        <div className="text-sm text-gray-500">
          Showing {transferIds?.length || 0} transfers
        </div>
      )}

      {/* Transfer Grid */}
      {!isConnected ? (
        <div className="card text-center py-12">
          <Send size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-500">
            Connect your wallet to view your property transfers
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : transferIds?.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transferIds.map((id) => (
            <TransferCard key={id} transferId={id} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Send size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No transfers yet
          </h3>
          <p className="text-gray-500 mb-4">
            You haven't initiated or received any property transfers yet.
          </p>
          <Link to="/properties" className="btn btn-primary">
            Browse Properties
          </Link>
        </div>
      )}
    </div>
  );
}
