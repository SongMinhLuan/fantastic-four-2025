import { useEffect, useRef, useState } from "react";
import {
  apiRequest,
  clearAuthSession,
  getStoredUser,
  storeAuthUser,
} from "../api/client";
import { useI18n } from "../i18n";

const getInitials = (name, email) => {
  const value = name || email || "";
  const parts = value.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return "IF";
};

const Topbar = ({
  title,
  subtitle,
  searchPlaceholder,
  actions,
  searchId = "dashboard-search",
}) => {
  const { t, lang, setLang } = useI18n();
  const [user, setUser] = useState(() => getStoredUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
      setUser(stored || null);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    window.location.assign("/");
  };

  useEffect(() => {
    loadUser();
    const handleAuth = () => loadUser();
    const handleStorage = (event) => {
      if (event.key && event.key.startsWith("iflow_")) {
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

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const resolvedPlaceholder =
    searchPlaceholder ||
    t("common.searchPlaceholder", "Search invoices, SMEs, investors");
  const roleLabel = user ? t(`role.${user.role}`, user.role) : "";

  return (
    <header className="px-4 pb-4 pt-6 md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            {subtitle}
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink md:text-3xl">
            {title}
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-72">
            <label htmlFor={searchId} className="sr-only">
              {t("common.search", "Search")}
            </label>
            <input
              id={searchId}
              type="search"
              placeholder={resolvedPlaceholder}
              className="w-full rounded-full border border-border bg-white px-4 py-2 text-sm text-ink placeholder:text-muted shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2">{actions}</div>
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-3 rounded-full border border-border bg-white px-3 py-1.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {getInitials(user.name, user.email)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-ink">
                    {user.name || "InvoiceFlow"}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
                    {roleLabel}
                  </p>
                </div>
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-border bg-white p-2 text-sm shadow-card"
                >
                  <div className="px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-muted">
                    {t("common.language", "Language")}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLang("en");
                      setMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors duration-150 ${
                      lang === "en"
                        ? "bg-primary/10 text-primary"
                        : "text-muted hover:bg-slate-50 hover:text-ink"
                    }`}
                  >
                    {t("common.english", "English")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLang("vi");
                      setMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors duration-150 ${
                      lang === "vi"
                        ? "bg-primary/10 text-primary"
                        : "text-muted hover:bg-slate-50 hover:text-ink"
                    }`}
                  >
                    {t("common.vietnamese", "Vietnamese")}
                  </button>
                  <div className="my-2 h-px bg-border" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-danger transition-colors duration-150 hover:bg-danger/10"
                  >
                    {t("common.logout", "Logout")}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
