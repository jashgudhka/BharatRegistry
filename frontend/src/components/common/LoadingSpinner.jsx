import { Loader2 } from "lucide-react";

export function LoadingSpinner({ size = "md", className = "" }) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return <Loader2 className={`animate-spin ${sizes[size]} ${className}`} />;
}

export function LoadingPage() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <LoadingSpinner size="xl" className="text-primary-500" />
      <p className="mt-4 text-gray-500">Loading...</p>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
}

export default LoadingSpinner;
