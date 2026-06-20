export function NetsLogo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-black tracking-tight text-nets-red select-none ${className}`}
      style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-0.03em" }}
    >
      NETS
    </span>
  );
}
