import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react";

const alertStyles = {
  success: {
    bg: "bg-green-50 border-green-200",
    text: "text-green-800",
    icon: CheckCircle,
    iconColor: "text-green-500",
  },
  error: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-800",
    icon: XCircle,
    iconColor: "text-red-500",
  },
  warning: {
    bg: "bg-yellow-50 border-yellow-200",
    text: "text-yellow-800",
    icon: AlertCircle,
    iconColor: "text-yellow-500",
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
    icon: Info,
    iconColor: "text-blue-500",
  },
};

export default function Alert({
  type = "info",
  title,
  children,
  className = "",
}) {
  const style = alertStyles[type];
  const Icon = style.icon;

  return (
    <div className={`rounded-lg border p-4 ${style.bg} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`${style.iconColor} mt-0.5 flex-shrink-0`} size={20} />
        <div className="flex-1">
          {title && <h3 className={`font-medium ${style.text}`}>{title}</h3>}
          {children && (
            <div className={`text-sm ${style.text} ${title ? "mt-1" : ""}`}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
