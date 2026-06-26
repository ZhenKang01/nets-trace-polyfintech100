import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import { NetsHeader } from "../components/NetsHeader";
import { useUser, USER_PROFILES, type UserId } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";

// ── Mock identity data per persona ─────────────────────────────────────────────

const USER_META: Record<UserId, {
  email: string; phone: string; color: string; initials: string; member: string;
}> = {
  u1: { email: "a***t@gmail.com",  phone: "+65 9••• ••67", color: "#1B3464", initials: "AT", member: "since Jan 2022" },
  u2: { email: "j***l@gmail.com",  phone: "+65 8••• ••23", color: "#7C3AED", initials: "JL", member: "since Mar 2023" },
  u3: { email: "s***k@gmail.com",  phone: "+65 9••• ••89", color: "#16a34a", initials: "SK", member: "since Sep 2021" },
};

const DEMO_PERSONAS: { id: UserId; emoji: string }[] = [
  { id: "u1", emoji: "🍜" },
  { id: "u2", emoji: "🧋" },
  { id: "u3", emoji: "🛣️" },
];

// ── UI primitives ──────────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <p className="text-[11px] font-semibold text-nets-muted uppercase tracking-wider px-1 pt-5 pb-1.5">
      {title}
    </p>
  );
}

function SettingsCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-nets border border-nets-border shadow-sm overflow-hidden divide-y divide-nets-border ${className}`}>
      {children}
    </div>
  );
}

function Row({
  icon,
  label,
  sublabel,
  value,
  chevron = false,
  danger = false,
  onPress,
}: {
  icon?: string;
  label: string;
  sublabel?: string;
  value?: string;
  chevron?: boolean;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <button
      onClick={onPress}
      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 text-left"
    >
      {icon && (
        <div className="w-8 h-8 rounded-xl bg-nets-gray-bg flex items-center justify-center shrink-0 text-[16px]">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-medium leading-snug ${danger ? "text-red-600" : "text-nets-text"}`}>
          {label}
        </p>
        {sublabel && <p className="text-[11px] text-nets-muted mt-0.5 leading-snug">{sublabel}</p>}
      </div>
      {value && <p className="text-[13px] text-nets-muted shrink-0 ml-1">{value}</p>}
      {chevron && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9,18 15,12 9,6" />
        </svg>
      )}
    </button>
  );
}

