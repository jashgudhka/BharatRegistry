import { useState } from "react";
import { X, Send } from "lucide-react";
import toast from "react-hot-toast";
import { useInitiateTransfer } from "../../hooks/useTransfer";

export default function InitiateTransferModal({
  propertyId,
  marketValue,
  onClose,
}) {
  const { initiateTransfer, isLoading } = useInitiateTransfer();
  const [agreedPrice, setAgreedPrice] = useState(marketValue);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreedPrice || parseFloat(agreedPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      await initiateTransfer(propertyId, agreedPrice);
      toast.success("Transfer initiated! Please deposit escrow to continue.");
      onClose();
    } catch (err) {
      toast.error("Failed to initiate transfer");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-panel max-w-md w-full p-0 overflow-hidden shadow-2xl border-white/40">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white/50">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Initiate Purchase Protocol
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl transition-all hover:shadow-sm"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-primary-50/50 border border-primary-100 rounded-2xl p-5">
            <p className="text-sm text-slate-600 leading-relaxed">
              You are initiating a settlement protocol for{" "}
              <strong className="text-primary-700">Property #{propertyId}</strong>. 
              The reference market valuation is <strong className="text-primary-700">₹{parseFloat(marketValue).toLocaleString()} INR</strong>.
            </p>
          </div>

          <div>
            <label className="label text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Agreed Purchase Price (INR)</label>
            <div className="relative">
              <input
                type="text"
                className="input py-4 pl-10 pr-16 text-lg font-black text-slate-800 bg-slate-50/50 border-slate-200 focus:bg-white"
                value={agreedPrice}
                onChange={(e) => setAgreedPrice(e.target.value)}
                placeholder="Enter amount in ₹"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-300 text-sm">INR</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-2 italic px-1">
              * This value will be locked in the smart escrow contract.
            </p>
          </div>

          <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-4 flex gap-3">
             <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-amber-600 font-bold text-sm">!</span>
             </div>
             <p className="text-xs text-amber-800 font-medium leading-relaxed">
              After initiation, you must secure the full amount in the 
              consortium escrow. Funds remain locked until consensus is reached.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1 py-3 font-bold border-2"
            >
              Abort
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary flex-1 py-3 font-black shadow-lg shadow-primary-500/20"
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Send size={18} />
                  Confirm
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
