import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, USER_PROFILES } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import type { UserId } from "../context/UserContext";

const USER_IDS: UserId[] = ["u1", "u2", "u3"];
const PERSONA_EMOJI: Record<UserId, string> = {
  u1: "🍜",
  u2: "🧋",
  u3: "🛣️",
};

export function UserSwitcher() {
  const { userId, setUserId } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-nets-gray-bg rounded-full px-3 py-1.5 active:opacity-70"
      >
        <span className="text-[15px]">{PERSONA_EMOJI[userId]}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-nets border border-nets-border shadow-lg z-50 w-64 overflow-hidden">
            {USER_IDS.map((id) => {
              const p = USER_PROFILES[id];
              return (
                <button
                  key={id}
                  onClick={() => { setUserId(id); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-nets-gray-bg transition-colors border-b border-nets-border last:border-0 ${
                    userId === id ? "bg-blue-50" : ""
                  }`}
                >
                  <span className="text-xl">{PERSONA_EMOJI[id]}</span>
                  <div className="text-left">
                    <p className="text-[13px] font-semibold text-nets-text">{p.name}</p>
                    <p className="text-[11px] text-nets-muted">{p.persona}</p>
                  </div>
                  {userId === id && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-nets-navy" />
                  )}
                </button>
              );
            })}
            <button
              onClick={() => { setOpen(false); navigate("/settings"); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-nets-gray-bg transition-colors border-t border-nets-border"
            >
              <span className="text-lg">⚙️</span>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-nets-text">Settings</p>
                <p className="text-[11px] text-nets-muted">Privacy, security, preferences</p>
              </div>
            </button>
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors border-t border-nets-border"
            >
              <span className="text-lg">🔒</span>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-red-600">Lock app</p>
                <p className="text-[11px] text-nets-muted">Return to login screen</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
