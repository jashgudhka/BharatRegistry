import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  User,
  CreditCard,
  Shield,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wallet,
} from "lucide-react";
import { INDIAN_STATES } from "../utils/constants";

// PAN validation
function validatePAN(pan) {
  if (!pan) return { valid: false, error: "PAN number is required" };
  const cleaned = pan.trim().toUpperCase();
  if (cleaned.length !== 10)
    return { valid: false, error: "PAN number must be exactly 10 characters" };
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleaned)) {
    return {
      valid: false,
      error:
        "Invalid PAN format. Must be 5 letters, 4 digits, and 1 letter (e.g., ABCDE1234F)",
    };
  }

  const validEntityTypes = new Set([
    "A",
    "B",
    "C",
    "F",
    "G",
    "H",
    "L",
    "J",
    "P",
    "T",
  ]);
  if (!validEntityTypes.has(cleaned[3])) {
    return {
      valid: false,
      error: `Invalid entity type character '${cleaned[3]}' at position 4`,
    };
  }

  return { valid: true, error: null };
}

// Aadhaar validation (same as backend)
function validateAadhaar(aadhaar) {
  if (!aadhaar) return { valid: false, error: "Aadhaar number is required" };
  const cleaned = aadhaar.replace(/\s/g, "");
  if (!/^\d{12}$/.test(cleaned)) {
    return { valid: false, error: "Aadhaar number must be exactly 12 digits" };
  }
  if (cleaned[0] === "0" || cleaned[0] === "1") {
    return { valid: false, error: "Aadhaar number cannot start with 0 or 1" };
  }
  return { valid: true, error: null };
}

const steps = [
  { id: 1, title: "Personal Details", icon: User },
  { id: 2, title: "Identity Verification", icon: CreditCard },
  { id: 3, title: "Address", icon: MapPin },
  { id: 4, title: "Connect Wallet", icon: Wallet },
];

