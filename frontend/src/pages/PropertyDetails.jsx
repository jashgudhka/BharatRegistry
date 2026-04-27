import { useParams, Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ArrowLeft, MapPin, Maximize, Tag, User, Calendar, FileText, ExternalLink, Send, Shield, Activity, Share2, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useProperty, useIsPropertyVerified } from '../hooks/useContract'
import { usePropertyTransfers } from '../hooks/useTransfer'
import { useAuth } from '../hooks/useAuth'
import { PROPERTY_STATUS_LABELS } from '../utils/constants'
import InitiateTransferModal from '../components/transfer/InitiateTransferModal'
import { useState } from 'react'
import { adminAPI } from '../utils/api'
import toast from 'react-hot-toast'

export default function PropertyDetails() {
  const { id: propertyId } = useParams()
  const { address, isConnected } = useAccount()
  const { hasWallet } = useAuth()
  const { property, isLoading, error } = useProperty(propertyId)
  const { isVerified } = useIsPropertyVerified(propertyId)
  const { transferIds } = usePropertyTransfers(propertyId)
  const [showTransferModal, setShowTransferModal] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto w-full animate-fade-in">
        <div className="flex gap-4 items-center mb-4">
          <div className="w-24 h-8 bg-slate-200/50 rounded-lg skeleton"></div>
        </div>
        <div className="glass-panel p-8 skeleton h-32 flex flex-col justify-center">
          <div className="h-8 bg-slate-200/50 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-200/50 rounded w-1/4"></div>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              <div className="glass-panel p-8 h-64 skeleton"></div>
              <div className="glass-panel p-8 h-48 skeleton"></div>
           </div>
           <div className="space-y-8">
              <div className="glass-panel p-8 h-32 skeleton"></div>
           </div>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="glass-panel border-dashed border-2 p-12 text-center max-w-2xl mx-auto flex flex-col items-center mt-12 animate-fade-in">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <FileText size={32} className="text-slate-400" />
        </div>
        <h3 className="text-2xl font-extrabold text-slate-800 mb-2 mt-4 tracking-tight">Property Not Found</h3>
        <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
          The property record you're querying might not exist or hasn't propagated through the blockchain network yet.
        </p>
        <Link to="/properties" className="btn btn-primary px-8">
          Browse Public Registry
        </Link>
      </div>
    )
  }

  const { isOwner, isAdmin, isVerifier, isRegistrar, isSuperAdmin } = useAuth()
  const [actionLoading, setActionLoading] = useState(false)

  const handleVerify = async (approved) => {
    setActionLoading(true)
    try {
      const reason = approved ? undefined : prompt("Reason for rejection:")
      if (!approved && !reason) return
      
      await adminAPI.verifyProperty(propertyId, approved, reason)
      toast.success(approved ? "Property verified!" : "Property rejected")
      // Refresh logic would go here, usually reloading the page or re-fetching property
      window.location.reload()
    } catch (err) {
      toast.error("Failed to update property status")
    } finally {
      setActionLoading(false)
    }
  }

  const canVerify = (isVerifier || isAdmin || isSuperAdmin) && property.status === 'pending'
  const canRegister = (isRegistrar || isAdmin || isSuperAdmin) && property.status === 'pending'
  
  const isPropertyOwner = isConnected && hasWallet && address?.toLowerCase() === property.currentOwner.toLowerCase()
  const canBuy = isConnected && hasWallet && !isPropertyOwner && property.status === 'verified' && user?.isVerified

  const statusColors = {
    pending: 'badge-pending',
    verified: 'badge-verified',
    disputed: 'badge-disputed',
    transferred: 'badge-transferred',
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-12 w-full px-4">
      {/* Back Button */}
      <Link to="/properties" className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-primary-600 transition-colors uppercase tracking-wider text-sm bg-white/50 px-4 py-2 rounded-xl backdrop-blur-md shadow-sm border border-white">
        <ArrowLeft size={16} className="stroke-[3]" />
        Back to Registry
      </Link>

      {/* Header Panel */}
      <div className="glass-panel p-8 relative overflow-hidden border-l-4 border-l-primary-500 shadow-lg">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 relative z-10 w-full">
          <div>
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-white/80 rounded-xl shadow-sm flex items-center justify-center text-primary-500 border border-slate-100 shadow-inner">
                 <FileText className="w-6 h-6" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Property <span className="text-primary-600">#{propertyId}</span></h1>
              <span className={`badge ${statusColors[property.status]} text-sm px-4 py-1.5`}>
                {PROPERTY_STATUS_LABELS[property.status]}
              </span>
            </div>
            <p className="text-slate-500 font-bold tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              Survey No: <span className="text-slate-700">{property.surveyNumber}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
             <button className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary-500 hover:-translate-y-1 transition-all">
                <Share2 className="w-5 h-5" />
             </button>
            
            {(canVerify || canRegister) && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleVerify(true)}
                  disabled={actionLoading}
                  className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-none px-6"
                >
                  {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Approve Asset
                </button>
                <button
                  onClick={() => handleVerify(false)}
                  disabled={actionLoading}
                  className="btn bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200 px-6 font-bold"
                >
                  <XCircle size={18} /> Dispute
                </button>
              </div>
            )}

            {isBank && (
              <button
                onClick={() => toast.success("Mortgage process initiated for internal bank review.")}
                className="btn bg-indigo-600 text-white hover:bg-indigo-700 border-none px-6"
              >
                <div className="flex items-center gap-2">
                  <Shield size={18} />
                  <span className="font-bold">Initiate Mortgage Lien</span>
                </div>
              </button>
            )}

            {canBuy && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="btn btn-primary shadow-xl shadow-primary-500/20"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center"><Send size={14} /></div>
                  <span className="font-extrabold">Initiate Purchase</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Property Details Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Detailed Info Card */}
          <div className="glass-panel p-8 overflow-hidden relative border border-white/60">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-10"></div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
               <Activity className="text-primary-500" /> Infrastructure Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-8 mt-6">
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                   <MapPin size={22} className="stroke-[2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Geographic Location</p>
                  <p className="font-medium text-slate-800 leading-snug">{property.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                   <Maximize size={22} className="stroke-[2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Operational Area</p>
                  <p className="font-extrabold text-slate-800 text-lg">{property.area.toLocaleString()} <span className="text-sm font-medium text-slate-500">Sq Ft</span></p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                   <Tag size={22} className="stroke-[2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Market Valuation</p>
                  <p className="font-extrabold text-slate-800 text-lg">₹{property.marketValue.toLocaleString()} <span className="text-sm font-medium text-slate-500">INR</span></p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                   <Calendar size={22} className="stroke-[2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Registration Date</p>
                  <p className="font-bold text-slate-800">{property.registrationDate.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Validation & Security */}
          <div className="glass-panel p-8 border-l-4 border-l-emerald-400 shadow-md">
             <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 relative">
                   <Shield className="w-7 h-7 text-emerald-600 relative z-10" />
                   <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                </div>
                <div>
                   <h3 className="text-lg font-extrabold text-slate-900 mb-1">Cryptographically Secured Network</h3>
                   <p className="text-slate-600 text-sm font-medium leading-relaxed">
                     This property record is immutably stored on the Bharat Registry blockchain infrastructure. The current operational state is cryptographically verified by network consortium nodes, ensuring absolute tamper-proof authenticity.
                   </p>
                </div>
             </div>
          </div>

          {/* Documents Block */}
          <div className="glass-panel p-8 border border-white/60">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <FileText className="text-blue-500" /> Digital Artifacts
            </h2>
            {property.ipfsDocumentHash ? (
              <a
                href={`https://gateway.pinata.cloud/ipfs/${property.ipfsDocumentHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 bg-white/60 border border-slate-200/60 rounded-2xl hover:bg-white hover:border-primary-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                   <FileText size={20} />
                </div>
                <div className="flex-1">
                   <span className="block font-bold text-slate-800 text-lg">Official Property Deeds.pdf</span>
                   <span className="block text-xs font-mono text-slate-400 mt-1 truncate max-w-xs">{property.ipfsDocumentHash}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary-50">
                  <ExternalLink size={18} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </a>
            ) : (
              <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center">
                 <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 text-slate-300">
                    <FileText size={24} />
                 </div>
                 <p className="text-slate-500 font-bold mb-1">No artifacts uploaded</p>
                 <p className="text-slate-400 text-sm">Supporting documents are not available on IPFS.</p>
              </div>
            )}
          </div>

          {/* Transfer History */}
          <div className="glass-panel p-8 border border-white/60">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
               <Activity className="text-purple-500" /> Immutable Transfer History
            </h2>
            {transferIds?.length > 0 ? (
              <div className="space-y-4">
                {transferIds.map((id) => (
                  <Link
                    key={id}
                    to={`/transfers/${id}`}
                    className="flex items-center justify-between p-4 bg-white/60 border border-slate-100/60 rounded-xl hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                        <Send size={18} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="block font-bold text-slate-800">Transfer Protocol #{id}</span>
                        <span className="text-xs text-slate-400 font-mono mt-0.5 block tracking-wider">Executed successfully</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary-50">
                      <ArrowLeft size={16} className="text-slate-300 group-hover:text-primary-500 rotate-180 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-8 text-center flex flex-col items-center">
                <p className="text-slate-500 font-bold mb-1">No prior transfers</p>
                <p className="text-slate-400 text-sm">This asset has been held by a single entity.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          
          {/* Owner Identity */}
          <div className="glass-panel p-6 border-t-4 border-t-indigo-400 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full blur-xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 block">Cryptographic Owner <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-1"></span></h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="text-indigo-500 w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  {isPropertyOwner && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full mb-1">
                      Current Account
                    </span>
                  )}
                  <p className="font-mono text-sm font-semibold text-slate-700 break-all select-all leading-tight">
                    {property.currentOwner}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 pt-1">
                 <span>Identity status</span>
                 <span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={12}/> Verified</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          {isPropertyOwner && (
            <div className="glass-panel p-6 border border-white/80">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 mb-5">Administrative Actions</h2>
              <div className="space-y-3">
                <button className="btn btn-secondary w-full justify-start py-3 text-sm group">
                  <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center group-hover:bg-white group-hover:text-primary-600 transition-colors mr-1 shrink-0">
                     <FileText size={16} />
                  </div>
                  <span className="font-bold">Update IPFS Payload</span>
                </button>
                <button className="btn btn-secondary w-full justify-start py-3 text-sm group">
                  <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center group-hover:bg-white group-hover:text-primary-600 transition-colors mr-1 shrink-0">
                     <Tag size={16} />
                  </div>
                  <span className="font-bold">Re-assess Market Value</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <InitiateTransferModal
          propertyId={propertyId}
          marketValue={property.marketValue}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </div>
  )
}
