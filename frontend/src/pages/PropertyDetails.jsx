import { useParams, Link } from 'react-router-dom'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { 
  ArrowLeft, MapPin, Maximize, Tag, User, Calendar, FileText, 
  ExternalLink, Send, Shield, Activity, Share2, CheckCircle, 
  XCircle, Loader2, Heart, HeartHandshake, Key
} from 'lucide-react'
import { useProperty, useIsPropertyVerified, useNominatedHeir } from '../hooks/useContract'
import { usePropertyTransfers } from '../hooks/useTransfer'
import { useAuth } from '../hooks/useAuth'
import { PROPERTY_STATUS_LABELS, LAND_REGISTRY_ADDRESS } from '../utils/constants'
import { LAND_REGISTRY_ABI } from '../config/LandRegistryABI'
import InitiateTransferModal from '../components/transfer/InitiateTransferModal'
import { useState, useEffect } from 'react'
import { adminAPI } from '../utils/api'
import toast from 'react-hot-toast'

export default function PropertyDetails() {
  const { id: propertyId } = useParams()
  const { address, isConnected } = useAccount()
  const { property, isLoading, error, refetch: refetchProperty } = useProperty(propertyId)
  const { isVerified } = useIsPropertyVerified(propertyId)
  const { transferIds } = usePropertyTransfers(propertyId)
  const { nominee, refetch: refetchNominee } = useNominatedHeir(propertyId)
  
  const [showTransferModal, setShowTransferModal] = useState(false)
  const { user, hasWallet, isAdmin, isVerifier, isRegistrar, isBank, isSuperAdmin } = useAuth()
  const [actionLoading, setActionLoading] = useState(false)

  // Contract Writes
  const { writeContractAsync } = useWriteContract()

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

  const handleVerify = async (approved) => {
    setActionLoading(true)
    try {
      const reason = approved ? undefined : prompt("Reason for rejection:")
      if (!approved && !reason) return
      
      await adminAPI.verifyProperty(propertyId, approved, reason)
      toast.success(approved ? "Property verified!" : "Property rejected")
      window.location.reload()
    } catch (err) {
      toast.error("Failed to update property status")
    } finally {
      setActionLoading(false)
    }
  }

  const handleNominate = async () => {
    const heirAddr = prompt("Enter the Wallet Address of your Nominated Heir:");
    if (!heirAddr || !heirAddr.startsWith("0x")) return;

    setActionLoading(true);
    try {
      await writeContractAsync({
        address: LAND_REGISTRY_ADDRESS,
        abi: LAND_REGISTRY_ABI,
        functionName: 'nominateHeir',
        args: [BigInt(propertyId), heirAddr],
        gas: 500000n,
      });
      toast.success("Heir nominated successfully!");
      refetchNominee();
    } catch (err) {
      toast.error("Nomination failed. Check if address is valid.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimInheritance = async () => {
    setActionLoading(true);
    try {
      await writeContractAsync({
        address: LAND_REGISTRY_ADDRESS,
        abi: LAND_REGISTRY_ABI,
        functionName: 'claimInheritance',
        args: [BigInt(propertyId)],
        gas: 500000n,
      });
      toast.success("Inheritance claimed! You are the new owner.");
      refetchProperty();
      refetchNominee();
    } catch (err) {
      toast.error("Claim failed. Are you the nominated heir?");
    } finally {
      setActionLoading(false);
    }
  };

  const canVerify = (isVerifier || isAdmin || isSuperAdmin) && property.status === 'pending'
  const isPropertyOwner = isConnected && hasWallet && address?.toLowerCase() === property.currentOwner.toLowerCase()
  const canBuy = isConnected && hasWallet && !isPropertyOwner && property.status === 'verified' && user?.isVerified
  const isNominee = isConnected && nominee?.toLowerCase() === address?.toLowerCase()

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
            {(canVerify) && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleVerify(true)}
                  disabled={actionLoading}
                  className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-none px-6"
                >
                  {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Approve Asset
                </button>
              </div>
            )}

            {isBank && (
              <button
                onClick={() => toast.success("Mortgage process initiated.")}
                className="btn bg-indigo-600 text-white hover:bg-indigo-700 border-none px-6"
              >
                <Shield size={18} />
                <span className="font-bold">Initiate Mortgage</span>
              </button>
            )}

            {canBuy && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="btn btn-primary shadow-xl shadow-primary-500/20"
              >
                <Send size={18} />
                <span className="font-extrabold">Initiate Purchase</span>
              </button>
            )}

            {isNominee && (
              <button
                onClick={handleClaimInheritance}
                disabled={actionLoading}
                className="btn bg-gradient-to-r from-rose-500 to-orange-500 text-white border-none px-6 shadow-lg shadow-rose-200"
              >
                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />}
                <span className="font-bold">Claim Inheritance</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-8 overflow-hidden relative border border-white/60">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
               <Activity className="text-primary-500" /> Infrastructure Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-8 mt-6">
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                   <MapPin size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Geographic Location</p>
                  <p className="font-medium text-slate-800 leading-snug">{property.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                   <Maximize size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Operational Area</p>
                  <p className="font-extrabold text-slate-800 text-lg">{property.area.toLocaleString()} Sq Ft</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                   <Tag size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Market Valuation</p>
                  <p className="font-extrabold text-slate-800 text-lg">₹{Number(property.marketValue).toLocaleString()} INR</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                   <Calendar size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Registration Date</p>
                  <p className="font-bold text-slate-800">{property.registrationDate.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 border-l-4 border-l-emerald-400">
             <div className="flex items-start gap-5">
                <Shield className="w-7 h-7 text-emerald-600" />
                <div>
                   <h3 className="text-lg font-extrabold text-slate-900 mb-1">Cryptographically Secured</h3>
                   <p className="text-slate-600 text-sm font-medium leading-relaxed">
                     This property record is immutably stored on the Bharat Registry blockchain infrastructure.
                   </p>
                </div>
             </div>
          </div>

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
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                   <FileText size={20} />
                </div>
                <div className="flex-1">
                   <span className="block font-bold text-slate-800 text-lg">Official Property Deeds.pdf</span>
                   <span className="block text-xs font-mono text-slate-400 mt-1 truncate max-w-xs">{property.ipfsDocumentHash}</span>
                </div>
                <ExternalLink size={18} className="text-slate-400 group-hover:text-primary-600" />
              </a>
            ) : (
              <p className="text-slate-500 font-bold italic">No documents available.</p>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-panel p-6 border-t-4 border-t-indigo-400 relative overflow-hidden">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 block">Cryptographic Owner</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center shrink-0">
                <User className="text-indigo-500 w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-semibold text-slate-700 break-all select-all">
                  {property.currentOwner}
                </p>
              </div>
            </div>
          </div>

          {/* Succession Planning Section */}
          <div className="glass-panel p-6 border-t-4 border-t-rose-400 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Succession Planning</h2>
              <Heart className="text-rose-400" size={14} />
            </div>
            
            <div className="space-y-4">
              {nominee ? (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Nominated Heir</p>
                  <p className="font-mono text-xs text-slate-700 break-all">{nominee}</p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 italic">No nominee designated.</p>
                </div>
              )}

              {isPropertyOwner && (
                <button 
                  onClick={handleNominate}
                  disabled={actionLoading}
                  className="btn btn-secondary w-full text-xs py-2.5 flex items-center gap-2"
                >
                  <HeartHandshake size={14} />
                  {nominee ? "Update Nominee" : "Designate Heir"}
                </button>
              )}
            </div>
          </div>

          {isPropertyOwner && (
            <div className="glass-panel p-6 border border-white/80">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 mb-5">Administrative Actions</h2>
              <div className="space-y-3">
                <button className="btn btn-secondary w-full justify-start py-3 text-sm group">
                  <FileText size={16} className="mr-2" />
                  <span className="font-bold">Update IPFS Payload</span>
                </button>
                <button className="btn btn-secondary w-full justify-start py-3 text-sm group">
                  <Tag size={16} className="mr-2" />
                  <span className="font-bold">Re-assess Market Value</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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
