import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const DashboardShell = ({
  navItems,
  activeId,
  title,
  subtitle,
  actions,
  searchId,
  searchPlaceholder,
  children,
}) => {
  return (
    <div className="min-h-screen bg-base text-ink">
      <div className="md:flex">
        <Sidebar items={navItems} activeId={activeId} />
        <div className="flex-1">
          <Topbar
            title={title}
            subtitle={subtitle}
            actions={actions}
            searchId={searchId}
            searchPlaceholder={searchPlaceholder}
          />
          <main className="px-4 pb-16 md:px-8">
            <div className="flex flex-col gap-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardShell;
