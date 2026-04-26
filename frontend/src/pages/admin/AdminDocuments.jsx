import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, FileText, Download } from "lucide-react";
import { adminAPI } from "../../utils/api";
import { API_URL } from "../../utils/constants";
import toast from "react-hot-toast";

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPendingDocuments();
      setDocuments(res.data.data.documents);
    } catch (err) {
      console.error("Fetch documents error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleVerify = async (hash, approved) => {
    setActionLoading(hash);
    try {
      const reason = approved ? undefined : prompt("Reason for rejection:");
      if (!approved && !reason) { setActionLoading(null); return; }
      const notes = approved ? prompt("Verification notes (optional):") || "" : "";

      await adminAPI.verifyDocument(hash, approved, reason, notes);
      toast.success(approved ? "Document verified! IPFS hash assigned." : "Document rejected");
      fetchDocuments();
    } catch (err) {
      toast.error("Failed to update document status");
    } finally {
      setActionLoading(null);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Document Verification</h1>
        <p className="text-slate-500 mt-1">Review and approve uploaded documents to assign IPFS hashes</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No pending documents</p>
          <p className="text-slate-400 text-sm mt-1">All documents have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.hash} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{doc.originalName}</p>
                    <div className="flex gap-4 mt-1 text-xs text-slate-500">
                      <span className="font-mono">{doc.hash.slice(0, 16)}...</span>
                      <span>{formatSize(doc.size)}</span>
                      <span className="uppercase font-bold">{doc.documentType?.replace(/_/g, " ")}</span>
                      {doc.propertyId && <span>Property #{doc.propertyId}</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Uploaded by: <span className="font-mono">{doc.uploadedBy?.slice(0, 8)}...{doc.uploadedBy?.slice(-4)}</span>
                      {" • "}{new Date(doc.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`${API_URL}/api/documents/${doc.hash}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1"
                  >
                    <Download size={12} /> View
                  </a>
                  <button
                    onClick={() => handleVerify(doc.hash, true)}
                    disabled={actionLoading === doc.hash}
                    className="btn btn-success text-sm py-2 px-4"
                  >
                    {actionLoading === doc.hash ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleVerify(doc.hash, false)}
                    disabled={actionLoading === doc.hash}
                    className="btn btn-danger text-sm py-2 px-4"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
