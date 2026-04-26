import { useState } from "react";
import {
  Search,
  Building2,
  FileText,
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
} from "lucide-react";
import { bankAPI } from "../../utils/api";
import { truncateAddress } from "../../utils/constants";

export default function BankDashboard() {
  const [searchType, setSearchType] = useState("property");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!searchValue.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let res;
      if (searchType === "property") {
        res = await bankAPI.verifyProperty(searchValue);
      } else {
        res = await bankAPI.verifyDocument(searchValue);
      }
      setResult({ type: searchType, data: res.data.data });
    } catch (err) {
      setError(err.response?.data?.message || "Not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Bank Verification Portal</h1>
        <p className="text-slate-500 mt-1">Verify property ownership and documents for loans, mortgages, and liens</p>
      </div>

      {/* Search */}
      <div className="card p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Verify Property or Document</h2>
        
        <div className="flex gap-3 mb-4">
          {[
            { key: "property", label: "Property ID", icon: Building2 },
            { key: "document", label: "Document Hash", icon: FileText },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setSearchType(key); setResult(null); setError(null); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                searchType === key
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              className="input pl-11"
              placeholder={searchType === "property" ? "Enter Property ID..." : "Enter IPFS document hash..."}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} disabled={loading} className="btn btn-primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            Verify
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-6 border-rose-200 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <XCircle className="text-rose-500" size={24} />
            <div>
              <p className="font-bold text-rose-800">Not Found</p>
              <p className="text-rose-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Property Result */}
      {result?.type === "property" && result.data && (
        <div className="space-y-6 animate-slide-up">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Property Details</h3>
              <span className={`badge ${result.data.isVerified ? "badge-verified" : "badge-pending"}`}>
                {result.data.isVerified ? "✓ Verified" : "Unverified"}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Property ID", value: result.data.property?.propertyId },
                { label: "Survey No.", value: result.data.property?.surveyNumber },
                { label: "Type", value: result.data.property?.propertyType },
                { label: "Area", value: `${result.data.property?.area} sq.m` },
                { label: "Location", value: `${result.data.property?.location?.city || "—"}, ${result.data.property?.location?.state || ""}` },
                { label: "Status", value: result.data.property?.status },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">{item.label}</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{item.value || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Owner Info */}
          {result.data.owner && (
            <div className="card p-6">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Shield size={18} className="text-primary-500" /> Owner Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Name:</span> <span className="font-bold">{result.data.owner.fullName}</span></div>
                <div><span className="text-slate-500">Wallet:</span> <span className="font-mono font-bold">{truncateAddress(result.data.owner.walletAddress, 6)}</span></div>
                <div><span className="text-slate-500">PAN:</span> <span className="font-mono font-bold">{result.data.owner.panNumber}</span></div>
                <div>
                  <span className="text-slate-500">KYC Status:</span>{" "}
                  <span className={`font-bold ${result.data.owner.isVerified ? "text-emerald-600" : "text-amber-600"}`}>
                    {result.data.owner.isVerified ? "Verified ✓" : "Pending"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Lien Status */}
          <div className="card p-6">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" /> Lien Check
            </h3>
            {result.data.lienStatus?.hasActiveLien ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                <AlertTriangle className="text-amber-500" size={20} />
                <div>
                  <p className="font-bold text-amber-800">Active Lien Detected</p>
                  <p className="text-amber-700 text-sm">{result.data.lienStatus.activeTransferCount} active transfer(s) on this property</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500" size={20} />
                <div>
                  <p className="font-bold text-emerald-800">No Active Liens</p>
                  <p className="text-emerald-700 text-sm">Property is clear for loan/mortgage processing</p>
                </div>
              </div>
            )}
          </div>

          {/* Verified Documents */}
          {result.data.documents?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <FileText size={18} className="text-indigo-500" /> Verified Documents ({result.data.documents.length})
              </h3>
              <div className="space-y-2">
                {result.data.documents.map((doc) => (
                  <div key={doc.hash} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{doc.originalName}</p>
                      <p className="text-xs text-slate-500 font-mono">{doc.hash}</p>
                    </div>
                    <span className="badge badge-verified">Verified</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transfer History */}
          {result.data.transferHistory?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <History size={18} className="text-blue-500" /> Transfer History
              </h3>
              <div className="space-y-2">
                {result.data.transferHistory.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-sm text-slate-800">
                        <span className="font-mono">{truncateAddress(tx.seller)}</span>
                        {" → "}
                        <span className="font-mono">{truncateAddress(tx.buyer)}</span>
                      </p>
                      <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`badge badge-${tx.status === "completed" ? "verified" : "pending"}`}>{tx.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Document Result */}
      {result?.type === "document" && result.data && (
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-800">Document Verification</h3>
            <span className={`badge ${result.data.isAuthentic ? "badge-verified" : "badge-disputed"}`}>
              {result.data.isAuthentic ? "✓ Authentic" : "Not Verified"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">File:</span> <span className="font-bold">{result.data.document?.originalName}</span></div>
            <div><span className="text-slate-500">Type:</span> <span className="font-bold uppercase">{result.data.document?.documentType?.replace(/_/g, " ")}</span></div>
            <div><span className="text-slate-500">Hash:</span> <span className="font-mono font-bold text-xs">{result.data.document?.hash}</span></div>
            <div><span className="text-slate-500">Status:</span> <span className="font-bold capitalize">{result.data.document?.status}</span></div>
            <div><span className="text-slate-500">Uploaded:</span> <span className="font-bold">{new Date(result.data.document?.createdAt).toLocaleString()}</span></div>
            {result.data.document?.verifiedAt && (
              <div><span className="text-slate-500">Verified:</span> <span className="font-bold">{new Date(result.data.document.verifiedAt).toLocaleString()}</span></div>
            )}
          </div>

          {result.data.property && (
            <div className="mt-4 p-4 bg-primary-50 rounded-xl">
              <p className="text-sm font-bold text-primary-800">
                Linked to Property #{result.data.property.propertyId} — {result.data.property.surveyNumber}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
