import { useLocation, useNavigate } from "react-router-dom";

const TABS = [
  {
    id: "home",
    label: "Top-up",
    path: "/",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    ),
  },
  {
    id: "wrapped",
    label: "Wrapped",
    path: "/wrapped",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5 12,3" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="4" y1="7.5" x2="20" y2="7.5" />
      </svg>
    ),
  },
  {
    id: "roam",
    label: "Roam",
    path: "/roam",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    id: "pools",
    label: "Pools",
    path: "/pools",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="3" />
        <circle cx="17" cy="9" r="3" />
        <path d="M2 21c0-4 3.1-7 7-7" />
        <path d="M22 21c0-3.3-2.3-6-5.5-6.8" />
        <path d="M9 14c2.7 0 5 2 5.5 4.7" />
      </svg>
    ),
  },
];

export function NetsTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-nets-border flex z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.path);
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
              active ? "text-nets-navy" : "text-nets-muted"
            }`}
          >
            {tab.icon(active)}
            <span
              className={`text-[9px] font-medium leading-none ${
                active ? "text-nets-navy" : "text-nets-muted"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
