import type { ReactNode } from "react";

interface NetsCardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function NetsCard({ children, className = "", padding = true }: NetsCardProps) {
  return (
    <div
      className={`bg-white rounded-nets border border-nets-border shadow-sm ${padding ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