export default function Register() {
  const { address, isConnected } = useAccount();
  const { register, isLoading, error: authError, isRegistered } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: "",
    fatherName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    panNumber: "",
    aadhaarNumber: "",
    address: { street: "", city: "", state: "", pincode: "" },
  });

  const handleChange = (field, value) => {
    if (field.startsWith("address.")) {
      const key = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [key]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    // Clear error
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateStep = (stepNum) => {
    const newErrors = {};

    if (stepNum === 1) {
      if (!formData.fullName || formData.fullName.trim().length < 2)
        newErrors.fullName = "Full name is required (min 2 chars)";
      if (!formData.dateOfBirth)
        newErrors.dateOfBirth = "Date of birth is required";
      else {
        const age = Math.floor(
          (new Date() - new Date(formData.dateOfBirth)) / 31557600000,
        );
        if (age < 18) newErrors.dateOfBirth = "Must be at least 18 years old";
      }
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone)) {
        newErrors.phone =
          "Invalid Indian phone number (10 digits starting with 6-9)";
      }
    }

    if (stepNum === 2) {
      const panResult = validatePAN(formData.panNumber);
      if (!panResult.valid) newErrors.panNumber = panResult.error;
      const aadhaarResult = validateAadhaar(formData.aadhaarNumber);
      if (!aadhaarResult.valid) newErrors.aadhaarNumber = aadhaarResult.error;
    }

    if (stepNum === 3) {
      if (!formData.address.state)
        newErrors["address.state"] = "State is required";
      if (!formData.address.city)
        newErrors["address.city"] = "City is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (step === 4 && !isConnected) return;
    if (step < 4 && !validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    if (!isConnected) return;

    const result = await register(formData);
    if (result.success) {
      navigate("/dashboard");
    }
  };

  if (isRegistered) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="card text-center max-w-md p-10 animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            Already Registered!
          </h2>
          <p className="text-slate-600 mb-6">
            Your wallet is already registered on BharatRegistry.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn btn-primary w-full"
          >
            Go to Dashboard <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-3">
          Join <span className="gradient-text">BharatRegistry</span>
        </h1>
        <p className="text-slate-600 text-lg max-w-xl mx-auto">
          Register to access India's blockchain-powered land registry platform.
          Your identity is securely verified.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-10 max-w-2xl mx-auto">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                step === s.id
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                  : step > s.id
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {step > s.id ? <CheckCircle2 size={18} /> : <s.icon size={18} />}
              <span className="font-bold text-sm hidden sm:inline">
                {s.title}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-8 sm:w-12 h-0.5 mx-1 transition-colors ${
                  step > s.id ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          {/* Step 4: Connect Wallet */}
          {step === 4 && (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto">
                <Wallet className="w-12 h-12 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                Final Step: Connect Wallet
              </h2>
              <p className="text-slate-600">
                Connect your Ethereum wallet to link your identity to the
                blockchain.
              </p>
              <div className="flex justify-center">
                <ConnectButton showBalance={false} />
              </div>
              {isConnected && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle2
                    className="text-emerald-500 flex-shrink-0"
                    size={20}
                  />
                  <div className="text-left">
                    <p className="font-bold text-emerald-700 text-sm">
                      Wallet Connected
                    </p>
                    <p className="text-emerald-600 text-xs font-mono mt-0.5">
                      {address}
                    </p>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mt-6 p-5 bg-gradient-to-br from-primary-50 to-indigo-50 text-left rounded-2xl border border-primary-100">
                <h3 className="font-bold text-slate-800 mb-3 text-center">
                  Registration Summary
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-slate-500 text-right pr-2">Name:</span>
                  <span className="font-semibold text-slate-800">
                    {formData.fullName || "Not provided"}
                  </span>
                  <span className="text-slate-500 text-right pr-2">
                    Gender:
                  </span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {formData.gender || "Not provided"}
                  </span>
                  <span className="text-slate-500 text-right pr-2">PAN:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {formData.panNumber || "Not provided"}
                  </span>
                  <span className="text-slate-500 text-right pr-2">
                    Aadhaar:
                  </span>
                  <span className="font-semibold text-slate-800">
                    XXXX XXXX{" "}
                    {formData.aadhaarNumber
                      ? formData.aadhaarNumber.replace(/\s/g, "").slice(-4)
                      : "0000"}
                  </span>
                  <span className="text-slate-500 text-right pr-2">
                    Wallet:
                  </span>
                  <span className="font-semibold text-slate-800 font-mono text-xs">
                    {address
                      ? `${address.slice(0, 6)}...${address.slice(-4)}`
                      : "Pending..."}
                  </span>
                </div>
              </div>

              {authError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 mt-4 text-left">
                  <AlertCircle
                    className="text-rose-500 flex-shrink-0"
                    size={20}
                  />
                  <p className="text-rose-700 text-sm font-medium">
                    {authError}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Personal Details
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                Provide your details for KYC verification.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    className={`input ${errors.fullName ? "border-rose-400 focus:border-rose-500" : ""}`}
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                  />
                  {errors.fullName && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Father's Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Father's name"
                    value={formData.fatherName}
                    onChange={(e) => handleChange("fatherName", e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Date of Birth *</label>
                  <input
                    type="date"
                    className={`input ${errors.dateOfBirth ? "border-rose-400" : ""}`}
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleChange("dateOfBirth", e.target.value)
                    }
                  />
                  {errors.dateOfBirth && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Gender *</label>
                  <select
                    className={`input ${errors.gender ? "border-rose-400" : ""}`}
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">
                      {errors.gender}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    type="tel"
                    className={`input ${errors.phone ? "border-rose-400" : ""}`}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) =>
                      handleChange("phone", e.target.value.replace(/\D/g, ""))
                    }
                  />
                  {errors.phone && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Identity Verification */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Identity Verification
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                Your PAN and Aadhaar are validated in real-time. Aadhaar is
                stored as a secure hash.
              </p>

              <div>
                <label className="label">PAN Card Number *</label>
                <input
                  type="text"
                  className={`input uppercase tracking-widest text-lg font-mono ${
                    errors.panNumber
                      ? "border-rose-400"
                      : formData.panNumber &&
                          validatePAN(formData.panNumber).valid
                        ? "border-emerald-400"
                        : ""
                  }`}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  value={formData.panNumber}
                  onChange={(e) =>
                    handleChange("panNumber", e.target.value.toUpperCase())
                  }
                />
                {errors.panNumber && (
                  <p className="text-rose-500 text-xs mt-1 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.panNumber}
                  </p>
                )}
                {formData.panNumber &&
                  validatePAN(formData.panNumber).valid && (
                    <p className="text-emerald-600 text-xs mt-1 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Valid PAN format
                    </p>
                  )}
                <p className="text-slate-400 text-xs mt-2">
                  Format: 5 letters + 4 digits + 1 letter (e.g., ABCPD1234F)
                </p>
              </div>

              <div>
                <label className="label">Aadhaar Number *</label>
                <input
                  type="text"
                  className={`input tracking-widest text-lg font-mono ${
                    errors.aadhaarNumber
                      ? "border-rose-400"
                      : formData.aadhaarNumber &&
                          validateAadhaar(formData.aadhaarNumber).valid
                        ? "border-emerald-400"
                        : ""
                  }`}
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14}
                  value={formData.aadhaarNumber}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "");
                    if (val.length > 12) val = val.slice(0, 12);
                    // Format with spaces
                    const formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ");
                    handleChange("aadhaarNumber", formatted);
                  }}
                />
                {errors.aadhaarNumber && (
                  <p className="text-rose-500 text-xs mt-1 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.aadhaarNumber}
                  </p>
                )}
                {formData.aadhaarNumber &&
                  validateAadhaar(formData.aadhaarNumber).valid && (
                    <p className="text-emerald-600 text-xs mt-1 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Valid Aadhaar format
                    </p>
                  )}
                <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 rounded-xl">
                  <Shield
                    className="text-blue-500 flex-shrink-0 mt-0.5"
                    size={14}
                  />
                  <p className="text-blue-700 text-xs">
                    Your Aadhaar is never stored directly. We store only a
                    cryptographic hash for verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Residential Address
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                Your residential address for records.
              </p>

              <div>
                <label className="label">Street Address</label>
                <input
                  type="text"
                  className="input"
                  placeholder="House/Flat No., Street"
                  value={formData.address.street}
                  onChange={(e) =>
                    handleChange("address.street", e.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label">City *</label>
                  <input
                    type="text"
                    className={`input ${errors["address.city"] ? "border-rose-400" : ""}`}
                    placeholder="City"
                    value={formData.address.city}
                    onChange={(e) =>
                      handleChange("address.city", e.target.value)
                    }
                  />
                  {errors["address.city"] && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">
                      {errors["address.city"]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">State *</label>
                  <select
                    className={`input ${errors["address.state"] ? "border-rose-400" : ""}`}
                    value={formData.address.state}
                    onChange={(e) =>
                      handleChange("address.state", e.target.value)
                    }
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors["address.state"] && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">
                      {errors["address.state"]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Pincode</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="6-digit pincode"
                    maxLength={6}
                    value={formData.address.pincode}
                    onChange={(e) =>
                      handleChange(
                        "address.pincode",
                        e.target.value.replace(/\D/g, ""),
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            {step > 1 ? (
              <button onClick={prevStep} className="btn btn-secondary">
                <ArrowLeft size={18} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={nextStep}
                disabled={step === 4 && !isConnected}
                className="btn btn-primary disabled:opacity-50"
              >
                Continue <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn btn-success disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />{" "}
                    Registering...
                  </>
                ) : (
                  <>
                    <Shield size={18} /> Complete Registration
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
