import type { ButtonHTMLAttributes, ReactNode } from "react";

interface NetsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

export function NetsButton({ variant = "primary", className = "", children, ...props }: NetsButtonProps) {
  const base = "w-full h-[52px] flex items-center justify-center text-[16px] font-semibold rounded-[10px] transition-opacity active:opacity-80 disabled:opacity-50";
  const variants = {
    primary: "bg-nets-navy text-white",
    secondary: "bg-nets-gray-bg text-nets-text border border-nets-border",
    ghost: "bg-transparent text-nets-navy",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
