import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-yellow-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mb-8 shadow-xl animate-bounce">
        <span className="text-5xl font-bold text-white">404</span>
      </div>

      <h1 className="text-4xl font-bold text-gray-900 mb-3">
        Oops! Page Not Found
      </h1>
      <p className="text-gray-500 mb-8 max-w-md text-lg">
        The page you're looking for doesn't exist or may have been moved to a
        new location.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => window.history.back()}
          className="btn btn-outline px-6 py-3"
        >
          <ArrowLeft size={20} />
          Go Back
        </button>
        <Link to="/" className="btn btn-primary px-6 py-3 shadow-lg">
          <Home size={20} />
          Back to Home
        </Link>
        <Link to="/properties" className="btn btn-secondary px-6 py-3">
          <Search size={20} />
          Browse Properties
        </Link>
      </div>
    </div>
  );
}
