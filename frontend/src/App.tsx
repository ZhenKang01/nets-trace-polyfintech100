import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { NetsTabBar } from "./components/NetsTabBar";
import { HomeScreen } from "./screens/HomeScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { WrappedScreen } from "./screens/WrappedScreen";
import { RoamScreen } from "./screens/RoamScreen";
import { PoolsScreen } from "./screens/PoolsScreen";
import { PoolDetailScreen } from "./screens/PoolDetailScreen";
import { JoinPreviewScreen } from "./screens/JoinPreviewScreen";

function PhoneShell() {
  return (
    <div
      className="phone-shell relative"
      style={{
        borderRadius: "40px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 0 12px #1a1a1a, 0 0 0 13px #333",
      }}
    >
      {/* Notch */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 z-[100]"
        style={{ width: 112, height: 24, background: "#1a1a1a", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}
      />

      {/* Screen */}
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: "40px" }}>
        <div className="absolute inset-0 pt-6">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="/wrapped" element={<WrappedScreen />} />
            <Route path="/roam" element={<RoamScreen />} />
            <Route path="/pools" element={<PoolsScreen />} />
            <Route path="/pools/:poolId" element={<PoolDetailScreen />} />
            <Route path="/join/:code" element={<JoinPreviewScreen />} />
          </Routes>
        </div>
        <NetsTabBar />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div
          className="flex items-center justify-center min-h-screen"
          style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}
        >
          <PhoneShell />
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}
