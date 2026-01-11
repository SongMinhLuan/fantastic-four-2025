import Icon from "./Icon";

const toneStyles = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-slate-100 text-slate-600",
};

const StatCard = ({ label, value, delta, icon, tone = "primary" }) => {
  return (
    <div className="rounded-3xl border border-border bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">
            {value}
          </p>
          {delta ? <p className="mt-1 text-xs text-muted">{delta}</p> : null}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneStyles[tone]}`}
        >
          <Icon name={icon} className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
