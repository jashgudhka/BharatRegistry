import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="text-yellow-600" size={40} />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => window.history.back()}
          className="btn btn-outline"
        >
          <ArrowLeft size={20} />
          Go Back
        </button>
        <Link to="/" className="btn btn-primary">
          <Home size={20} />
          Home
        </Link>
      </div>
    </div>
  );
}
