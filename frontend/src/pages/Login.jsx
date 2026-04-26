import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, ShieldCheck } from "lucide-react";

export default function Login() {
  const { login, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await login(formData.email, formData.password);
    if (result.success) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center animate-fade-in px-4 relative z-10">
      <div className="max-w-md w-full">
        {message && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center gap-3 shadow-sm">
            <ShieldCheck className="text-emerald-500" size={20} />
            <p className="text-emerald-700 font-medium">{message}</p>
          </div>
        )}

        <div className="card shadow-2xl p-8 bg-white/80 backdrop-blur-xl border border-white/40">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Welcome Back</h1>
            <p className="text-slate-500">Log in to your BharatRegistry account</p>
          </div>

          {authError && (
             <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 mb-6 shadow-sm">
                <AlertCircle className="text-rose-500 flex-shrink-0" size={20} />
                <p className="text-rose-700 text-sm font-medium">{authError}</p>
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  className={`input pl-10 ${errors.email ? "border-rose-400 focus:border-rose-500" : ""}`}
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
              {errors.email && (
                <p className="text-rose-500 text-xs mt-1 font-medium">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  className={`input pl-10 ${errors.password ? "border-rose-400 focus:border-rose-500" : ""}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
              </div>
              {errors.password && (
                <p className="text-rose-500 text-xs mt-1 font-medium">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full mt-8 shadow-lg shadow-primary-500/30 font-bold py-3 text-lg transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" /> Authenticating...
                </>
              ) : (
                <>
                  Login securely <ArrowRight size={20} className="ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary-600 font-bold hover:underline">
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
