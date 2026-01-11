const sizeStyles = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

const variantStyles = {
  primary:
    "bg-cta text-white shadow-soft hover:shadow-card hover:bg-cta/90 border border-transparent",
  secondary:
    "bg-primary text-white shadow-soft hover:shadow-card hover:bg-primary/90 border border-transparent",
  outline:
    "bg-white/80 text-ink border border-border hover:border-slate-300 hover:bg-white",
  ghost: "text-ink hover:bg-slate-100 border border-transparent",
};

const Button = ({
  children,
  size = "md",
  variant = "primary",
  className = "",
  ...props
}) => {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
