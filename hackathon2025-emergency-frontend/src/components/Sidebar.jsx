import { NavLink } from "react-router-dom";
import { useI18n } from "../i18n";
import Icon from "./Icon";
import Logo from "./Logo";

const Sidebar = ({ items, activeId }) => {
  const { t } = useI18n();

  return (
    <aside className="border-b border-border bg-white/90 px-4 py-6 backdrop-blur md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between md:flex-col md:items-start md:gap-8">
        <Logo />
        <div className="hidden rounded-full border border-border px-3 py-1 text-xs text-muted md:inline-flex">
          {t("sidebar.live", "Live network")}
        </div>
      </div>
      <nav className="mt-6 flex gap-3 overflow-x-auto pb-3 md:flex-col md:overflow-visible">
        {items.map((item) => {
          if (item.href) {
            return (
              <NavLink
                key={item.id}
                to={item.href}
                className={({ isActive }) =>
                  `group flex min-w-[160px] cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors duration-200 md:min-w-0 ${
                    isActive
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-transparent text-muted hover:border-border hover:bg-slate-50"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        isActive
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-500 group-hover:text-primary"
                      }`}
                    >
                      <Icon name={item.icon} className="h-4 w-4" />
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          }

          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              className={`group flex min-w-[160px] cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors duration-200 md:min-w-0 ${
                isActive
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-transparent text-muted hover:border-border hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-500 group-hover:text-primary"
                }`}
              >
                <Icon name={item.icon} className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-8 hidden rounded-3xl border border-border bg-slate-50 p-4 text-sm text-muted md:block">
        <p className="font-semibold text-ink">
          {t("sidebar.needHelp", "Need help?")}
        </p>
        <p className="mt-1 text-xs text-muted">
          {t(
            "sidebar.needHelpDesc",
            "Contact the compliance team for onboarding or risk review."
          )}
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