function ToggleRow({
  icon,
  label,
  sublabel,
  enabled,
  onToggle,
  accent = "navy",
}: {
  icon?: string;
  label: string;
  sublabel?: string;
  enabled: boolean;
  onToggle: () => void;
  accent?: "navy" | "green" | "violet";
}) {
  const ON_COLOR = { navy: "#1B3464", green: "#16a34a", violet: "#7C3AED" }[accent];
  return (
    <div className="w-full flex items-center gap-3 px-4 py-3.5">
      {icon && (
        <div className="w-8 h-8 rounded-xl bg-nets-gray-bg flex items-center justify-center shrink-0 text-[16px]">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-nets-text leading-snug">{label}</p>
        {sublabel && <p className="text-[11px] text-nets-muted mt-0.5 leading-snug">{sublabel}</p>}
      </div>
      <motion.button
        onClick={onToggle}
        className="relative w-11 h-6 rounded-full shrink-0 focus:outline-none"
        style={{ background: enabled ? ON_COLOR : "#d1d5db" }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ left: enabled ? "calc(100% - 20px)" : "4px" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
}

// ── Privacy transparency panel ─────────────────────────────────────────────────

function PrivacyPanel() {
  return (
    <div
      className="rounded-nets p-4 border border-blue-200"
      style={{ background: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)" }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[18px]"
          style={{ background: "linear-gradient(135deg, #1B3464, #2B5CBF)" }}
        >
          🛡️
        </div>
        <div>
          <p className="text-[13px] font-bold text-nets-navy">Data Transparency</p>
          <p className="text-[12px] font-semibold text-nets-navy/80 mt-0.5 leading-snug">
            NETS sees <span className="underline decoration-dotted">HOW</span> and{" "}
            <span className="underline decoration-dotted">WHERE</span> you spend —{" "}
            <span className="font-black">never WHO you are.</span>
          </p>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        {[
          ["📊", "Behavioural patterns", "Merchant categories, time-of-day, frequency"],
          ["📍", "Location metadata", "District-level only — not GPS coordinates"],
          ["📈", "Spending velocity", "Trends and habits — not your balance or identity"],
        ].map(([emoji, title, desc]) => (
          <div key={title} className="flex items-start gap-2.5">
            <span className="text-[13px] mt-0.5">{emoji}</span>
            <div>
              <span className="text-[12px] font-semibold text-nets-navy">{title} </span>
              <span className="text-[12px] text-nets-muted">{desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/70 rounded-xl px-3 py-2 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
        <p className="text-[11px] text-nets-muted font-medium">
          We never sell, share, or link this data to your real-world identity.
        </p>
      </div>
    </div>
  );
}

// ── Linked bank row ────────────────────────────────────────────────────────────

function LinkedBankRow() {
  return (
    <div className="px-4 py-3.5 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0">
        <span className="text-white text-[9px] font-black">DBS</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-nets-text">DBS eSavings ••••4892</p>
        <p className="text-[11px] text-nets-muted mt-0.5">Direct debit · Active · Verified</p>
      </div>
      <span className="text-[10px] font-semibold text-green-700 bg-green-100 rounded-full px-2.5 py-0.5">
        Primary
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="9,18 15,12 9,6" />
      </svg>
    </div>
  );
}

// ── Transaction limit row ──────────────────────────────────────────────────────

function TxLimitRow({ onPress }: { onPress: () => void }) {
  return (
    <button onClick={onPress} className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 text-left">
      <div className="w-8 h-8 rounded-xl bg-nets-gray-bg flex items-center justify-center shrink-0 text-[16px]">💳</div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-nets-text">Transaction limits</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] text-nets-muted bg-nets-gray-bg rounded-full px-2 py-0.5">Daily S$5,000</span>
          <span className="text-[10px] text-nets-muted bg-nets-gray-bg rounded-full px-2 py-0.5">Per txn S$1,000</span>
          <span className="text-[10px] text-nets-muted bg-nets-gray-bg rounded-full px-2 py-0.5">QR S$2,000</span>
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="9,18 15,12 9,6" />
      </svg>
    </button>
  );
}

// ── Demo user switcher ─────────────────────────────────────────────────────────

function DemoUserSwitcher() {
  const { userId, setUserId } = useUser();

  return (
    <div className="px-4 py-4 space-y-2">
      <p className="text-[11px] font-semibold text-nets-muted uppercase tracking-wider mb-3">
        Active persona
      </p>
      {DEMO_PERSONAS.map(({ id, emoji }) => {
        const profile = USER_PROFILES[id];
        const meta = USER_META[id];
        const active = userId === id;
        return (
          <motion.button
            key={id}
            onClick={() => setUserId(id)}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 border-2 transition-colors text-left ${
              active
                ? "border-nets-navy bg-blue-50"
                : "border-nets-border bg-white active:bg-gray-50"
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
              style={{ background: meta.color }}
            >
              {meta.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-nets-text">
                {emoji} {profile.name}
              </p>
              <p className="text-[11px] text-nets-muted">{profile.persona}</p>
            </div>
            {active && (
              <motion.div
                className="w-5 h-5 rounded-full bg-nets-navy flex items-center justify-center shrink-0"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const { userId, balance } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const profile = USER_PROFILES[userId];
  const meta = USER_META[userId];

  // Security toggles (visual only at this stage)
  const [biometric, setBiometric] = useState(true);

  // Privacy toggles (visual at this stage — wiring comes next)
  const [personalInsights, setPersonalInsights] = useState(true);
  const [poolSuggestions, setPoolSuggestions] = useState(true);

  // Notification toggles (visual)
  const [notifPayments, setNotifPayments] = useState(true);
  const [notifRoam, setNotifRoam] = useState(true);
  const [notifPools, setNotifPools] = useState(true);
  const [notifDeals, setNotifDeals] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const soon = (msg = "Coming soon") => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col h-full bg-nets-gray-bg relative">
      <NetsHeader title="Settings" />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="absolute top-14 left-4 right-4 z-50 bg-[#1A1A2E] text-white rounded-xl px-4 py-3 text-[13px] font-medium shadow-xl text-center"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-4 pb-[90px]">

        {/* ── Profile summary ── */}
        <div className="mt-4 bg-white rounded-nets border border-nets-border shadow-sm p-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-[20px] font-bold shrink-0"
              style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)` }}
            >
              {meta.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] font-bold text-nets-text">{profile.name}</p>
              <p className="text-[12px] text-nets-muted mt-0.5">{profile.persona}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <p className="text-[11px] text-nets-muted">NETS Circles member {meta.member}</p>
              </div>
            </div>
            <button
              onClick={() => soon("Profile editing coming soon")}
              className="text-nets-navy text-[12px] font-semibold active:opacity-70 shrink-0"
            >
              Edit
            </button>
          </div>

          {/* Quick stats */}
          <div className="mt-4 pt-4 border-t border-nets-border grid grid-cols-3 gap-2 text-center">
            {[
              { label: "FlashPay", value: `S$${fmt(balance)}` },
              { label: "Linked cards", value: "3" },
              { label: "Active pools", value: "2" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[14px] font-bold text-nets-text">{value}</p>
                <p className="text-[10px] text-nets-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Account & Profile ── */}
        <SectionLabel title="Account & Profile" />
        <SettingsCard>
          <LinkedBankRow />
          <Row icon="💳" label="Manage NETS cards"
            sublabel="FlashPay, Motoring Card, vCashCard"
            chevron onPress={() => soon()} />
          <Row icon="👤" label="Personal information"
            sublabel={`${meta.email} · ${meta.phone}`}
            chevron onPress={() => soon()} />
          <Row icon="🔗" label="Linked services"
            sublabel="Grab, Singtel Dash, EZ-Link"
            chevron onPress={() => soon()} />
        </SettingsCard>

        {/* ── Security ── */}
        <SectionLabel title="Security" />
        <SettingsCard>
          <ToggleRow icon="🔒" label="Face / Touch ID"
            sublabel="Use biometrics to unlock and authorise"
            enabled={biometric} onToggle={() => setBiometric((v) => !v)} accent="navy" />
          <Row icon="🔑" label="App PIN"
            sublabel="Change your 6-digit login PIN"
            chevron onPress={() => soon("PIN management coming soon")} />
          <TxLimitRow onPress={() => soon("Transaction limit adjustment coming soon")} />
          <Row icon="📱" label="Trusted devices"
            sublabel="iPhone 16 Pro · This device · Singapore"
            value="1 device" chevron onPress={() => soon()} />
          <Row icon="📋" label="Login activity"
            sublabel="Last login: Today, 09:14 AM"
            chevron onPress={() => soon()} />
        </SettingsCard>

        {/* ── Privacy & Data ── */}
        <SectionLabel title="Privacy & Data" />

        {/* Transparency panel — full width, before the card */}
        <div className="mb-3">
          <PrivacyPanel />
        </div>

        <SettingsCard>
          <ToggleRow
            icon="✨"
            label="Personalised insights"
            sublabel="Wrapped stories, spending analysis, habit nudges"
            enabled={personalInsights}
            onToggle={() => setPersonalInsights((v) => !v)}
            accent="violet"
          />
          <ToggleRow
            icon="👥"
            label="Inferred pool suggestions"
            sublabel="AI suggests group pools based on shared spending"
            enabled={poolSuggestions}
            onToggle={() => setPoolSuggestions((v) => !v)}
            accent="violet"
          />
          <Row icon="📥" label="Download my data"
            sublabel="Export a copy of your transaction history"
            chevron onPress={() => soon("Data export coming soon")} />
          <Row icon="🔐" label="Manage app permissions"
            sublabel="Camera, location, notifications"
            chevron onPress={() => soon()} />
        </SettingsCard>

        {/* ── Notifications ── */}
        <SectionLabel title="Notifications" />
        <SettingsCard>
          <ToggleRow icon="💸" label="Payment alerts"
            sublabel="Instant alerts for every transaction"
            enabled={notifPayments} onToggle={() => setNotifPayments((v) => !v)} />
          <ToggleRow icon="🌏" label="Trip & Roam alerts"
            sublabel="Activation, deactivation, usage while overseas"
            enabled={notifRoam} onToggle={() => setNotifRoam((v) => !v)} />
          <ToggleRow icon="👥" label="Pool activity"
            sublabel="Expenses added, settlements, new members"
            enabled={notifPools} onToggle={() => setNotifPools((v) => !v)} />
          <ToggleRow icon="🎁" label="Deals & rewards"
            sublabel="Personalised offers based on your habits"
            enabled={notifDeals} onToggle={() => setNotifDeals((v) => !v)} accent="green" />
        </SettingsCard>

        {/* ── Preferences ── */}
        <SectionLabel title="Preferences" />
        <SettingsCard>
          <Row icon="💱" label="Display currency"
            value="SGD" chevron onPress={() => soon()} />
          <Row icon="🌐" label="Language"
            value="English" chevron onPress={() => soon()} />
          <Row icon="🎨" label="App appearance"
            value="System" chevron onPress={() => soon()} />
        </SettingsCard>

        {/* ── Demo ── */}
        <SectionLabel title="Demo — Switch Persona" />
        <div className="bg-white rounded-nets border border-nets-border shadow-sm overflow-hidden">
          <div className="px-4 pt-3 pb-1 border-b border-nets-border flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #1B3464, #2B5CBF)" }}
            >
              <span className="text-white text-[8px] font-black">N</span>
            </div>
            <p className="text-[12px] font-semibold text-nets-muted">
              PolyFinTech100 Hackathon 2026 · Live demo switcher
            </p>
          </div>
          <DemoUserSwitcher />
        </div>

        {/* ── App ── */}
        <SectionLabel title="App" />
        <SettingsCard>
          <Row icon="ℹ️" label="About NETS Circles"
            sublabel="PolyFinTech100 Hackathon 2026 submission"
            chevron onPress={() => soon()} />
          <Row label="Version" value="1.0.0 (build 2026.1)" />
          <Row icon="🆘" label="Help & Support" chevron onPress={() => soon()} />
          <Row icon="📄" label="Terms & Conditions" chevron onPress={() => soon()} />
          <Row icon="🔒" label="Privacy Policy" chevron onPress={() => soon()} />
        </SettingsCard>

        {/* Log out */}
        <div className="mt-3 mb-2">
          <SettingsCard>
            <Row
              icon="🚪"
              label="Log out"
              sublabel="Return to login screen"
              danger
              onPress={() => { logout(); navigate("/"); }}
            />
          </SettingsCard>
        </div>

      </div>
    </div>
  );
}
