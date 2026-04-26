import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Lock
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
      error: "Invalid PAN format. Must be 5 letters, 4 digits, and 1 letter (e.g., ABCDE1234F)",
    };
  }

  const validEntityTypes = new Set(["A", "B", "C", "F", "G", "H", "L", "J", "P", "T"]);
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
  if (!/^\d{16}$/.test(cleaned)) {
    return { valid: false, error: "Aadhaar number must be exactly 16 digits" };
  }
  if (cleaned[0] === "0" || cleaned[0] === "1") {
    return { valid: false, error: "Aadhaar number cannot start with 0 or 1" };
  }
  return { valid: true, error: null };
}

const steps = [
  { id: 1, title: "Personal Details", icon: User },
  { id: 2, title: "Identity Verification", icon: CreditCard },
  { id: 3, title: "Address & Security", icon: MapPin },
];

export default function Register() {
  const { register, isLoading, error: authError } = useAuth();
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
    password: "",
    confirmPassword: "",
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
        newErrors.phone = "Invalid Indian phone number (10 digits starting with 6-9)";
      }
      if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
        newErrors.email = "Valid email is required";
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
      if (!formData.password || formData.password.length < 6)
        newErrors.password = "Password must be at least 6 characters";
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (step < 3 && !validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    const result = await register(formData);
    if (result.success) {
      navigate("/login", { state: { message: "Registration successful! Please login." }});
    }
  };

  return (
    <div className="min-h-[70vh] py-8 animate-fade-in relative z-10 px-4 md:px-0">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-3">
          Join <span className="gradient-text">BharatRegistry</span>
        </h1>
        <p className="text-slate-600 text-lg max-w-xl mx-auto">
          Register to access India's blockchain-powered land registry platform.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-10 max-w-3xl mx-auto flex-wrap sm:flex-nowrap gap-y-4">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 ${
                step === s.id
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                  : step > s.id
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {step > s.id ? <CheckCircle2 size={18} /> : <s.icon size={18} />}
              <span className="font-bold text-xs sm:text-sm">
                {s.title}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-4 sm:w-12 h-0.5 mx-1 sm:mx-2 transition-colors ${
                  step > s.id ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="max-w-2xl mx-auto">
        <div className="card shadow-2xl p-6 sm:p-8 bg-white/80 backdrop-blur-xl border border-white/40">
          
          {authError && (
             <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 mb-6 text-left shadow-sm">
                <AlertCircle className="text-rose-500 flex-shrink-0" size={20} />
                <p className="text-rose-700 text-sm font-medium">{authError}</p>
             </div>
          )}

          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Personal Details
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                Provide your basic details for registration.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    className={`input ${errors.fullName ? "border-rose-400 focus:border-rose-500" : ""}`}
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                  />
                  {errors.fullName && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.fullName}</p>
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
                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.dateOfBirth}</p>
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
                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.gender}</p>
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
                    onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ""))}
                  />
                  {errors.phone && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.phone}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    className={`input ${errors.email ? "border-rose-400" : ""}`}
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                  {errors.email && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.email}</p>
                  )}
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
                Your PAN and Aadhaar are validated in real-time. Aadhaar is stored as a secure hash.
              </p>

              <div>
                <label className="label">PAN Card Number *</label>
                <input
                  type="text"
                  className={`input uppercase tracking-widest text-lg font-mono ${
                    errors.panNumber
                      ? "border-rose-400"
                      : formData.panNumber && validatePAN(formData.panNumber).valid
                        ? "border-emerald-400"
                        : ""
                  }`}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  value={formData.panNumber}
                  onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase())}
                />
                {errors.panNumber && (
                  <p className="text-rose-500 text-xs mt-1 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.panNumber}
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
                      : formData.aadhaarNumber && validateAadhaar(formData.aadhaarNumber).valid
                        ? "border-emerald-400"
                        : ""
                  }`}
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14}
                  value={formData.aadhaarNumber}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "");
                    if (val.length > 16) val = val.slice(0, 16);
                    const formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
                    handleChange("aadhaarNumber", formatted);
                  }}
                />
                {errors.aadhaarNumber && (
                  <p className="text-rose-500 text-xs mt-1 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.aadhaarNumber}
                  </p>
                )}
                <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50/80 rounded-xl border border-blue-100">
                  <Shield className="text-blue-500 flex-shrink-0 mt-0.5" size={14} />
                  <p className="text-blue-700 text-xs">
                    Your Aadhaar is never stored directly. We store only a cryptographic hash for verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Address & Security */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Address & Security
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                Please provide your address and set a secure password.
              </p>

              <div>
                <label className="label flex items-center gap-2"><MapPin size={16}/> Address Details</label>
                <input
                  type="text"
                  className="input mb-4"
                  placeholder="House/Flat No., Street"
                  value={formData.address.street}
                  onChange={(e) => handleChange("address.street", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="label">City *</label>
                  <input
                    type="text"
                    className={`input ${errors["address.city"] ? "border-rose-400" : ""}`}
                    placeholder="City"
                    value={formData.address.city}
                    onChange={(e) => handleChange("address.city", e.target.value)}
                  />
                  {errors["address.city"] && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors["address.city"]}</p>
                  )}
                </div>

                <div>
                  <label className="label">State *</label>
                  <select
                    className={`input ${errors["address.state"] ? "border-rose-400" : ""}`}
                    value={formData.address.state}
                    onChange={(e) => handleChange("address.state", e.target.value)}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors["address.state"] && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors["address.state"]}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="label">Pincode</label>
                  <input
                    type="text"
                    className="input w-full md:w-1/2"
                    placeholder="6-digit pincode"
                    maxLength={6}
                    value={formData.address.pincode}
                    onChange={(e) => handleChange("address.pincode", e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <label className="label flex items-center gap-2"><Lock size={16}/> Account Security</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                  <div>
                    <label className="label">Password *</label>
                    <input
                      type="password"
                      className={`input ${errors.password ? "border-rose-400" : ""}`}
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                    />
                    {errors.password && (
                      <p className="text-rose-500 text-xs mt-1 font-medium">{errors.password}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Confirm Password *</label>
                    <input
                      type="password"
                      className={`input ${errors.confirmPassword ? "border-rose-400" : ""}`}
                      placeholder="Repeat password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    />
                    {errors.confirmPassword && (
                      <p className="text-rose-500 text-xs mt-1 font-medium">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
            {step > 1 ? (
              <button onClick={prevStep} className="btn btn-secondary px-6">
                <ArrowLeft size={18} className="mr-2" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={nextStep}
                className="btn btn-primary px-8 shadow-lg shadow-primary-500/20"
              >
                Continue <ArrowRight size={18} className="ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn btn-success px-8 shadow-lg shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" /> Creating Account...
                  </>
                ) : (
                  <>
                    <Shield size={18} className="mr-2" /> Complete Registration
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-600 font-bold hover:underline">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
