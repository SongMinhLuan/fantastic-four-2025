const badgeStyles = {
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
};

const Badge = ({ children, tone = "primary", className = "" }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${badgeStyles[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
