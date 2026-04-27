import { useState } from "react";
import {
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { documentAPI } from "../utils/api";
import toast from "react-hot-toast";

export default function DocumentVerify() {
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    if (!hash.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await documentAPI.verifyDocument(hash.trim());
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Document not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-primary-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-800 mb-3">
          Verify <span className="gradient-text">Document</span>
        </h1>
        <p className="text-slate-600 text-lg">
          Enter an IPFS document hash to verify its authenticity and ownership on the blockchain
        </p>
      </div>

      {/* Search & Upload */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Search size={20} className="text-primary-500" /> Search by Hash
            </h2>
            <label className="label text-xs uppercase tracking-wider font-bold text-slate-400">
              IPFS Content ID (CID)
            </label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  className="input pl-11 font-mono text-sm"
                  placeholder="Qm..."
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
              </div>
              <button onClick={handleVerify} disabled={loading} className="btn btn-primary px-5">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-4">
            Verify authenticity of an existing CID on the blockchain.
          </p>
        </div>

        <div className="card p-8 border-dashed border-2 border-primary-200 bg-primary-50/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary-100 rounded-full blur-2xl group-hover:bg-primary-200 transition-colors"></div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ExternalLink size={20} className="text-primary-500" /> Upload & Get Hash
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Need to know the IPFS hash of a file? Upload it here to compute the CID and register it on our backend.
          </p>
          <input
            type="file"
            id="tool-upload"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setLoading(true);
              try {
                const formData = new FormData();
                formData.append("document", file);
                formData.append("documentType", "other");
                const res = await documentAPI.upload(formData);
                setHash(res.data.data.hash);
                toast.success("File uploaded! Hash retrieved.");
              } catch (err) {
                toast.error("Upload failed");
              } finally {
                setLoading(false);
              }
            }}
          />
          <button
            onClick={() => document.getElementById("tool-upload").click()}
            disabled={loading}
            className="btn btn-outline border-primary-300 text-primary-600 hover:bg-primary-500 hover:text-white w-full py-4 text-base font-bold shadow-sm"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
            Select File to Upload
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-6 border-rose-200 bg-rose-50/50 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center">
              <XCircle className="text-rose-500" size={24} />
            </div>
            <div>
              <p className="font-bold text-rose-800">Document Not Found</p>
              <p className="text-rose-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card p-8 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Verification Result</h2>
            <span className={`badge ${result.status === "verified" ? "badge-verified" : result.status === "rejected" ? "badge-disputed" : "badge-pending"}`}>
              {result.status === "verified" ? "✓ Verified" : result.status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
            </span>
          </div>

          <div className="space-y-4">
            {result.status === "verified" && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={24} />
                <div>
                  <p className="font-bold text-emerald-800">Document is Authentic</p>
                  <p className="text-emerald-700 text-sm">This document has been verified by a government official</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Document Name</p>
                <p className="font-semibold text-slate-800">{result.originalName}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Document Type</p>
                <p className="font-semibold text-slate-800 uppercase">{result.documentType?.replace(/_/g, " ")}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Hash</p>
                <p className="font-mono text-sm text-slate-700 break-all">{result.hash}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">File Size</p>
                <p className="font-semibold text-slate-800">
                  {result.size < 1024 * 1024
                    ? `${(result.size / 1024).toFixed(1)} KB`
                    : `${(result.size / (1024 * 1024)).toFixed(1)} MB`}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Uploaded By</p>
                <p className="font-mono text-sm text-slate-700">{result.uploadedBy}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Upload Date</p>
                <p className="font-semibold text-slate-800">{new Date(result.uploadedAt).toLocaleString()}</p>
              </div>
              {result.verifiedBy && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Verified By</p>
                  <p className="font-mono text-sm text-slate-700">{result.verifiedBy}</p>
                </div>
              )}
              {result.verifiedAt && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Verified At</p>
                  <p className="font-semibold text-slate-800">{new Date(result.verifiedAt).toLocaleString()}</p>
                </div>
              )}
              {result.propertyId && (
                <div className="p-4 bg-primary-50 rounded-xl col-span-full">
                  <p className="text-xs font-bold text-primary-400 uppercase mb-1">Linked Property</p>
                  <p className="font-semibold text-primary-800">
                    Property #{result.propertyId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
