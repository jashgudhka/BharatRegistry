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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Initiate Purchase
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              You are about to initiate a purchase for{" "}
              <strong>Property #{propertyId}</strong>. The current market value
              is <strong>{marketValue} ETH</strong>.
            </p>
          </div>

          <div>
            <label className="label">Agreed Price (ETH)</label>
            <input
              type="text"
              className="input"
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
              placeholder="Enter agreed price"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is the price you agree to pay for the property
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> After initiating, you will need to deposit
              the agreed amount as escrow. The funds will be held until the
              transfer is completed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary flex-1"
            >
              {isLoading ? (
                "Initiating..."
              ) : (
                <>
                  <Send size={18} />
                  Initiate Transfer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
