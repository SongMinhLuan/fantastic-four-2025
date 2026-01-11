import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { apiRequest, clearAuthSession, getStoredUser, storeAuthUser } from "./api/client";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import InvestorDashboard from "./pages/InvestorDashboard";
import InvestorPortfolio from "./pages/InvestorPortfolio";
import InvestorSettings from "./pages/InvestorSettings";
import SmeDashboard from "./pages/SmeDashboard";
import SmePortfolio from "./pages/SmePortfolio";
import SmeSettings from "./pages/SmeSettings";

const getDefaultPathForRole = (role) => {
  if (role === "admin") {
    return "/admin";
  }
  if (role === "investor") {
    return "/investor/market";
  }
  if (role === "sme") {
    return "/sme/marketplace";
  }
  return "/";
};

const GuardedRoute = ({ user, role, children }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />;
  }
  return children;
};

const App = () => {
  const [user, setUser] = useState(() => getStoredUser());
  const defaultPath = useMemo(
    () => (user ? getDefaultPathForRole(user.role) : "/"),
    [user]
  );

  const loadUser = async () => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }

    const token = localStorage.getItem("iflow_token");
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const payload = await apiRequest("/auth/me", { token });
      const nextUser = payload?.data || stored || null;
      setUser(nextUser);
      storeAuthUser(nextUser, { notify: false });
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        clearAuthSession();
        setUser(null);
        return;
      }
      setUser((prev) => prev || stored || null);
    }
  };

  useEffect(() => {
    loadUser();
    const handleAuth = () => loadUser();
    const handleStorage = (event) => {
      if (event.key && event.key.startsWith("iflow_token")) {
        loadUser();
      }
    };

    window.addEventListener("iflow-auth", handleAuth);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("iflow-auth", handleAuth);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-base text-ink">
        <Routes>
          <Route path="/" element={user ? <Navigate to={defaultPath} replace /> : <Home />} />
          <Route
            path="/admin"
            element={
              <GuardedRoute user={user} role="admin">
                <AdminDashboard />
              </GuardedRoute>
            }
          />
          <Route
            path="/investor"
            element={
              <GuardedRoute user={user} role="investor">
                <Navigate to="/investor/market" replace />
              </GuardedRoute>
            }
          />
          <Route
            path="/investor/market"
            element={
              <GuardedRoute user={user} role="investor">
                <InvestorDashboard />
              </GuardedRoute>
            }
          />
          <Route
            path="/investor/portfolio"
            element={
              <GuardedRoute user={user} role="investor">
                <InvestorPortfolio />
              </GuardedRoute>
            }
          />
          <Route
            path="/investor/settings"
            element={
              <GuardedRoute user={user} role="investor">
                <InvestorSettings />
              </GuardedRoute>
            }
          />
          <Route
            path="/sme"
            element={
              <GuardedRoute user={user} role="sme">
                <Navigate to="/sme/marketplace" replace />
              </GuardedRoute>
            }
          />
          <Route
            path="/sme/marketplace"
            element={
              <GuardedRoute user={user} role="sme">
                <SmeDashboard />
              </GuardedRoute>
            }
          />
          <Route
            path="/sme/portfolio"
            element={
              <GuardedRoute user={user} role="sme">
                <SmePortfolio />
              </GuardedRoute>
            }
          />
          <Route
            path="/sme/settings"
            element={
              <GuardedRoute user={user} role="sme">
                <SmeSettings />
              </GuardedRoute>
            }
          />
          <Route path="*" element={<Navigate to={user ? defaultPath : "/"} replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
