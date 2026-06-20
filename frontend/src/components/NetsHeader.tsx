import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface NetsHeaderProps {
  title?: string;
  onBack?: () => void;
  rightElement?: ReactNode;
  variant?: "default" | "red";
  showBack?: boolean;
}

export function NetsHeader({
  title,
  onBack,
  rightElement,
  variant = "default",
  showBack = true,
}: NetsHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const bg = variant === "red" ? "bg-nets-red" : "bg-white";
  const textColor = variant === "red" ? "text-white" : "text-nets-text";
  const iconColor = variant === "red" ? "text-white" : "text-nets-text";

  return (
    <div className={`${bg} flex items-center px-5 pt-3 pb-3 min-h-[52px]`}>
      {showBack ? (
        <button
          onClick={handleBack}
          className={`${iconColor} flex items-center justify-center w-8 h-8 -ml-1 rounded-full active:bg-black/5`}
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
      ) : (
        <div className="w-8" />
      )}
      {title && (
        <span className={`flex-1 ml-2 text-[18px] font-semibold ${textColor}`}>{title}</span>
      )}
      <div className="ml-auto">{rightElement}</div>
    </div>
  );
}
