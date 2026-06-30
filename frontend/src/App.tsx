import { BrowserRouter, Routes, Route } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserProvider } from "./context/UserContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TripProvider } from "./context/TripContext";
import { NetsTabBar } from "./components/NetsTabBar";
import { RoamActivationOverlay } from "./components/RoamActivationOverlay";
import { AuthScreen } from "./screens/AuthScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { WrappedScreen } from "./screens/WrappedScreen";
import { RoamScreen } from "./screens/RoamScreen";
import { PoolsScreen } from "./screens/PoolsScreen";
import { PoolDetailScreen } from "./screens/PoolDetailScreen";
import { JoinPreviewScreen } from "./screens/JoinPreviewScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

// Auth gate rendered inside the phone screen
function PhoneContent() {
  const { isAuthenticated } = useAuth();

  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <AuthScreen key="auth" />
      ) : (
        <motion.div
          key="dashboard"
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="absolute inset-0 pt-6">
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/history" element={<HistoryScreen />} />
              <Route path="/wrapped" element={<WrappedScreen />} />
              <Route path="/roam" element={<RoamScreen />} />
              <Route path="/pools" element={<PoolsScreen />} />
              <Route path="/pools/:poolId" element={<PoolDetailScreen />} />
              <Route path="/join/:code" element={<JoinPreviewScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
            </Routes>
          </div>
          <NetsTabBar />
          <RoamActivationOverlay />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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
        <PhoneContent />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <BrowserRouter>
          <TripProvider>
            <div
              className="flex items-center justify-center min-h-screen"
              style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}
            >
              <PhoneShell />
            </div>
          </TripProvider>
        </BrowserRouter>
      </UserProvider>
    </AuthProvider>
  );
}
