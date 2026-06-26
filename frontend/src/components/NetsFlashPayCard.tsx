import { useUser } from "../context/UserContext";

const fmt = (n: number) =>
  n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function NetsFlashPayCard() {
  const { balance } = useUser();

  return (
    <div
      className="rounded-[16px] p-5 text-white relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1B3464 0%, #2B5CBF 60%, #3B82F6 100%)",
        minHeight: 140,
      }}
    >
      {/* NETS watermark */}
      <div
        className="absolute -right-4 -top-4 text-[80px] font-black opacity-10 text-white select-none leading-none"
        style={{ letterSpacing: "-0.04em" }}
      >
        NETS
      </div>

      {/* Top row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">FlashPay</p>
          <p className="text-[22px] font-bold mt-0.5">
            SGD {fmt(balance)}
          </p>
        </div>
        <div className="bg-white/20 rounded-full p-1.5">
          {/* NFC icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10" />
            <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6" />
            <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2" />
          </svg>
        </div>
      </div>

      {/* Card number dots */}
      <div className="flex gap-1 items-center">
        {[0, 1, 2, 3].map((g) => (
          <div key={g} className="flex gap-0.5">
            {[0, 1, 2, 3].map((d) => (
              <div key={d} className="w-1.5 h-1.5 rounded-full bg-white/60" />
            ))}
            {g < 3 && <div className="w-2" />}
          </div>
        ))}
      </div>
    </div>
  );
}
