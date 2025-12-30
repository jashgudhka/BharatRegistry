import { useParams, Link } from "react-router-dom";
import { useAccount } from "wagmi";
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  AlertCircle,
} from "lucide-react";
import {
  useTransfer,
  useDepositEscrow,
  useApproveAsSeller,
  useApproveAsGovernment,
  useCompleteTransfer,
  useCancelTransfer,
} from "../hooks/useTransfer";
import { TRANSFER_STATUS_LABELS } from "../utils/constants";
import toast from "react-hot-toast";

const TRANSFER_STEPS = [
  {
    status: "pending",
    label: "Initiated",
    description: "Transfer request created",
  },
  {
    status: "deposited",
    label: "Escrow Deposited",
    description: "Buyer has deposited escrow",
  },
  {
    status: "seller_approved",
    label: "Seller Approved",
    description: "Seller has approved the transfer",
  },
  {
    status: "government_approved",
    label: "Government Approved",
    description: "Government has approved",
  },
  { status: "completed", label: "Completed", description: "Transfer complete" },
];

function TransferProgress({ currentStatus }) {
  const currentIndex = TRANSFER_STEPS.findIndex(
    (s) => s.status === currentStatus
  );

  return (
    <div className="space-y-4">
      {TRANSFER_STEPS.map((step, index) => {
        const isCompleted =
          index < currentIndex || currentStatus === "completed";
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={step.status} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle size={16} />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < TRANSFER_STEPS.length - 1 && (
                <div
                  className={`w-0.5 h-12 ${
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            <div className="flex-1 pb-8">
              <p
                className={`font-medium ${
                  isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {step.label}
              </p>
              <p className="text-sm text-gray-500">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TransferDetails() {
  const { transferId } = useParams();
  const { address, isConnected } = useAccount();
  const { transfer, isLoading, error } = useTransfer(transferId);

  const { depositEscrow, isLoading: depositing } = useDepositEscrow();
  const { approveAsSeller, isLoading: approvingSeller } = useApproveAsSeller();
  const { approveAsGovernment, isLoading: approvingGov } =
    useApproveAsGovernment();
  const { completeTransfer, isLoading: completing } = useCompleteTransfer();
  const { cancelTransfer, isLoading: cancelling } = useCancelTransfer();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="card text-center py-12">
        <Send size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Transfer Not Found
        </h3>
        <p className="text-gray-500 mb-4">
          The transfer you're looking for doesn't exist.
        </p>
        <Link to="/transfers" className="btn btn-primary">
          View All Transfers
        </Link>
      </div>
    );
  }

  const isBuyer =
    isConnected && address?.toLowerCase() === transfer.buyer.toLowerCase();
  const isSeller =
    isConnected && address?.toLowerCase() === transfer.seller.toLowerCase();

  const handleDepositEscrow = async () => {
    try {
      await depositEscrow(transferId, transfer.agreedPrice);
      toast.success("Escrow deposited successfully!");
    } catch (err) {
      toast.error("Failed to deposit escrow");
    }
  };

  const handleApproveAsSeller = async () => {
    try {
      await approveAsSeller(transferId);
      toast.success("Transfer approved!");
    } catch (err) {
      toast.error("Failed to approve transfer");
    }
  };

  const handleApproveAsGovernment = async () => {
    try {
      await approveAsGovernment(transferId);
      toast.success("Government approval granted!");
    } catch (err) {
      toast.error("Failed to approve transfer");
    }
  };

  const handleComplete = async () => {
    try {
      await completeTransfer(transferId);
      toast.success("Transfer completed!");
    } catch (err) {
      toast.error("Failed to complete transfer");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this transfer?")) return;
    try {
      await cancelTransfer(transferId);
      toast.success("Transfer cancelled");
    } catch (err) {
      toast.error("Failed to cancel transfer");
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    deposited: "bg-blue-100 text-blue-800 border-blue-200",
    seller_approved: "bg-indigo-100 text-indigo-800 border-indigo-200",
    government_approved: "bg-purple-100 text-purple-800 border-purple-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    disputed: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/transfers"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={20} />
        Back to Transfers
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Transfer #{transferId}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${
                statusColors[transfer.status]
              }`}
            >
              {TRANSFER_STATUS_LABELS[transfer.status]}
            </span>
          </div>
          <Link
            to={`/properties/${transfer.propertyId}`}
            className="text-primary-500 hover:underline"
          >
            View Property #{transfer.propertyId}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Transfer Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parties */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Parties Involved
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    Seller
                  </span>
                  {isSeller && (
                    <span className="badge badge-verified text-xs">You</span>
                  )}
                </div>
                <p className="font-mono text-sm text-gray-800 break-all">
                  {transfer.seller}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    Buyer
                  </span>
                  {isBuyer && (
                    <span className="badge badge-verified text-xs">You</span>
                  )}
                </div>
                <p className="font-mono text-sm text-gray-800 break-all">
                  {transfer.buyer}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Financial Details
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {transfer.agreedPrice}
                </p>
                <p className="text-sm text-gray-500">Agreed Price (ETH)</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">
                  {transfer.escrowAmount}
                </p>
                <p className="text-sm text-gray-500">In Escrow (ETH)</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {(
                    parseFloat(transfer.agreedPrice) -
                    parseFloat(transfer.escrowAmount)
                  ).toFixed(4)}
                </p>
                <p className="text-sm text-gray-500">Remaining (ETH)</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Transfer Progress
            </h2>
            <TransferProgress currentStatus={transfer.status} />
          </div>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Timeline
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-gray-600">Initiated:</span>
                <span className="font-medium">
                  {transfer.initiatedAt.toLocaleDateString()}
                </span>
              </div>
              {transfer.completedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium">
                    {transfer.completedAt.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {transfer.status !== "completed" &&
            transfer.status !== "cancelled" && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Actions
                </h2>
                <div className="space-y-3">
                  {/* Buyer Actions */}
                  {isBuyer && transfer.status === "pending" && (
                    <button
                      onClick={handleDepositEscrow}
                      disabled={depositing}
                      className="btn btn-primary w-full"
                    >
                      {depositing ? "Depositing..." : "Deposit Escrow"}
                    </button>
                  )}

                  {/* Seller Actions */}
                  {isSeller && transfer.status === "deposited" && (
                    <button
                      onClick={handleApproveAsSeller}
                      disabled={approvingSeller}
                      className="btn btn-primary w-full"
                    >
                      {approvingSeller ? "Approving..." : "Approve Transfer"}
                    </button>
                  )}

                  {/* Government Actions (demo - anyone can approve) */}
                  {transfer.status === "seller_approved" && (
                    <button
                      onClick={handleApproveAsGovernment}
                      disabled={approvingGov}
                      className="btn btn-primary w-full"
                    >
                      {approvingGov ? "Approving..." : "Government Approve"}
                    </button>
                  )}

                  {/* Complete Transfer */}
                  {transfer.status === "government_approved" && (
                    <button
                      onClick={handleComplete}
                      disabled={completing}
                      className="btn btn-primary w-full"
                    >
                      {completing ? "Completing..." : "Complete Transfer"}
                    </button>
                  )}

                  {/* Cancel */}
                  {(isBuyer || isSeller) && transfer.status === "pending" && (
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="btn btn-outline w-full text-red-600 border-red-300 hover:bg-red-50"
                    >
                      {cancelling ? "Cancelling..." : "Cancel Transfer"}
                    </button>
                  )}
                </div>
              </div>
            )}

          {/* Status Messages */}
          {transfer.status === "completed" && (
            <div className="card bg-green-50 border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 mt-0.5" size={20} />
                <div>
                  <h3 className="font-medium text-green-800">
                    Transfer Complete
                  </h3>
                  <p className="text-sm text-green-600 mt-1">
                    The property has been successfully transferred to the new
                    owner.
                  </p>
                </div>
              </div>
            </div>
          )}

          {transfer.status === "cancelled" && (
            <div className="card bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <XCircle className="text-red-500 mt-0.5" size={20} />
                <div>
                  <h3 className="font-medium text-red-800">
                    Transfer Cancelled
                  </h3>
                  <p className="text-sm text-red-600 mt-1">
                    This transfer has been cancelled. Any escrowed funds have
                    been returned.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
