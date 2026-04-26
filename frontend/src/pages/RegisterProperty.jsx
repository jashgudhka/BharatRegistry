import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAccount } from "wagmi";
import {
  FileText,
  MapPin,
  Maximize,
  Tag,
  Upload,
  ArrowRight,
  CheckCircle,
  Home,
  ShieldCheck,
  Loader2,
  ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";
import { decodeEventLog } from "viem";
import { LAND_REGISTRY_ABI } from "../config/LandRegistryABI";
import { propertyAPI } from "../utils/api";
import { useRegisterProperty } from "../hooks/useContract";
import { PROPERTY_TYPES, INDIAN_STATES } from "../utils/constants";

export default function RegisterProperty() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { hasWallet, user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { registerProperty, isLoading, isSuccess, hash, error, receipt } =
    useRegisterProperty();

  const [hasSynced, setHasSynced] = useState(false);

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold">Verifying authorization...</p>
      </div>
    );
  }

  if (user && !user.isVerified) {
    return (
      <div className="max-w-2xl mx-auto mt-12 animate-fade-in relative z-10 w-full px-4">
        <div className="glass-panel p-12 text-center border-t-8 border-t-amber-500 shadow-2xl">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-100">
            <ShieldAlert size={48} className="text-amber-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Identity Required</h1>
          <p className="text-slate-600 text-lg font-medium mb-10 leading-relaxed max-w-lg mx-auto">
            You must complete your KYC verification before registering high-value assets on the Bharat Registry blockchain. This ensures sovereign compliance and legal security.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard" className="btn btn-secondary px-8 font-bold">
              Return to Dashboard
            </Link>
            <div className="bg-amber-100 text-amber-700 px-8 py-3 rounded-xl font-bold border border-amber-200">
               Verification Pending
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    surveyNumber: "",
    location: "",
    city: "",
    state: "",
    area: "",
    marketValue: "",
    propertyType: "residential",
    ipfsHash: "",
  });

  if (!isConnected || !hasWallet) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    const syncProperty = async () => {
      if (isSuccess && receipt && !hasSynced) {
        setHasSynced(true);
        try {
          // Find PropertyRegistered event in logs
          for (const log of receipt.logs) {
            try {
              const decoded = decodeEventLog({
                abi: LAND_REGISTRY_ABI,
                data: log.data,
                topics: log.topics,
              });
              
              if (decoded.eventName === 'PropertyRegistered') {
                const propertyId = decoded.args.propertyId.toString();
                
                // Call backend sync
                await propertyAPI.sync(propertyId, {
                  transactionHash: hash,
                  metadata: {
                    type: formData.propertyType,
                    city: formData.city,
                    state: formData.state,
                  },
                  documents: formData.ipfsHash ? [{
                    name: 'Property Deed',
                    ipfsHash: formData.ipfsHash,
                    documentType: 'deed'
                  }] : []
                });
                break;
              }
            } catch (e) {
              // Log might not belong to our contract or not match ABI
              continue;
            }
          }
        } catch (err) {
          console.error("Failed to sync property to backend:", err);
        }
      }
    };
    
    syncProperty();
  }, [isSuccess, receipt, hasSynced, hash, formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.surveyNumber ||
      !formData.location ||
      !formData.area ||
      !formData.marketValue
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const fullLocation = `${formData.location}, ${formData.city}, ${formData.state}`;

    try {
      await registerProperty({
        surveyNumber: formData.surveyNumber,
        location: fullLocation,
        area: formData.area,
        marketValue: formData.marketValue,
        ipfsHash: formData.ipfsHash,
      });
      toast.success("Property registration submitted!");
    } catch (err) {
      toast.error("Failed to register property");
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto w-full animate-fade-in relative z-10 pt-12">
        <div className="glass-panel text-center p-12 relative overflow-hidden border-t-4 border-t-emerald-400 shadow-2xl">
          {/* Celebration background */}
          <div className="absolute -inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 -z-10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/30 animate-scale-in">
              <CheckCircle className="text-white w-12 h-12" />
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-4">
              Registration Successful!
            </h2>
            <p className="text-slate-500 font-medium text-lg max-w-md mx-auto mb-10 leading-relaxed">
              Your property has been permanently registered on the blockchain. It will be independently verified by consortium nodes shortly.
            </p>
            {hash && (
              <div className="bg-white/60 p-6 rounded-2xl mb-10 border border-emerald-100 shadow-inner max-w-lg mx-auto transform -rotate-1 hover:rotate-0 transition-transform cursor-pointer">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-center gap-2">
                   <ShieldCheck size={14} className="text-emerald-500" /> Tx Hash Identity
                </p>
                <p className="font-mono text-sm font-semibold text-slate-700 break-all select-all">
                  {hash}
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/dashboard")}
                className="btn btn-primary shadow-xl shadow-primary-500/20 px-8 py-3"
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-outline border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 px-8 py-3"
              >
                Register Another Asset
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in relative z-10 w-full pb-12">
      {/* Large, Clear Header */}
      <div className="glass-panel p-10 mb-8 relative overflow-hidden border-b border-primary-100/50 shadow-lg">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-primary-400/30 to-indigo-400/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
        <div className="text-center relative z-10">
          <div className="w-20 h-20 bg-white/60 rounded-2xl mx-auto flex items-center justify-center shadow-sm border border-white mb-6">
             <Home className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">Asset Registration</h1>
          <p className="text-lg font-medium text-slate-500">संपत्ति पंजीकरण</p>
        </div>

        {/* Progress indicator - Large and Visual */}
        <div className="mt-12 flex items-center justify-center gap-3 sm:gap-6 max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-primary-500/30 mb-3 transform hover:scale-105 transition-transform">
              1
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-primary-700">Fill Form</span>
            <span className="text-[10px] font-medium text-slate-400">फॉर्म भरें</span>
          </div>
          <div className="w-12 sm:w-16 h-1.5 bg-slate-200 rounded-full relative overflow-hidden">
             <div className="absolute inset-y-0 left-0 bg-primary-500 w-1/3 animate-pulse"></div>
          </div>
          <div className="flex flex-col items-center opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center text-xl font-black mb-3 shadow-sm text-shadow-none">
              2
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Verify</span>
            <span className="text-[10px] font-medium text-slate-400">सत्यापन</span>
          </div>
          <div className="w-12 sm:w-16 h-1.5 bg-slate-200 rounded-full"></div>
          <div className="flex flex-col items-center opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center text-xl font-black mb-3 shadow-sm text-shadow-none">
              3
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Done</span>
            <span className="text-[10px] font-medium text-slate-400">हो गया</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
        {/* Survey Number */}
        <div className="glass-panel p-8 border-l-4 border-l-blue-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-start gap-4 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
               <FileText size={20} />
            </div>
            <div>
              <div className="tracking-tight">Property Identity</div>
              <div className="text-sm text-slate-500 font-medium tracking-normal mt-0.5">
                संपत्ति की जानकारी
              </div>
            </div>
          </h2>

          <div className="space-y-6">
            <div>
              <label className="label text-sm font-bold uppercase tracking-wider text-slate-700">
                Survey Number * <span className="text-slate-400 font-medium text-xs ml-2 normal-case tracking-normal border-l border-slate-200 pl-2">सर्वे नंबर *</span>
              </label>
              <input
                type="text"
                name="surveyNumber"
                placeholder="e.g., SV-2024-001"
                className="input py-3 text-lg font-mono text-slate-800 bg-white/50"
                value={formData.surveyNumber}
                onChange={handleChange}
                required
              />
              <p className="text-xs font-medium text-slate-500 mt-2 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg inline-flex">
                <ShieldCheck size={14} className="text-blue-500" />
                <span>Unique alphanumeric identifier from municipal land records.</span>
              </p>
            </div>

            <div>
              <label className="label text-sm font-bold uppercase tracking-wider text-slate-700">Property Category</label>
              <select
                name="propertyType"
                className="input py-3 text-base font-medium text-slate-700 bg-white/50 cursor-pointer appearance-none"
                value={formData.propertyType}
                onChange={handleChange}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="glass-panel p-8">
          <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
               <MapPin size={20} className="stroke-[2.5]" />
            </div>
            Geographic Location
          </h2>

          <div className="space-y-6">
            <div>
              <label className="label text-sm font-bold uppercase tracking-wider text-slate-700">Primary Address *</label>
              <input
                type="text"
                name="location"
                placeholder="Street address, landmark, building name"
                className="input py-3 bg-white/50"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="label text-sm font-bold uppercase tracking-wider text-slate-700">City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="e.g. Mumbai"
                  className="input py-3 bg-white/50"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="label text-sm font-bold uppercase tracking-wider text-slate-700">State</label>
                <select
                  name="state"
                  className="input py-3 bg-white/50 font-medium cursor-pointer appearance-none"
                  value={formData.state}
                  onChange={handleChange}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Property Metrics */}
        <div className="glass-panel p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-50 rounded-bl-full -z-10"></div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
               <Maximize size={20} className="stroke-[2.5]" />
            </div>
            Property Metrics
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="label text-sm font-bold uppercase tracking-wider text-slate-700">Area (Sq Ft) * <span className="text-[10px] font-medium text-slate-400 normal-case ml-1 tracking-normal">क्षेत्रफल (वर्ग फुट) *</span></label>
              <div className="relative">
                <input
                  type="number"
                  name="area"
                  placeholder="e.g., 1500"
                  className="input py-3 bg-white/50 pl-4 pr-16 font-mono text-lg"
                  value={formData.area}
                  onChange={handleChange}
                  min="1"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Sq Ft</span>
              </div>
            </div>
            <div>
              <label className="label text-sm font-bold uppercase tracking-wider text-slate-700">Market Value (INR) * <span className="text-[10px] font-medium text-slate-400 normal-case ml-1 tracking-normal">बाजार मूल्य (₹) *</span></label>
              <div className="relative">
                 <input
                   type="text"
                   name="marketValue"
                   placeholder="e.g., 1500000"
                   className="input py-3 bg-white/50 pl-8 pr-16 font-mono text-lg text-emerald-700 font-bold border-emerald-200 focus:border-emerald-500 focus:ring-emerald-200"
                   value={formData.marketValue}
                   onChange={handleChange}
                   required
                 />
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-600 text-lg">₹</span>
                 <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">INR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="glass-panel p-8 border border-white/60 bg-slate-50/50">
          <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-10 h-10 bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
               <Upload size={20} />
            </div>
            Digital Artifacts <span className="text-xs font-bold uppercase tracking-wide text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm ml-2">Optional</span>
          </h2>

          <div>
            <label className="label text-sm font-bold uppercase tracking-wider text-slate-700">IPFS Document Hash</label>
            <div className="relative">
              <input
                type="text"
                name="ipfsHash"
                placeholder="Qm..."
                className="input py-3 bg-white border-dashed border-2 hover:border-slate-400 transition-colors pl-4 font-mono text-sm"
                value={formData.ipfsHash}
                onChange={handleChange}
              />
            </div>
            <p className="text-sm font-medium text-slate-500 mt-2 flex items-start gap-2 max-w-lg">
               <ShieldCheck size={16} className="text-slate-400 mt-0.5 shrink-0" />
               Upload supporting property deeds to the InterPlanetary File System (IPFS) and embed the cryptographic hash reference here.
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-l-red-500 rounded-xl p-5 shadow-sm">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                 <span className="text-red-500 font-bold text-lg">!</span>
               </div>
               <p className="text-red-700 font-medium">
                 {error.message || "An error occurred during submission. Please verify your data and try again."}
               </p>
             </div>
          </div>
        )}

        {/* Submit Area */}
        <div className="glass-panel p-6 border-t-4 border-t-primary-500 mt-12 shadow-[0_20px_40px_-15px_rgba(84,129,255,0.2)]">
          <p className="text-sm text-slate-500 text-center flex items-center justify-center gap-2 mb-6 font-medium">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-bold shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              Gas-Free Registration
            </span>
            Submitting this asset is entirely free on our consortium network.
          </p>
          
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-4 text-xl font-black tracking-tight shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
            {isLoading ? (
              <span className="flex items-center justify-center gap-3 relative z-10">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
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
                </svg>
                Committing to Blockchain...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 relative z-10">
                Register Property Identity
                <ArrowRight size={22} className="group-hover:translate-x-1 group-hover:scale-110 transition-transform" />
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
