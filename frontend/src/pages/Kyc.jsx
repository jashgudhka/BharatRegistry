import React, { useState } from "react";
import { FileText, Upload, Copy, CheckCircle2, Shield } from "lucide-react";
import { documentAPI } from "../utils/api";

export default function Kyc() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [docHash, setDocHash] = useState("");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setUploading(true);
    setError(null);
    setDocHash("");

    try {
      const formData = new FormData();
      formData.append("document", file);
      // Adding a generic document type for KYC
      formData.append("documentType", "Aadhaar / KYC");

      // Assuming your documentAPI wraps 'axios.post("/api/documents/upload", ...)'
      const res = await documentAPI.upload(formData);

      if (res.data?.success) {
        setDocHash(res.data.data.ipfsHash);
      } else {
        throw new Error(res.data?.message || "Upload failed");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to upload document",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = () => {
    if (docHash) {
      navigator.clipboard.writeText(docHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pt-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shadow-inner">
          <Shield className="text-primary-600 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">KYC Center</h1>
          <p className="text-slate-500 text-sm font-medium">
            Upload your Identity Documents to receive your IPFS Hash
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 space-y-8">
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Identity Document (Aadhaar / PAN)
            </label>
            <div className="flex justify-center border-2 border-dashed border-slate-300 rounded-2xl p-10 hover:bg-slate-50 hover:border-primary-400 transition-colors cursor-pointer relative bg-white">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setFile(e.target.files[0])}
                accept=".pdf,.png,.jpg,.jpeg"
              />
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                <p className="text-sm font-semibold text-slate-700">
                  {file ? file.name : "Click or drag file to upload"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PDF, PNG, JPG up to 10MB
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full btn btn-primary flex justify-center items-center py-3 text-base"
          >
            {uploading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Uploading & Hashing...
              </>
            ) : (
              "Upload Document"
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start gap-3">
            <span className="shrink-0 font-bold p-0.5">✕</span>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {docHash && (
          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3 animate-slide-up">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-bold">
                Document Successfully Uploaded to IPFS
              </h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                IPFS Hash (CID)
              </label>
              <div className="flex items-stretch gap-2">
                <div className="flex-1 bg-white border border-emerald-200 rounded-xl px-4 py-2.5 overflow-hidden">
                  <p className="text-sm font-mono text-emerald-900 font-semibold break-all leading-tight">
                    {docHash}
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className="shrink-0 w-12 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-emerald-600 mt-2 font-medium">
                Keep this hash safe. It serves as your immutable proof of
                document existence.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
