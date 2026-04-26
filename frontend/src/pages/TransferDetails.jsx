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
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import {
  useTransfer,
  useDepositEscrow,
  useApproveAsSeller,
  useApproveAsGovernment,
  useCompleteTransfer,
  useCancelTransfer,
} from "../hooks/useTransfer";
import { useAuth } from "../hooks/useAuth";
import { TRANSFER_STATUS_LABELS } from "../utils/constants";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "../config/wagmi";
import toast from "react-hot-toast";

const TRANSFER_STEPS = [
  {
    status: "initiated",
    label: "Protocol Initiated",
    description: "Exchange request registered on network",
  },
  {
    status: "escrow_funded",
    label: "Escrow Secured",
    description: "Funds locked in smart contract",
  },
  {
    status: "approved_by_seller",
    label: "Seller Verified",
    description: "Asset release cryptographically signed",
  },
  {
    status: "approved_by_registrar",
    label: "Authority Verified",
    description: "Consortium node consensus achieved",
  },
  {
    status: "completed",
    label: "Finalized",
    description: "Asset & funds distributed",
  },
];

function TransferProgress({ currentStatus }) {
  const currentIndex = TRANSFER_STEPS.findIndex(
    (s) => s.status === currentStatus,
  );

  return (
    <div className="relative pt-6 pb-2">
      {/* Connector Line */}
      <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-100 z-0">
        <div
          className="absolute top-0 left-0 w-full bg-emerald-500 transition-all duration-1000 ease-in-out"
          style={{
            height: `${currentIndex > 0 ? (currentIndex / (TRANSFER_STEPS.length - 1)) * 100 : 0}%`,
          }}
        ></div>
      </div>

      <div className="space-y-8 relative z-10">
        {TRANSFER_STEPS.map((step, index) => {
          const isCompleted =
            currentStatus === "completed" || index < currentIndex;
          const isCurrent =
            index === currentIndex && currentStatus !== "completed";
          const isPending = index > currentIndex;

          return (
            <div
              key={step.status}
              className={`flex items-start gap-5 group ${isPending ? "opacity-50" : "opacity-100"}`}
            >
              <div className="flex flex-col items-center">
                {isCompleted ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transform scale-110 transition-transform">
                    <CheckCircle size={20} className="drop-shadow-sm" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-10 h-10 rounded-full bg-white border-4 border-emerald-500 text-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse-glow">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute opacity-75"></div>
                    <span className="text-sm font-black relative z-10">
                      {index + 1}
                    </span>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center group-hover:border-slate-300 transition-colors">
                    <span className="text-sm font-bold">{index + 1}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 pt-1.5 pb-2">
                <p
                  className={`font-extrabold tracking-tight ${
                    isCompleted
                      ? "text-slate-900"
                      : isCurrent
                        ? "text-emerald-700 text-lg"
                        : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-sm mt-0.5 ${isCurrent ? "text-emerald-600/80 font-medium" : "text-slate-500"}`}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TransferDetails() {
  const { transferId } = useParams();
  const { address, isConnected } = useAccount();
  const { hasWallet, isRegistrar } = useAuth();
  const { transfer, isLoading, error } = useTransfer(transferId);

  const { depositEscrow, isLoading: depositing } = useDepositEscrow();
  const { approveAsSeller, isLoading: approvingSeller } = useApproveAsSeller();
  const { approveAsGovernment, isLoading: approvingGov } =
    useApproveAsGovernment();
  const { completeTransfer, isLoading: completing } = useCompleteTransfer();
  const { cancelTransfer, isLoading: cancelling } = useCancelTransfer();

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in relative z-10 w-full">
        <div className="w-32 h-6 bg-slate-200/50 rounded mb-8 animate-pulse"></div>
        <div className="glass-panel p-8 skeleton h-32 mb-8">
          <div className="h-8 bg-slate-200/50 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-200/50 rounded w-1/4"></div>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="glass-panel p-8 lg:col-span-2 skeleton h-96"></div>
          <div className="glass-panel p-8 skeleton h-[500px]"></div>
        </div>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="max-w-3xl mx-auto w-full relative z-10 pt-12">
        <div className="glass-panel p-12 text-center border-dashed border-2 border-slate-200">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Send size={40} className="text-slate-300" />
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-3">
            Protocol Not Found
          </h3>
          <p className="text-slate-500 font-medium text-lg mb-10 max-w-md mx-auto">
            The requested transfer protocol could not be located on the
            distributed ledger.
          </p>
          <Link
            to="/transfers"
            className="btn btn-primary px-8 shadow-xl shadow-primary-500/20"
          >
            Return to Active Transfers
          </Link>
        </div>
      </div>
    );
  }

  const isBuyer =
    isConnected &&
    hasWallet &&
    address?.toLowerCase() === transfer.buyer.toLowerCase();
  const isSeller =
    isConnected &&
    hasWallet &&
    address?.toLowerCase() === transfer.seller.toLowerCase();

  const waitForReceiptAndToast = async (txHash, successMessage) => {
    await waitForTransactionReceipt(config, { hash: txHash });
    toast.success(successMessage);
  };

  const handleDepositEscrow = async () => {
    try {
      const txHash = await depositEscrow(transferId, transfer.agreedPrice);
      await waitForReceiptAndToast(
        txHash,
        "Escrow funds secured mathematically!",
      );
    } catch (err) {
      toast.error("Transaction failed to process");
    }
  };

  const handleApproveAsSeller = async () => {
    try {
      const txHash = await approveAsSeller(transferId);
      await waitForReceiptAndToast(txHash, "Asset release verified!");
    } catch (err) {
      toast.error("Signature verification failed");
    }
  };

  const handleApproveAsGovernment = async () => {
    try {
      const txHash = await approveAsGovernment(transferId);
      await waitForReceiptAndToast(
        txHash,
        "Consortium node consensus recorded!",
      );
    } catch (err) {
      toast.error("Consensus validation failed");
    }
  };

  const handleComplete = async () => {
    try {
      const txHash = await completeTransfer(transferId);
      await waitForReceiptAndToast(txHash, "Protocol execution finalized!");
    } catch (err) {
      toast.error("Execution reverted");
    }
  };

  const handleCancel = async () => {
    if (
      !confirm(
        "Are you certain you wish to abort this exchange protocol? Funds will be refunded.",
      )
    )
      return;

    const reason = window.prompt(
      "Please provide a reason for cancellation:",
      "Cancelled by participant",
    );

    if (!reason || !reason.trim()) {
      toast.error("Cancellation reason is required");
      return;
    }

    try {
      const txHash = await cancelTransfer(transferId, reason.trim());
      await waitForReceiptAndToast(txHash, "Protocol aborted successfully");
    } catch (err) {
      toast.error("Abort sequence failed");
    }
  };

  const statusColors = {
    initiated:
      "text-amber-700 bg-amber-50 border-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.15)]",
    escrow_funded:
      "text-blue-700 bg-blue-50 border-blue-200 shadow-[0_0_15px_rgba(96,165,250,0.15)]",
    approved_by_seller:
      "text-indigo-700 bg-indigo-50 border-indigo-200 shadow-[0_0_15px_rgba(129,140,248,0.15)]",
    approved_by_registrar:
      "text-purple-700 bg-purple-50 border-purple-200 shadow-[0_0_15px_rgba(192,132,252,0.15)]",
    completed:
      "text-emerald-700 bg-emerald-50 border-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.15)]",
    cancelled:
      "text-red-700 bg-red-50 border-red-200 shadow-[0_0_15px_rgba(248,113,113,0.15)]",
    disputed:
      "text-red-700 bg-red-50 border-red-200 shadow-[0_0_15px_rgba(248,113,113,0.15)]",

    // Legacy aliases to avoid broken badges for historical records.
    pending:
      "text-amber-700 bg-amber-50 border-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.15)]",
    deposited:
      "text-blue-700 bg-blue-50 border-blue-200 shadow-[0_0_15px_rgba(96,165,250,0.15)]",
    seller_approved:
      "text-indigo-700 bg-indigo-50 border-indigo-200 shadow-[0_0_15px_rgba(129,140,248,0.15)]",
    government_approved:
      "text-purple-700 bg-purple-50 border-purple-200 shadow-[0_0_15px_rgba(192,132,252,0.15)]",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative z-10 w-full pb-12">
      {/* Back Button */}
      <Link
        to="/transfers"
        className="inline-flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-xs hover:text-primary-600 transition-colors bg-white/50 px-4 py-2 rounded-full border border-slate-200 hover:border-primary-200 shadow-sm w-fit"
      >
        <ArrowLeft size={16} />
        Return to Dashboard
      </Link>

      {/* Header Panel */}
      <div className="glass-panel p-8 sm:p-10 relative overflow-hidden shadow-lg border-b border-primary-100/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary-400/20 to-indigo-400/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Send className="text-white w-6 h-6" />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Transfer{" "}
                <span className="text-primary-600 font-mono">
                  #{transferId}
                </span>
              </h1>
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${
                  statusColors[transfer.status]
                }`}
              >
                {TRANSFER_STATUS_LABELS[transfer.status]}
              </span>
            </div>
            <Link
              to={`/properties/${transfer.propertyId}`}
              className="inline-flex items-center gap-1.5 text-primary-600 font-bold hover:text-primary-700 hover:underline underline-offset-4 decoration-2 text-sm mt-3 ml-[72px]"
            >
              Inspect Asset Definition #{transfer.propertyId}
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="flex items-center gap-3 bg-white/60 p-3 pr-5 rounded-2xl border border-slate-200 shadow-sm whitespace-nowrap md:self-stretch">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="text-emerald-600 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Network Status
              </p>
              <p className="text-sm font-extrabold text-slate-700">
                Consortium Secured
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Transfer Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Parties */}
          <div className="glass-panel p-8 relative overflow-hidden">
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-10 border-b border-l border-slate-100 opacity-50"></div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <User size={16} className="stroke-[2.5]" />
              </div>
              Cryptographic Identities
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-5 bg-white/60 border border-slate-200 hover:border-indigo-300 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>{" "}
                    Current Owner
                  </span>
                  {isSeller && (
                    <span className="badge badge-verified bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] px-2 py-0.5">
                      Your Identity
                    </span>
                  )}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono text-sm text-slate-700 break-all shadow-inner group-hover:bg-indigo-50/30 transition-colors">
                  {transfer.seller}
                </div>
              </div>
              <div className="p-5 bg-white/60 border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{" "}
                    Transferee
                  </span>
                  {isBuyer && (
                    <span className="badge badge-verified border-emerald-200 text-[10px] px-2 py-0.5">
                      Your Identity
                    </span>
                  )}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono text-sm text-slate-700 break-all shadow-inner group-hover:bg-emerald-50/30 transition-colors">
                  {transfer.buyer}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="glass-panel p-8 relative overflow-hidden">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 stroke-[2.5]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              Ledger Settlement
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center shadow-sm relative group overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-300 group-hover:bg-slate-400 transition-colors"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Agreed Valuation
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-black text-slate-800 tracking-tight">
                    ₹
                  </span>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">
                    {parseFloat(transfer.agreedPrice).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center shadow-sm relative group overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-300 group-hover:bg-emerald-400 transition-colors"></div>
                <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-widest mb-2">
                  Smart Escrow Lock
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-black text-emerald-700 tracking-tight">
                    ₹
                  </span>
                  <p className="text-3xl font-black text-emerald-700 tracking-tight">
                    {parseFloat(transfer.escrowAmount).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center shadow-sm relative group overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-300 group-hover:bg-slate-400 transition-colors"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Pending Balance
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-black text-slate-800 tracking-tight">
                    ₹
                  </span>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">
                    {(
                      parseFloat(transfer.agreedPrice) -
                      parseFloat(transfer.escrowAmount)
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Timeline & Actions */}
        <div className="space-y-8">
          {/* Timeline & Progress Panel */}
          <div className="glass-panel p-8 relative overflow-hidden border-t-4 border-t-blue-400">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-bl-full -z-10"></div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock size={16} className="stroke-[2.5]" />
                </div>
                Protocol State
              </span>
            </h2>

            <div className="bg-white/50 rounded-2xl p-4 mb-6 border border-slate-100 shadow-inner">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Calendar size={14} /> Created:
                </span>
                <span className="font-bold text-slate-800 tracking-tight">
                  {transfer.initiatedAt.toLocaleDateString()}
                </span>
              </div>
              {transfer.completedAt && (
                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-slate-100">
                  <span className="text-green-600 font-medium flex items-center gap-1.5">
                    <CheckCircle size={14} /> Finalized:
                  </span>
                  <span className="font-bold text-slate-800 tracking-tight">
                    {transfer.completedAt.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <TransferProgress currentStatus={transfer.status} />
          </div>

          {/* Status Messages */}
          {transfer.status === "completed" && (
            <div className="glass-panel bg-emerald-50/80 border-l-4 border-l-emerald-500 p-6 shadow-sm transform hover:scale-[1.02] transition-transform">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="text-emerald-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-800 tracking-tight mb-1">
                    Protocol Execution Complete
                  </h3>
                  <p className="text-sm font-medium text-emerald-700/80 leading-relaxed">
                    The digital asset representation has been immutably
                    transferred to the new owner. Financial settlement is
                    finalized.
                  </p>
                </div>
              </div>
            </div>
          )}

          {transfer.status === "cancelled" && (
            <div className="glass-panel bg-red-50/80 border-l-4 border-l-red-500 p-6 shadow-sm transform hover:scale-[1.02] transition-transform">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <XCircle className="text-red-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-red-800 tracking-tight mb-1">
                    Protocol Aborted
                  </h3>
                  <p className="text-sm font-medium text-red-700/80 leading-relaxed">
                    This transfer sequence was intentionally halted. All locked
                    escrow funds have been autonomously returned via smart
                    contract logic.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Module */}
          {transfer.status !== "completed" &&
            transfer.status !== "cancelled" && (
              <div className="glass-panel p-6 border-t-4 border-t-primary-500 shadow-[0_20px_40px_-15px_rgba(84,129,255,0.2)] bg-gradient-to-br from-white to-primary-50/30">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary-700 mb-5 flex items-center justify-center gap-2">
                  <ShieldCheck size={16} /> Required Action
                </h2>

                <div className="space-y-4">
                  {/* Buyer Actions */}
                  {isBuyer && transfer.status === "initiated" && (
                    <button
                      onClick={handleDepositEscrow}
                      disabled={depositing}
                      className="btn btn-primary w-full py-4 text-base font-black tracking-tight shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {depositing ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>{" "}
                            Securing Funds...
                          </>
                        ) : (
                          "Secure Escrow Funds"
                        )}
                      </span>
                    </button>
                  )}

                  {/* Seller Actions */}
                  {isSeller && transfer.status === "escrow_funded" && (
                    <button
                      onClick={handleApproveAsSeller}
                      disabled={approvingSeller}
                      className="btn btn-primary w-full py-4 text-base font-black tracking-tight shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 relative overflow-hidden group"
                    >
                      <span className="relative z-10">
                        {approvingSeller
                          ? "Signing..."
                          : "Digitally Sign Transfer"}
                      </span>
                    </button>
                  )}

                  {/* Registrar actions */}
                  {isRegistrar && transfer.status === "approved_by_seller" && (
                    <button
                      onClick={handleApproveAsGovernment}
                      disabled={approvingGov}
                      className="btn w-full py-4 text-base font-black tracking-tight bg-slate-800 text-white hover:bg-slate-900 shadow-xl shadow-slate-900/20 hover:-translate-y-1 transition-all disabled:opacity-50"
                    >
                      {approvingGov
                        ? "Validating..."
                        : "Execute Consensus Validation"}
                    </button>
                  )}

                  {/* Complete Transfer */}
                  {(isBuyer || isSeller || isRegistrar) &&
                    transfer.status === "approved_by_registrar" && (
                      <button
                        onClick={handleComplete}
                        disabled={completing}
                        className="btn w-full py-4 text-base font-black tracking-tight bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 border-none hover:-translate-y-1 transition-all disabled:opacity-50"
                      >
                        {completing
                          ? "Finalizing Ledger..."
                          : "Finalize Protocol Execution"}
                      </button>
                    )}

                  {/* Cancel */}
                  {(isBuyer || isSeller) && transfer.status === "initiated" && (
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="btn btn-outline w-full py-3 mt-4 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold tracking-tight"
                    >
                      {cancelling ? "Aborting..." : "Abort Exchange Protocol"}
                    </button>
                  )}

                  {/* Empty state for non-actionable users */}
                  {!(
                    (isBuyer && transfer.status === "initiated") ||
                    (isSeller && transfer.status === "escrow_funded") ||
                    (isRegistrar && transfer.status === "approved_by_seller") ||
                    ((isBuyer || isSeller || isRegistrar) &&
                      transfer.status === "approved_by_registrar")
                  ) && (
                    <div className="text-center py-4 bg-white/50 rounded-xl border border-slate-100">
                      <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-500">
                        Waiting for counterparty action...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
