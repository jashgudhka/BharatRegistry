import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAccount } from "wagmi";
import {
  FileText,
  MapPin,
  Maximize,
  Tag,
  Upload,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRegisterProperty } from "../hooks/useContract";
import { PROPERTY_TYPES, INDIAN_STATES } from "../utils/constants";

export default function RegisterProperty() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { registerProperty, isLoading, isSuccess, hash, error } =
    useRegisterProperty();

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

  if (!isConnected) {
    return <Navigate to="/" replace />;
  }

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
      <div className="max-w-lg mx-auto">
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Registration Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Your property has been registered on the blockchain. It will be
            verified by government officials.
          </p>
          {hash && (
            <p className="text-sm text-gray-500 mb-6 font-mono break-all">
              Transaction: {hash}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="btn btn-primary"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-outline"
            >
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Register Property</h1>
        <p className="text-gray-600 mt-1">
          Submit your property details for registration on the blockchain
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Survey Number */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} />
            Property Identification
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Survey Number *</label>
              <input
                type="text"
                name="surveyNumber"
                placeholder="e.g., SV-2024-001"
                className="input"
                value={formData.surveyNumber}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier from land revenue records
              </p>
            </div>

            <div>
              <label className="label">Property Type</label>
              <select
                name="propertyType"
                className="input"
                value={formData.propertyType}
                onChange={handleChange}
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
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={20} />
            Location Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Address *</label>
              <input
                type="text"
                name="location"
                placeholder="Street address, landmark"
                className="input"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="City name"
                  className="input"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="label">State</label>
                <select
                  name="state"
                  className="input"
                  value={formData.state}
                  onChange={handleChange}
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

        {/* Property Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Maximize size={20} />
            Property Details
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Area (sq. meters) *</label>
              <input
                type="number"
                name="area"
                placeholder="e.g., 1000"
                className="input"
                value={formData.area}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
            <div>
              <label className="label">Market Value (ETH) *</label>
              <input
                type="text"
                name="marketValue"
                placeholder="e.g., 10"
                className="input"
                value={formData.marketValue}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Current market value in ETH
              </p>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload size={20} />
            Documents (Optional)
          </h2>

          <div>
            <label className="label">IPFS Document Hash</label>
            <input
              type="text"
              name="ipfsHash"
              placeholder="Qm..."
              className="input"
              value={formData.ipfsHash}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload documents to IPFS and paste the hash here
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error.message || "An error occurred"}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary flex-1"
          >
            {isLoading ? (
              "Registering..."
            ) : (
              <>
                Register Property
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-gray-500 text-center">
          Registration requires a blockchain transaction. Make sure you have
          enough ETH for gas fees.
        </p>
      </form>
    </div>
  );
}
